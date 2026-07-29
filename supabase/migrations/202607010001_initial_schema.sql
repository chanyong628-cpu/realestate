begin;

create extension if not exists pgcrypto;
create sequence if not exists public.property_number_seq start with 1;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  property_number text unique,
  title text not null,
  category text not null
    constraint properties_category_check check (category in ('office', 'store', 'etc')),
  deposit integer constraint properties_deposit_check check (deposit >= 0),
  monthly_rent integer constraint properties_monthly_rent_check check (monthly_rent >= 0),
  maintenance_fee integer constraint properties_maintenance_fee_check check (maintenance_fee >= 0),
  public_address text,
  private_address text,
  latitude double precision,
  longitude double precision,
  exclusive_area numeric constraint properties_exclusive_area_check check (exclusive_area >= 0),
  supply_area numeric constraint properties_supply_area_check check (supply_area >= 0),
  floor text,
  total_floor text,
  parking_available boolean not null default false,
  restroom_type text
    constraint properties_restroom_type_check check (
      restroom_type is null or restroom_type in (
        'internal_shared',
        'internal_private',
        'external_shared',
        'external_private'
      )
    ),
  move_in_date text,
  is_recommended boolean not null default false,
  is_published boolean not null default true,
  image_urls text[] not null default '{}',
  description text,
  private_memo text,
  view_count integer not null default 0
    constraint properties_view_count_check check (view_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_blocks (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text,
  customer_memo text,
  shared_slug text unique not null default encode(gen_random_bytes(12), 'hex'),
  shared_title text,
  shared_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_block_properties (
  id uuid primary key default gen_random_uuid(),
  customer_block_id uuid not null
    references public.customer_blocks(id) on delete cascade,
  property_id uuid not null
    references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_block_id, property_id)
);

create or replace function public.assign_property_number()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.property_number is null or btrim(new.property_number) = '' then
    new.property_number :=
      'CY-' || lpad(nextval('public.property_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_assign_number on public.properties;
create trigger properties_assign_number
before insert on public.properties
for each row execute function public.assign_property_number();

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

drop trigger if exists customer_blocks_set_updated_at on public.customer_blocks;
create trigger customer_blocks_set_updated_at
before update on public.customer_blocks
for each row execute function public.set_updated_at();

create index if not exists properties_public_list_idx
  on public.properties (is_published, created_at desc);
create index if not exists properties_category_idx
  on public.properties (category);
create index if not exists properties_recommended_idx
  on public.properties (is_recommended)
  where is_recommended = true;
create index if not exists customer_block_properties_block_idx
  on public.customer_block_properties (customer_block_id);

alter table public.properties enable row level security;
alter table public.customer_blocks enable row level security;
alter table public.customer_block_properties enable row level security;

revoke all on table public.properties from anon, authenticated;
grant select (
  id,
  property_number,
  title,
  category,
  deposit,
  monthly_rent,
  maintenance_fee,
  public_address,
  latitude,
  longitude,
  exclusive_area,
  supply_area,
  floor,
  total_floor,
  parking_available,
  restroom_type,
  move_in_date,
  is_recommended,
  is_published,
  image_urls,
  description,
  view_count,
  created_at,
  updated_at
) on public.properties to anon, authenticated;

drop policy if exists "Public can read published properties" on public.properties;
create policy "Public can read published properties"
on public.properties
for select
to anon, authenticated
using (is_published = true);

-- 쓰기와 비공개 데이터 조회는 서버 전용 Secret Key로만 수행합니다.
-- Secret Key는 RLS를 우회하므로 브라우저 코드에 절대 노출하지 않습니다.

commit;
