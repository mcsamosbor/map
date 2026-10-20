#!/usr/bin/env node
// @ts-check
/**
 * Создание бэкапов базы данных через Supabase CLI (`supabase db dump`).
 *
 * Использование: npm run backup:save [-- флаги]
 *
 * Флаги:
 *   --no-comments     только основной бэкап (map)
 *   --comments-only   только бэкап комментариев
 *   --push            закинуть файлы в приватный репозиторий бэкапов
 *   --db-url <url>    connection string (иначе SUPABASE_DB_URL из .env/окружения)
 *   --dry-run         показать команды, ничего не выполнять
 *   --help
 */
import fs from "node:fs";
import path from "node:path";
import {
  BACKUPS_DIR,
  COMMENT_TABLES,
  DOCKER_DNS_HINT,
  MAP_TABLES,
  backupFileName,
  commandWorks,
  formatBytes,
  getFlag,
  getStringOption,
  isDockerDaemonError,
  isDockerDnsError,
  loadEnv,
  parseArgs,
  pushBackupsToRemote,
  redactSecrets,
  resolveSupabaseCmd,
  run,
} from "./backup-lib.mjs";

const HELP = `Создание бэкапов базы данных через Supabase CLI (\`supabase db dump\`).

Использование:
  npm run backup:save                       бэкап карты (map) + комментариев (comments)
  npm run backup:save -- --no-comments      только бэкап карты
  npm run backup:save -- --comments-only    только бэкап комментариев
  npm run backup:save -- --push             + закинуть файлы в приватный репозиторий бэкапов

Флаги:
  --no-comments     не создавать бэкап комментариев
  --comments-only   создать только бэкап комментариев
  --push            отправить созданные файлы в приватный репозиторий бэкапов
  --db-url <url>    connection string (иначе SUPABASE_DB_URL из .env/окружения)
  --dry-run         показать команды, ничего не выполнять
  --help            эта справка

Требуется запущенный Docker Desktop: Supabase CLI выполняет pg_dump
внутри Docker-контейнера (даже при дампе удалённой базы).

Файлы сохраняются в backups/ (в .gitignore). Время в именах файлов — UTC.`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (getFlag(args, "help")) {
    console.log(HELP);
    return;
  }
  loadEnv();

  const dryRun = getFlag(args, "dry-run");
  const commentsOnly = getFlag(args, "comments-only");
  const noComments = getFlag(args, "no-comments");
  if (commentsOnly && noComments) {
    throw new Error("Флаги --comments-only и --no-comments несовместимы");
  }
  const push = getFlag(args, "push");

  const databaseUrl = getStringOption(args, "db-url") ?? process.env.SUPABASE_DB_URL ?? "";
  if (!databaseUrl && !dryRun) {
    throw new Error(
      "Не задан SUPABASE_DB_URL: добавьте его в .env (см. README) или передайте через --db-url",
    );
  }

  const supabaseCmd = dryRun ? ["supabase"] : await resolveSupabaseCmd();
  if (!dryRun) {
    const daemonUp =
      (await commandWorks("docker")) &&
      (await run("docker", ["info"], { allowFailure: true })).code === 0;
    if (!daemonUp) {
      console.log(
        "ВНИМАНИЕ: Docker недоступен, а Supabase CLI выполняет pg_dump внутри Docker-контейнера.\n" +
          "Запустите Docker Desktop и повторите — иначе дамп завершится ошибкой docker API.",
      );
    }
  }
  const now = new Date();
  /** @type {string[]} */
  const created = [];

  /** @type {Array<{kind: "map" | "comments", exclude: string[]}>} */
  const dumps = [];
  if (!commentsOnly) dumps.push({ kind: "map", exclude: COMMENT_TABLES });
  if (!noComments) dumps.push({ kind: "comments", exclude: MAP_TABLES });

  for (const dump of dumps) {
    const name = backupFileName(dump.kind, now);
    const file = path.join(BACKUPS_DIR, name);
    const commandLine = [
      ...supabaseCmd,
      "db",
      "dump",
      "--data-only",
      "--schema",
      "public",
      ...dump.exclude.flatMap((table) => ["--exclude", `public.${table}`]),
      "--file",
      file,
      "--db-url",
      databaseUrl || "<SUPABASE_DB_URL>",
    ];

    if (dryRun) {
      console.log(`[dry-run] ${redactSecrets(commandLine.join(" "))}`);
      continue;
    }

    console.log(`Создаю ${name} ...`);
    await fs.promises.mkdir(BACKUPS_DIR, { recursive: true });
    try {
      await run(commandLine[0], commandLine.slice(1));
    } catch (error) {
      // Не оставляем пустые/частичные дампы от неудачных запусков
      await fs.promises.rm(file, { force: true });
      const message = error instanceof Error ? error.message : String(error);
      if (isDockerDaemonError(message)) {
        throw new Error(
          `${message}\nПодсказка: Supabase CLI выполняет pg_dump внутри Docker-контейнера — запустите Docker Desktop и повторите.`,
        );
      }
      if (isDockerDnsError(message)) {
        throw new Error(`${message}\n${DOCKER_DNS_HINT}`);
      }
      throw error;
    }
    const stat = await fs.promises.stat(file);
    if (!stat.size) {
      await fs.promises.rm(file, { force: true });
      throw new Error(`Файл ${name} пустой — дамп не создался`);
    }
    created.push(name);
    console.log(`  готово (${formatBytes(stat.size)})`);
  }

  if (dryRun) {
    console.log("\n[dry-run] Команды выше будут выполнены; ничего не изменено.");
    return;
  }

  if (push) {
    if (!created.length) throw new Error("Нет созданных файлов для отправки");
    console.log("Отправляю в приватный репозиторий бэкапов ...");
    await pushBackupsToRemote(created, BACKUPS_DIR, `backup: ${created.join(", ")}`);
    console.log("  отправлено");
  }

  console.log("\nГотово:");
  for (const name of created) console.log(`  backups/${name}`);
}

main().catch((error) => {
  console.error(`Ошибка: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
