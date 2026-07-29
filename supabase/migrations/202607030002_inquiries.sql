begin;

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  business_type text not null,
  phone text not null,
  budget text not null,
  desired_area text not null,
  move_in_date text not null,
  notes text,
  status text not null default 'new'
    constraint inquiries_status_check check (status in ('new', 'contacted')),
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx
  on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;
revoke all on table public.inquiries from anon, authenticated;

commit;
