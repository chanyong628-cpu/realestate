begin;

alter table public.properties
  add column if not exists building_use text,
  add column if not exists approval_date date,
  add column if not exists building_direction text,
  add column if not exists room_count integer,
  add column if not exists restroom_count integer,
  add column if not exists air_conditioner_type text,
  add column if not exists is_violating_building boolean not null default false;

alter table public.properties
  drop constraint if exists properties_room_count_check,
  add constraint properties_room_count_check
    check (room_count is null or room_count >= 0),
  drop constraint if exists properties_restroom_count_check,
  add constraint properties_restroom_count_check
    check (restroom_count is null or restroom_count >= 0),
  drop constraint if exists properties_air_conditioner_type_check,
  add constraint properties_air_conditioner_type_check
    check (
      air_conditioner_type is null or
      air_conditioner_type in ('유', '무', '시스템', '스탠드', '벽걸이')
    );

grant select (
  building_use,
  approval_date,
  building_direction,
  room_count,
  restroom_count,
  air_conditioner_type,
  is_violating_building
) on public.properties to anon, authenticated;

commit;
