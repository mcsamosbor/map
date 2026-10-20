#!/usr/bin/env node
// @ts-check
/**
 * Очистка старых бэкапов: локально в backups/ и (опционально) в приватном
 * репозитории бэкапов. Правило: хранить бэкапы за последние N дней,
 * но всегда минимум M последних каждого вида.
 *
 * Использование: npm run backup:clean [-- флаги]
 */
import fs from "node:fs";
import {
  BACKUPS_DIR,
  formatBackupDate,
  formatBytes,
  getFlag,
  getNumberOption,
  listBackupsIn,
  loadEnv,
  parseArgs,
  selectForCleanup,
  withRemoteRepo,
} from "./backup-lib.mjs";

const HELP = `Очистка старых бэкапов (локально и в приватном репозитории).

Использование:
  npm run backup:clean                       почистить локальные backups/
  npm run backup:clean -- --remote           + почистить приватный репозиторий бэкапов

Флаги:
  --days <N>     хранить бэкапы за последние N дней (по умолчанию 30)
  --min <N>      всегда оставлять минимум N последних каждого вида (по умолчанию 10)
  --remote       почистить и приватный репозиторий бэкапов (commit + push)
  --dry-run      показать, что будет удалено, ничего не удалять
  --help         эта справка`;

/**
 * Печатает и (опционально) удаляет лишние файлы.
 * @param {string} title
 * @param {import("./backup-lib.mjs").BackupFile[]} backups
 * @param {{days: number, min: number}} rules
 * @param {boolean} dryRun
 */
async function cleanup(title, backups, rules, dryRun) {
  const { keep, remove } = selectForCleanup(backups, rules);
  console.log(
    `${title}: всего ${backups.length}, удалить ${remove.length}, оставить ${keep.length}`,
  );
  for (const backup of remove) {
    console.log(
      `  удаляю ${backup.name} (${formatBackupDate(backup.date)}, ${formatBytes(backup.size)})`,
    );
    if (!dryRun) await fs.promises.rm(backup.file);
  }
  return remove.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (getFlag(args, "help")) {
    console.log(HELP);
    return;
  }
  loadEnv();

  const days = getNumberOption(args, "days") ?? 30;
  const min = getNumberOption(args, "min") ?? 10;
  const remote = getFlag(args, "remote");
  const dryRun = getFlag(args, "dry-run");
  const rules = { days, min };

  console.log(
    `Правило: хранить бэкапы за последние ${days} дн., но минимум ${min} последних каждого вида\n`,
  );

  const local = await listBackupsIn(BACKUPS_DIR);
  await cleanup("Локальные бэкапы (backups/)", local, rules, dryRun);

  if (remote) {
    console.log("\nПриватный репозиторий бэкапов:");
    await withRemoteRepo(
      async (dir) => {
        const remoteBackups = await listBackupsIn(dir);
        await cleanup("  файлы", remoteBackups, rules, dryRun);
      },
      { push: true, message: `backup cleanup: хранить ${days} дн., минимум ${min}` },
    );
  }

  if (dryRun) console.log("\n[dry-run] ничего не удалено");
}

main().catch((error) => {
  console.error(`Ошибка: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
