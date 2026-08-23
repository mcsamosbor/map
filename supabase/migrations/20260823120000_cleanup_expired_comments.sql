-- Cleanup of expired temporary comments.
-- pg_cron раз в час удаляет истёкшие временные комментарии (expires_at <= now()).
-- Корень треда удаляется каскадом вместе с ответами (FK on delete cascade),
-- поэтому «тред умирает вместе с корнем».
-- Плюс хардненинг get_comment_subtree: не отдаёт «сиротские» ответы, если
-- корень уже истёк, но ещё не удалён джобой.

-- ============ pg_cron ============

create extension if not exists pg_cron;

-- ============ Функция очистки ============
-- security definer (владелец — postgres), чтобы обойти RLS и удалять чужие строки.

create or replace function public.delete_expired_comments()
returns integer
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  deleted integer;
begin
  delete from public.comments
   where expires_at is not null
     and expires_at <= now();
  get diagnostics deleted = row_count;
  return deleted;
end;
$function$;

grant execute on function public.delete_expired_comments() to postgres, service_role;

-- ============ Расписание (каждый час, идемпотентно) ============

do $cron$
begin
  if exists (select 1 from cron.job where jobname = 'delete-expired-comments') then
    perform cron.unschedule('delete-expired-comments');
  end if;
  perform cron.schedule(
    'delete-expired-comments',
    '0 * * * *',
    $$ select public.delete_expired_comments(); $$
  );
end;
$cron$;

-- ============ Хардненинг get_comment_subtree ============
-- Раньше неистёкшие ответы к истёкшему корню возвращались без корня.
-- Теперь весь тред скрыт, если корень треда уже истёк.

create or replace function "public"."get_comment_subtree"(
  p_root_id bigint
)
returns table (
  id               bigint,
  created_at       timestamp with time zone,
  updated_at       timestamp with time zone,
  author_id        uuid,
  author_name      text,
  author_avatar_url text,
  text             text,
  parent_id        bigint,
  root_id          bigint,
  block_id         bigint,
  map_x            double precision,
  map_y            double precision,
  layer            integer,
  expires_at       timestamp with time zone
)
language sql
stable
security definer
set search_path = 'public'
as $function$
  select
    c.id,
    c.created_at,
    c.updated_at,
    c.author_id,
    coalesce(
      nullif(au.raw_user_meta_data -> 'custom_claims' ->> 'global_name', ''),
      nullif(au.raw_user_meta_data ->> 'name', ''),
      nullif(au.raw_user_meta_data ->> 'full_name', ''),
      nullif(au.raw_user_meta_data ->> 'username', ''),
      au.email
    ) as author_name,
    nullif(au.raw_user_meta_data ->> 'avatar_url', '') as author_avatar_url,
    c.text,
    c.parent_id,
    c.root_id,
    c.block_id,
    c.map_x,
    c.map_y,
    c.layer,
    c.expires_at
  from public.comments c
  left join auth.users au on au.id = c.author_id
  where c.root_id = p_root_id
    and (c.expires_at is null or c.expires_at > now())
    and exists (
      select 1
      from public.comments r
      where r.id = p_root_id
        and (r.expires_at is null or r.expires_at > now())
    )
  order by c.created_at asc;
$function$;

grant execute on function "public"."get_comment_subtree"(bigint) to anon, authenticated, postgres, service_role;
