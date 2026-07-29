begin;

alter table public.properties
  add column if not exists elevator_available boolean not null default false,
  add column if not exists total_parking_count integer,
  add column if not exists available_parking_count integer;

alter table public.properties
  drop constraint if exists properties_total_parking_count_check,
  add constraint properties_total_parking_count_check
    check (total_parking_count is null or total_parking_count >= 0),
  drop constraint if exists properties_available_parking_count_check,
  add constraint properties_available_parking_count_check
    check (available_parking_count is null or available_parking_count >= 0);

grant select (
  elevator_available,
  total_parking_count,
  available_parking_count
) on public.properties to anon, authenticated;

commit;
