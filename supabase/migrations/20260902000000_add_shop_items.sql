-- Справочник предметов, продаваемых в магазинах блоков.
-- Количество единиц за цену (в талонах) одинаково на всей карте
-- и настраивается глобально редакторами (UI в menu + BlockCard).

create table "public"."shop_items" (
  "id"         text primary key,
  "name"       text not null,
  "count"      integer not null default 1 check ("count" > 0),
  "price"      integer not null default 1 check ("price" > 0),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."shop_items" enable row level security;

create index "idx_shop_items_updated_at" on "public"."shop_items" using btree (updated_at desc);

-- Читают справочник все посетители (цены магазинов публичны)
create policy "Enable read access for all users" on "public"."shop_items"
  for select
  using (true);

-- Менять количество/цену могут только редакторы и админы
create policy "Editors can change shop items" on "public"."shop_items"
  for all
  to "authenticated"
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role_id = any (array['editor'::text, 'admin'::text])
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role_id = any (array['editor'::text, 'admin'::text])
    )
  );

alter publication "supabase_realtime" add table "public"."shop_items";

grant delete, insert, references, select, trigger, truncate, update on table "public"."shop_items" to "anon", "authenticated", "postgres", "service_role";

comment on table "public"."shop_items" is 'Global catalog of items sold in block shops; count/price are the same across the whole map';
comment on column "public"."shop_items"."count" is 'How many units are given for `price` talons';
comment on column "public"."shop_items"."price" is 'Price in talons for `count` units';
