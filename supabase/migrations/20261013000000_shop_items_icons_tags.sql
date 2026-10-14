-- Иконки и теги для справочника продаваемых предметов.
-- Иконка хранится как data URL (PNG до 64×64) прямо в строке: файлы крошечные,
-- отдельный storage-бакет не нужен. Теги — свободные слова, которые
-- придумывают картографы («Расходник», «Чертеж», «Крафт», «Медицина»…).

alter table "public"."shop_items"
  add column "icon" text,
  add column "tags" text[] not null default '{}';

create index "idx_shop_items_tags" on "public"."shop_items" using gin ("tags");

comment on column "public"."shop_items"."icon" is 'Item icon as data URL (PNG up to 64x64); when null, SVG sprite with name = id is used';
comment on column "public"."shop_items"."tags" is 'Free-form tag words invented by cartographers';