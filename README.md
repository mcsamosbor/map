# samosbor_map

## Supabase database

[Docs](https://supabase.com/docs/guides/local-development/cli-workflows#step-1-initialize)

### Init

```sh
npx supabase login
supabase link --project-ref <project-id>
```

### Push migrations to supabase

```sh
npx supabase db push
```

## Бэкапы базы данных

Free-план Supabase не включает встроенные бэкапы, поэтому дампы делаются через
Supabase CLI (`supabase db dump`) и хранятся:

- локально в `backups/` (в `.gitignore`);
- автоматически — в приватном репозитории `BACKUP_REPO` (GitHub Actions раз в 3 дня,
  workflow `.github/workflows/backup.yml`).

Состав бэкапов: `map_<время>.sql` — блоки, переходы, предметы магазинов, роли;
`comments_<время>.sql` — комментарии (отдельно). Время в именах файлов — UTC.

### Команды

```sh
npm run backup:save                       # создать бэкап (map + comments) в backups/
npm run backup:save -- --no-comments      # только бэкап карты
npm run backup:save -- --comments-only    # только бэкап комментариев
npm run backup:save -- --push             # + отправить в приватный репозиторий

npm run backup:load -- --list             # список бэкапов (локальных и удалённых)
npm run backup:load -- --latest --kind map      # восстановить самый свежий map-бэкап
npm run backup:load -- --latest --kind all      # map + comments за один проход
npm run backup:load -- --file backups/map_2026-10-20_040000Z.sql

npm run backup:clean                      # очистить локальные старые бэкапы
npm run backup:clean -- --remote          # + очистить приватный репозиторий
npm run backup:clean -- --days 60 --min 5 # свои правила (по умолчанию 30 дней / мин. 10)
```

### Настройка

Переменные окружения (`.env` локально, Secrets в GitHub Actions — те же имена):

- `SUPABASE_DB_URL` — connection string из дашборда Supabase: Settings → Database →
  Connection string → URI. Нужен **Session pooler** или Direct connection
  (Transaction pooler не поддерживает явные транзакции). Пароль должен быть
  percent-encoded.
- `BACKUP_REPO` — `owner/имя-приватного-репозитория` для хранения бэкапов;
- `BACKUP_REPO_TOKEN` — PAT (fine-grained, `contents: read+write` на тот репозиторий).

Для восстановления нужен `psql` в PATH либо Docker (фоллбэк: образ `postgres:17`).

### Восстановление

`backup:load` перед загрузкой выполняет `TRUNCATE ... RESTART IDENTITY CASCADE`
и сам дамп одной транзакцией (id и sequence сохраняются — pg_dump включает `setval`).

Важно:

- восстановление **полностью заменяет** данные таблиц;
- восстановление `map`-бэкапа каскадно удаляет комментарии (FK `comments.block_id` →
  `blocks`), поэтому восстанавливайте их вторым шагом из `comments`-бэкапа
  (либо используйте `--kind all`, который делает оба шага за один проход);
- загружать бэкапы может только владелец `SUPABASE_DB_URL` (пароля БД); дополнительно
  требуется подтверждение вводом слова `RESTORE` (отключается флагом `--yes`).

Автоматическая очистка: каждый прогон workflow удаляет из приватного репозитория
бэкапы старше 30 дней, всегда оставляя минимум 10 последних каждого вида.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
