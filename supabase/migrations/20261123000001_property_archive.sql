begin;

-- 매물장 DB 보관 테이블: C.Y부동산 사이트(properties)에서 완전 삭제된 매물을 OFF 상태로 보존한다.
create table if not exists public.property_archive (
  like public.properties including defaults including constraints
);

alter table public.property_archive
  add column if not exists archived_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.property_archive'::regclass and contype = 'p'
  ) then
    alter table public.property_archive add primary key (id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.property_archive'::regclass
      and conname = 'property_archive_property_number_key'
  ) then
    alter table public.property_archive
      add constraint property_archive_property_number_key unique (property_number);
  end if;
end $$;

alter table public.property_archive enable row level security;
revoke all on public.property_archive from anon, authenticated;

-- 사이트에서 완전 삭제: 매물장(property_archive)으로 옮기고 properties에서는 지운다. (한 트랜잭션)
create or replace function public.archive_property(p_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.properties where id = p_id) then
    return false;
  end if;

  delete from public.property_archive where id = p_id;

  insert into public.property_archive
  select (jsonb_populate_record(
    null::public.property_archive,
    to_jsonb(p) || jsonb_build_object('is_published', false, 'archived_at', now())
  )).*
  from public.properties p
  where p.id = p_id;

  delete from public.properties where id = p_id;
  return true;
end;
$$;

-- 매물장 ON: 보관 중인 매물을 사이트(properties)로 복원한다.
create or replace function public.restore_property(p_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.property_archive where id = p_id) then
    return false;
  end if;

  insert into public.properties
  select (jsonb_populate_record(
    null::public.properties,
    (to_jsonb(a) - 'archived_at') || jsonb_build_object('is_published', true)
  )).*
  from public.property_archive a
  where a.id = p_id;

  delete from public.property_archive where id = p_id;
  return true;
end;
$$;

revoke all on function public.archive_property(uuid) from public, anon, authenticated;
revoke all on function public.restore_property(uuid) from public, anon, authenticated;
grant execute on function public.archive_property(uuid) to service_role;
grant execute on function public.restore_property(uuid) to service_role;

commit;
