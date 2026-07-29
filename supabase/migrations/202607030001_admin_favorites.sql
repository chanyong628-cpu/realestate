begin;

create table if not exists public.admin_favorite_properties (
  property_id uuid primary key
    references public.properties(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_favorite_properties enable row level security;
revoke all on table public.admin_favorite_properties from anon, authenticated;

commit;
