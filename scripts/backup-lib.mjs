// @ts-check
/**
 * Общие helpers для скриптов бэкапа базы данных (scripts/backup-*.mjs).
 *
 * Скрипты написаны на Node (.mjs) с JSDoc-типизацией и без внешних зависимостей:
 * Supabase CLI, psql и git вызываются как обычные CLI-команды.
 *
 * Имя файла бэкапа: `<kind>_<YYYY-MM-DD>_<HHMMSS>Z.sql` (время — UTC),
 * например `map_2026-10-20_040000Z.sql`.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Корень репозитория. */
export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** Локальная папка с бэкапами (лежит в .gitignore). */
export const BACKUPS_DIR = path.join(ROOT_DIR, "backups");

/**
 * Таблицы основного бэкапа `map_<время>.sql`.
 * ВАЖНО: новые таблицы в схеме `public` нужно классифицировать здесь или в
 * COMMENT_TABLES, иначе они попадут в оба бэкапа.
 */
export const MAP_TABLES = ["blocks", "transitions", "shop_items", "roles", "user_roles"];
/** Таблицы отдельного бэкапа комментариев `comments_<время>.sql`. */
export const COMMENT_TABLES = ["comments"];
/** Допустимые значения --kind при восстановлении. */
export const RESTORE_KINDS = ["map", "comments", "all"];

const FILE_NAME_RE = /^(map|comments)_(\d{4}-\d{2}-\d{2})_(\d{6})Z\.sql$/;
const WIN_CMD_SPECIAL_RE = /[\s&|<>()^"%]/;

/**
 * Файл бэкапа.
 * @typedef {Object} BackupFile
 * @property {"map" | "comments"} kind  Вид бэкапа.
 * @property {Date} date  Момент создания (UTC).
 * @property {string} name  Имя файла без каталога.
 * @property {string} file  Полный путь к файлу.
 * @property {number} size  Размер в байтах.
 */

// ============ Окружение и аргументы командной строки ============

/** Читает `.env` из корня проекта (не перезаписывает переменные окружения). */
export function loadEnv() {
  const envPath = path.join(ROOT_DIR, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

/**
 * Разбирает аргументы командной строки:
 * `--флаг`, `--флаг=значение`, `--флаг значение`.
 * @param {string[]} argv
 * @returns {Record<string, unknown>}
 */
export function parseArgs(argv) {
  /** @type {Record<string, unknown>} */
  const args = { _: /** @type {string[]} */ ([]) };
  const positional = /** @type {string[]} */ (args._);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    if (eq !== -1) {
      args[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

/**
 * @param {Record<string, unknown>} args
 * @param {string} name
 * @returns {boolean}
 */
export function getFlag(args, name) {
  return args[name] === true;
}

/**
 * @param {Record<string, unknown>} args
 * @param {string} name
 * @returns {string | undefined}
 */
export function getStringOption(args, name) {
  const value = args[name];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`Флаг --${name} требует значения`);
  return value;
}

/**
 * @param {Record<string, unknown>} args
 * @param {string} name
 * @returns {number | undefined}
 */
export function getNumberOption(args, name) {
  const value = getStringOption(args, name);
  if (value === undefined) return undefined;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) {
    throw new Error(`--${name}: ожидается целое неотрицательное число, получено "${value}"`);
  }
  return num;
}

// ============ Запуск внешних команд ============

/**
 * Экранирует аргумент для cmd.exe (на Windows npm-шимы `npx`/`supabase` —
 * это .cmd-файлы, поэтому команды запускаются через оболочку).
 * @param {string} arg
 */
function quoteWinArg(arg) {
  if (!WIN_CMD_SPECIAL_RE.test(arg)) return arg;
  return `"${arg.replace(/"/g, '""')}"`;
}

/**
 * Запускает внешнюю команду и дожидается завершения.
 * @param {string} command
 * @param {string[]} [args]
 * @param {{cwd?: string, env?: Record<string, string>, stdin?: string, echo?: boolean, allowFailure?: boolean}} [options]
 * @returns {Promise<{stdout: string, stderr: string, code: number}>}
 */
export function run(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const spawnOptions = {
      cwd: options.cwd ?? ROOT_DIR,
      env: { ...process.env, ...options.env },
      stdio: /** @type {const} */ (["pipe", "pipe", "pipe"]),
    };
    const useShell = process.platform === "win32";
    const commandLine = [command, ...args].map(quoteWinArg).join(" ");
    const child = useShell
      ? spawn(commandLine, { ...spawnOptions, shell: true })
      : spawn(command, args, spawnOptions);

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (options.echo) process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (options.echo) process.stderr.write(text);
    });
    child.on("error", (error) => {
      reject(new Error(redactSecrets(`Не удалось запустить \`${command}\`: ${error.message}`)));
    });
    child.stdin.on("error", () => {
      // psql/docker могли закрыть stdin раньше времени — ошибка проявится в "close"
    });
    child.stdin.end(options.stdin ?? "");
    child.on("close", (code) => {
      const result = { stdout, stderr, code: code ?? -1 };
      if (code === 0 || options.allowFailure) {
        resolve(result);
      } else {
        reject(
          new Error(
            redactSecrets(
              `Команда \`${command} ${args.join(" ")}\` завершилась с кодом ${code}\n${stderr || stdout}`,
            ),
          ),
        );
      }
    });
  });
}

/**
 * Проверяет, доступна ли внешняя команда.
 * @param {string} command
 */
export async function commandWorks(command) {
  const result = await run(command, ["--version"], { allowFailure: true }).catch(() => null);
  return result !== null && result.code === 0;
}

/**
 * Определяет по тексту ошибки, что проблема в незапущенном демоне Docker.
 * @param {string} message
 */
export function isDockerDaemonError(message) {
  return /docker image|docker API|dockerDesktopLinuxEngine|daemon is running/i.test(message);
}

/**
 * Определяет ошибки DNS внутри Docker-контейнера.
 * @param {string} message
 */
export function isDockerDnsError(message) {
  return /could not translate host name|name or service not known|temporary failure in name resolution|NXDOMAIN/i.test(
    message,
  );
}

/** Подсказка при проблемах DNS внутри Docker-контейнеров. */
export const DOCKER_DNS_HINT =
  "Подсказка: DNS внутри Docker-контейнера не разрешил имя БД. В Docker Desktop: Settings -> Resources -> Network ->\n" +
  'включите "Use custom DNS servers", укажите 1.1.1.1 (или 8.8.8.8) -> Apply & restart.\n' +
  "Проверка: docker run --rm alpine nslookup <имя-хоста-из-SUPABASE_DB_URL>";

/**
 * Убирает пароли/токены из URL в тексте (postgresql://user:pass@..., git-токены),
 * чтобы секреты не попадали в сообщения об ошибках и логи.
 * @param {string} text
 */
export function redactSecrets(text) {
  return text.replace(/(:\/\/[^:\s]+:)[^@\s]+(@)/g, "$1***$2");
}

/** Возвращает команду Supabase CLI: ["supabase"] или ["npx", "supabase"]. */
export async function resolveSupabaseCmd() {
  const override = process.env.SUPABASE_BIN;
  if (override) return [override];
  if (await commandWorks("supabase")) return ["supabase"];
  if (await commandWorks("npx")) return ["npx", "supabase"];
  throw new Error(
    "Не найден Supabase CLI. Выполните `npm install` (CLI есть в devDependencies) или установите его глобально.",
  );
}

// ============ Подключение к базе (psql) ============

/**
 * Разбирает postgresql:// URL в переменные окружения psql (PG*),
 * чтобы пароль не попадал в аргументы командной строки.
 * @param {string} databaseUrl
 * @returns {Record<string, string>}
 */
export function dbEnvFromUrl(databaseUrl) {
  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error(`Некорректный SUPABASE_DB_URL: ${databaseUrl}`);
  }
  if (!/^postgres(ql)?:$/.test(parsed.protocol)) {
    throw new Error("SUPABASE_DB_URL должен начинаться с postgresql://");
  }
  return {
    PGHOST: decodeURIComponent(parsed.hostname),
    PGPORT: parsed.port || "5432",
    PGUSER: decodeURIComponent(parsed.username || "postgres"),
    PGPASSWORD: decodeURIComponent(parsed.password || ""),
    PGDATABASE: decodeURIComponent(parsed.pathname.replace(/^\//, "") || "postgres"),
    PGSSLMODE: parsed.searchParams.get("sslmode") || "require",
  };
}

/** Флаги docker run для проброса переменных PG* в контейнер. */
const DOCKER_PG_ENV_FLAGS = [
  "-e",
  "PGHOST",
  "-e",
  "PGPORT",
  "-e",
  "PGUSER",
  "-e",
  "PGPASSWORD",
  "-e",
  "PGDATABASE",
  "-e",
  "PGSSLMODE",
];

/**
 * Выполняет SQL через psql (или docker-фоллбэк с образом postgres:17)
 * одной транзакцией. Строки `\restrict`/`\unrestrict` из вывода pg_dump 17+
 * удаляются — их не понимают старые версии psql.
 * @param {string} sql
 * @param {Record<string, string>} dbEnv
 */
export async function runPsqlSql(sql, dbEnv) {
  const text = sql.replace(/^\\(?:un)?restrict\b.*$/gim, "");
  if (await commandWorks("psql")) {
    return run("psql", ["-v", "ON_ERROR_STOP=1"], { env: dbEnv, stdin: text, echo: true });
  }
  if (await commandWorks("docker")) {
    console.log("psql не найден — использую Docker (образ postgres:17)");
    try {
      return await run(
        "docker",
        [
          "run",
          "--rm",
          "-i",
          // Публичные DNS на случай сломанного DNS-форвардера Docker Desktop
          "--dns",
          "1.1.1.1",
          "--dns",
          "8.8.8.8",
          ...DOCKER_PG_ENV_FLAGS,
          "postgres:17",
          "psql",
          "-v",
          "ON_ERROR_STOP=1",
        ],
        { env: dbEnv, stdin: text, echo: true },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isDockerDaemonError(message)) {
        throw new Error(
          `${message}\nПодсказка: запустите Docker Desktop либо установите psql (PostgreSQL client).`,
        );
      }
      if (isDockerDnsError(message)) {
        throw new Error(`${message}\n${DOCKER_DNS_HINT}`);
      }
      throw error;
    }
  }
  throw new Error(
    "Не найден psql. Установите PostgreSQL client (psql) либо Docker (будет использован образ postgres:17).",
  );
}

// ============ Файлы бэкапов ============

/**
 * Имя файла бэкапа, например `map_2026-10-20_040000Z.sql`.
 * @param {"map" | "comments"} kind
 * @param {Date} date
 */
export function backupFileName(kind, date) {
  const iso = date.toISOString();
  const stamp = `${iso.slice(0, 10)}_${iso.slice(11, 19).replaceAll(":", "")}Z`;
  return `${kind}_${stamp}.sql`;
}

/**
 * Разбирает имя файла бэкапа.
 * @param {string} name
 * @returns {{kind: "map" | "comments", date: Date} | null}
 */
export function parseBackupFileName(name) {
  const match = FILE_NAME_RE.exec(name);
  if (!match) return null;
  const date = new Date(
    `${match[2]}T${match[3].slice(0, 2)}:${match[3].slice(2, 4)}:${match[3].slice(4, 6)}Z`,
  );
  if (Number.isNaN(date.getTime())) return null;
  return { kind: /** @type {"map" | "comments"} */ (match[1]), date };
}

/**
 * Список файлов бэкапов в каталоге (от новых к старым).
 * @param {string} dir
 * @returns {Promise<BackupFile[]>}
 */
export async function listBackupsIn(dir) {
  const names = await fs.promises.readdir(dir).catch(() => /** @type {string[]} */ ([]));
  /** @type {BackupFile[]} */
  const backups = [];
  for (const name of names) {
    const parsed = parseBackupFileName(name);
    if (!parsed) continue;
    const file = path.join(dir, name);
    const stat = await fs.promises.stat(file).catch(() => null);
    if (!stat || !stat.isFile()) continue;
    backups.push({ kind: parsed.kind, date: parsed.date, name, file, size: stat.size });
  }
  backups.sort((a, b) => b.date.getTime() - a.date.getTime());
  return backups;
}

/**
 * Извлекает имена таблиц из SQL-дампа (INSERT INTO/COPY public.<таблица>).
 * Учитывает кавычки pg_dump (--quote-all-identifier: `"public"."blocks"`).
 * @param {string} sql
 * @returns {string[]}
 */
export function tablesInSql(sql) {
  const tables = new Set();
  const re = /^(?:INSERT INTO|COPY)\s+(?:"?public"?\.)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?/gim;
  for (const match of sql.matchAll(re)) tables.add(match[1]);
  return [...tables];
}

/**
 * Отбирает файлы на удаление: хранить бэкапы за последние `days` дней,
 * но всегда минимум `min` последних каждого вида.
 * @param {BackupFile[]} backups
 * @param {{days: number, min: number, now?: Date}} options
 * @returns {{keep: BackupFile[], remove: BackupFile[]}}
 */
export function selectForCleanup(backups, { days, min, now = new Date() }) {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  /** @type {BackupFile[]} */
  const keep = [];
  /** @type {BackupFile[]} */
  const remove = [];
  for (const kind of /** @type {Array<"map" | "comments">} */ (["map", "comments"])) {
    const ofKind = backups
      .filter((backup) => backup.kind === kind)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    ofKind.forEach((backup, index) => {
      const keepIt = index < min || backup.date.getTime() >= cutoff;
      (keepIt ? keep : remove).push(backup);
    });
  }
  keep.sort((a, b) => b.date.getTime() - a.date.getTime());
  remove.sort((a, b) => b.date.getTime() - a.date.getTime());
  return { keep, remove };
}

/** Форматирует размер файла для вывода. @param {number} size */
export function formatBytes(size) {
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

/** Форматирует дату бэкапа: `2026-10-20 04:00 UTC`. @param {Date} date */
export function formatBackupDate(date) {
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

// ============ Приватный репозиторий бэкапов (GitHub) ============

/**
 * Конфигурация приватного репозитория бэкапов из переменных окружения.
 * @returns {{repo: string, token: string} | null}
 */
export function getRemoteConfig() {
  const repo = process.env.BACKUP_REPO;
  const token = process.env.BACKUP_REPO_TOKEN;
  if (!repo && !token) return null;
  if (!repo || !token) {
    throw new Error("Нужны оба значения: BACKUP_REPO и BACKUP_REPO_TOKEN (см. README)");
  }
  return { repo, token };
}

/**
 * Клонирует приватный репозиторий бэкапов во временный каталог, выполняет
 * `action(dir)` и при `push: true` коммитит и отправляет изменения.
 * Если изменений нет — коммит не создаётся.
 * @template T
 * @param {(dir: string) => Promise<T>} action
 * @param {{push?: boolean, message?: string}} [options]
 * @returns {Promise<T>}
 */
export async function withRemoteRepo(action, options = {}) {
  const config = getRemoteConfig();
  if (!config) {
    throw new Error(
      "Не заданы BACKUP_REPO и BACKUP_REPO_TOKEN — работа с приватным репозиторием бэкапов невозможна (см. README)",
    );
  }
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "map-backups-"));
  try {
    const url = `https://x-access-token:${config.token}@github.com/${config.repo}.git`;
    await run("git", ["clone", "--depth", "1", url, dir]);
    const result = await action(dir);
    if (options.push) {
      const status = await run("git", ["status", "--porcelain"], { cwd: dir });
      if (status.stdout.trim()) {
        await run("git", ["add", "-A"], { cwd: dir });
        await run(
          "git",
          [
            "-c",
            "user.name=map-backup-bot",
            "-c",
            "user.email=map-backup-bot@users.noreply.github.com",
            "commit",
            "-m",
            options.message ?? "Обновление бэкапов",
          ],
          { cwd: dir },
        );
        await run("git", ["push", "origin", "HEAD"], { cwd: dir });
      }
    }
    return result;
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
}

/**
 * Копирует файлы бэкапов в приватный репозиторий и отправляет (push).
 * @param {string[]} names  Имена файлов (лежат в `fromDir`).
 * @param {string} fromDir
 * @param {string} message
 */
export async function pushBackupsToRemote(names, fromDir, message) {
  await withRemoteRepo(
    async (dir) => {
      for (const name of names) {
        await fs.promises.copyFile(path.join(fromDir, name), path.join(dir, name));
      }
    },
    { push: true, message },
  );
}
