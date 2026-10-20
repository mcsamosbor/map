#!/usr/bin/env node
// @ts-check
/**
 * Восстановление базы данных из бэкапа (TRUNCATE + загрузка дампа через psql).
 *
 * Использование: npm run backup:load -- [флаги]
 *
 * Восстановление ПОЛНОСТЬЮ заменяет данные таблиц: перед загрузкой выполняется
 * TRUNCATE ... RESTART IDENTITY CASCADE одной транзакцией с самим дампом.
 * Загружать бэкапы может только владелец SUPABASE_DB_URL (пароля БД) —
 * дополнительно требуется подтверждение вводом слова RESTORE.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import {
  BACKUPS_DIR,
  COMMENT_TABLES,
  MAP_TABLES,
  RESTORE_KINDS,
  ROOT_DIR,
  dbEnvFromUrl,
  formatBackupDate,
  formatBytes,
  getFlag,
  getStringOption,
  listBackupsIn,
  loadEnv,
  parseArgs,
  parseBackupFileName,
  runPsqlSql,
  tablesInSql,
  withRemoteRepo,
} from "./backup-lib.mjs";

const HELP = `Восстановление базы данных из бэкапа (psql + TRUNCATE в одной транзакции).

Использование:
  npm run backup:load -- --list [--remote]
  npm run backup:load -- --latest --kind map|comments|all [флаги]
  npm run backup:load -- --file <имя-файла-или-путь> [флаги]

Флаги:
  --list             показать бэкапы (локальные и в приватном репозитории)
  --latest           восстановить самый свежий бэкап указанного вида
  --file <файл>      восстановить конкретный файл (вид определяется по имени)
  --kind <вид>       map | comments | all (для --latest обязателен)
  --remote           взять файлы из приватного репозитория бэкапов
  --yes              не спрашивать подтверждение
  --db-url <url>     connection string (иначе SUPABASE_DB_URL из .env/окружения)
  --dry-run          показать план восстановления, ничего не менять
  --help             эта справка

ВАЖНО:
  * восстановление map-бэкапа каскадно удаляет комментарии (FK на blocks) —
    восстанавливайте их вторым шагом из comments-бэкапа (--kind all делает это
    за один проход);
  * путь до файлов: backups/ (создаётся npm run backup:save).`;

/**
 * Печатает список бэкапов в одном каталоге.
 * @param {string} title
 * @param {import("./backup-lib.mjs").BackupFile[]} backups
 */
function printBackupList(title, backups) {
  console.log(title);
  if (!backups.length) {
    console.log("  (пусто)");
    return;
  }
  for (const backup of backups) {
    console.log(
      `  ${formatBackupDate(backup.date)}  ${backup.kind.padEnd(8)}  ${formatBytes(backup.size).padStart(9)}  ${backup.name}`,
    );
  }
}

/** Показывает локальные и (если настроен) удалённые бэкапы. */
async function listBackups() {
  const local = await listBackupsIn(BACKUPS_DIR);
  printBackupList(
    `Локальные бэкапы (${path.relative(ROOT_DIR, BACKUPS_DIR) || "backups"}/):`,
    local,
  );

  const remoteConfigured = Boolean(process.env.BACKUP_REPO && process.env.BACKUP_REPO_TOKEN);
  if (!remoteConfigured) {
    console.log("\nПриватный репозиторий бэкапов: не задан (BACKUP_REPO / BACKUP_REPO_TOKEN)");
    return;
  }
  console.log(`\nПриватный репозиторий бэкапов (${process.env.BACKUP_REPO}):`);
  try {
    const remote = await withRemoteRepo(async (dir) => listBackupsIn(dir));
    printBackupList("", remote);
  } catch (error) {
    console.log(`  не удалось получить список: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Ищет файл локально: как путь, либо как имя внутри backups/.
 * @param {string} fileOpt
 * @returns {Promise<string | null>}
 */
async function findLocalFile(fileOpt) {
  const candidates = [
    path.resolve(process.cwd(), fileOpt),
    path.join(BACKUPS_DIR, path.basename(fileOpt)),
    path.join(ROOT_DIR, fileOpt),
  ];
  for (const candidate of candidates) {
    const stat = await fs.promises.stat(candidate).catch(() => null);
    if (stat && stat.isFile()) return candidate;
  }
  return null;
}

/**
 * Скачивает файл бэкапа из приватного репозитория в backups/.
 * @param {string} name
 */
async function downloadFromRemote(name) {
  const found = await withRemoteRepo(async (dir) => {
    const remoteFile = path.join(dir, name);
    const stat = await fs.promises.stat(remoteFile).catch(() => null);
    if (!stat || !stat.isFile()) return false;
    await fs.promises.mkdir(BACKUPS_DIR, { recursive: true });
    await fs.promises.copyFile(remoteFile, path.join(BACKUPS_DIR, name));
    return true;
  });
  if (!found) throw new Error(`В приватном репозитории нет файла ${name}`);
  console.log(`Скачан из приватного репозитория: ${name}`);
  return path.join(BACKUPS_DIR, name);
}

/**
 * Возвращает самый свежий бэкап нужного вида.
 * @param {"map" | "comments"} kind
 * @param {boolean} useRemote
 */
async function findLatest(kind, useRemote) {
  if (useRemote) {
    const remoteName = await withRemoteRepo(async (dir) => {
      const remote = await listBackupsIn(dir);
      return remote.find((backup) => backup.kind === kind)?.name ?? null;
    });
    if (!remoteName) throw new Error(`В приватном репозитории нет бэкапов вида "${kind}"`);
    return downloadFromRemote(remoteName);
  }
  const local = await listBackupsIn(BACKUPS_DIR);
  const found = local.find((backup) => backup.kind === kind);
  if (!found) {
    throw new Error(
      `Локально нет бэкапов вида "${kind}". Создайте их (npm run backup:save) или используйте --remote.`,
    );
  }
  return found.file;
}

/**
 * Определяет файлы для восстановления по --file / --latest.
 * @param {Record<string, unknown>} args
 * @returns {Promise<Array<{kind: "map" | "comments", file: string, name: string}>>}
 */
async function resolveJobs(args) {
  const kind = getStringOption(args, "kind");
  const fileOpt = getStringOption(args, "file");
  const latest = getFlag(args, "latest");
  const useRemote = getFlag(args, "remote");

  if (kind !== undefined && !RESTORE_KINDS.includes(kind)) {
    throw new Error(`--kind: ожидается map|comments|all, получено "${kind}"`);
  }
  if (latest && fileOpt) throw new Error("Флаги --latest и --file несовместимы");
  if (!latest && !fileOpt) {
    throw new Error("Укажите --latest или --file <файл> (либо --list для списка)");
  }

  if (fileOpt) {
    if (kind === "all") {
      throw new Error("--kind all поддерживается только с --latest");
    }
    let file = await findLocalFile(fileOpt);
    if (!file) {
      if (useRemote || (process.env.BACKUP_REPO && process.env.BACKUP_REPO_TOKEN)) {
        file = await downloadFromRemote(path.basename(fileOpt));
      } else {
        throw new Error(`Файл не найден: ${fileOpt}`);
      }
    }
    const parsed = parseBackupFileName(path.basename(file));
    const name = path.basename(file);
    if (kind && parsed && parsed.kind !== kind) {
      throw new Error(`Файл ${name} имеет вид "${parsed.kind}", а запрошен "${kind}"`);
    }
    const resolvedKind = kind ?? parsed?.kind;
    if (!resolvedKind || resolvedKind === "all") {
      throw new Error(
        `Не удалось определить вид бэкапа по имени ${name} — укажите --kind map|comments`,
      );
    }
    return [{ kind: /** @type {"map" | "comments"} */ (resolvedKind), file, name }];
  }

  // --latest
  if (!kind) throw new Error("--latest требует --kind map|comments|all");
  const kinds = kind === "all" ? /** @type {const} */ (["map", "comments"]) : [kind];
  /** @type {Array<{kind: "map" | "comments", file: string, name: string}>} */
  const jobs = [];
  for (const neededKind of kinds) {
    const typedKind = /** @type {"map" | "comments"} */ (neededKind);
    const file = await findLatest(typedKind, useRemote);
    jobs.push({ kind: typedKind, file, name: path.basename(file) });
  }
  return jobs;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (getFlag(args, "help")) {
    console.log(HELP);
    return;
  }
  loadEnv();

  if (getFlag(args, "list")) {
    await listBackups();
    return;
  }

  const dryRun = getFlag(args, "dry-run");
  const yes = getFlag(args, "yes");
  const jobs = await resolveJobs(args);

  // Читаем дампы, собираем таблицы и предупреждения
  /** @type {string[]} */
  const sqlParts = [];
  /** @type {Set<string>} */
  const truncateTables = new Set();
  let hasMap = false;
  let hasComments = false;

  for (const job of jobs) {
    const sqlText = await fs.promises.readFile(job.file, "utf8");
    if (!sqlText.trim()) throw new Error(`Файл ${job.name} пустой`);
    sqlParts.push(sqlText);
    for (const table of tablesInSql(sqlText)) truncateTables.add(table);
    for (const table of job.kind === "map" ? MAP_TABLES : COMMENT_TABLES) {
      truncateTables.add(table);
    }
    if (job.kind === "map") {
      hasMap = true;
      truncateTables.add("comments"); // FK comments.block_id -> blocks: каскад
    }
    if (job.kind === "comments") hasComments = true;
    console.log(`  ${job.kind.padEnd(8)}  ${formatBytes(sqlText.length).padStart(9)}  ${job.name}`);
  }

  console.log("\nПлан восстановления:");
  for (const job of jobs) {
    console.log(`  ${job.name} -> таблицы вида "${job.kind}"`);
  }
  console.log(`  TRUNCATE: ${[...truncateTables].sort().join(", ")}`);
  if (hasMap) {
    console.log("\n  ВНИМАНИЕ: будут удалены текущие блоки, переходы, предметы магазинов и роли.");
    console.log("  Комментарии тоже будут удалены (внешний ключ на блоки).");
  }
  if (hasComments) {
    console.log("\n  ВНИМАНИЕ: будут удалены текущие комментарии.");
  }

  if (dryRun) {
    console.log(
      "\n[dry-run] Загрузка выполнит TRUNCATE и дамп(ы) одной транзакцией; ничего не изменено.",
    );
    return;
  }

  const databaseUrl = getStringOption(args, "db-url") ?? process.env.SUPABASE_DB_URL ?? "";
  if (!databaseUrl) {
    throw new Error(
      "Не задан SUPABASE_DB_URL: добавьте его в .env (см. README) или передайте через --db-url",
    );
  }

  if (!yes) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = (
      await rl.question("\nВведите RESTORE для подтверждения (что угодно другое — отмена): ")
    ).trim();
    rl.close();
    if (answer !== "RESTORE") {
      console.log("Отменено. Данные не изменены.");
      return;
    }
  }

  const sql = [
    "BEGIN;",
    `TRUNCATE ${[...truncateTables]
      .sort()
      .map((t) => `public.${t}`)
      .join(", ")} RESTART IDENTITY CASCADE;`,
    ...sqlParts,
    "COMMIT;",
  ].join("\n");

  console.log("\nВосстанавливаю ...");
  await runPsqlSql(sql, dbEnvFromUrl(databaseUrl));
  console.log("\nГотово. Обновите страницу карты — данные подтянутся из базы.");
}

main().catch((error) => {
  console.error(`Ошибка: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
