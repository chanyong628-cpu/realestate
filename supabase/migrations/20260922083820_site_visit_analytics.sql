begin;

create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  visitor_hash text not null
    constraint site_visits_visitor_hash_check check (char_length(visitor_hash) = 64),
  pathname text not null
    constraint site_visits_pathname_check check (
      char_length(pathname) between 1 and 300 and pathname like '/%'
    ),
  property_id uuid references public.properties(id) on delete set null,
  property_number text,
  is_entry boolean not null default true,
  source_type text not null
    constraint site_visits_source_type_check check (
      source_type in ('direct', 'search', 'site', 'campaign')
    ),
  source_name text not null
    constraint site_visits_source_name_check check (char_length(source_name) between 1 and 100),
  referrer_host text
    constraint site_visits_referrer_host_check check (char_length(referrer_host) <= 253),
  search_query text
    constraint site_visits_search_query_check check (char_length(search_query) <= 200),
  visited_at timestamptz not null default now()
);

create index if not exists site_visits_visited_at_idx
  on public.site_visits (visited_at desc);
create index if not exists site_visits_visitor_visited_idx
  on public.site_visits (visitor_hash, visited_at desc);
create index if not exists site_visits_source_visited_idx
  on public.site_visits (source_type, visited_at desc)
  where is_entry = true;
create index if not exists site_visits_property_visited_idx
  on public.site_visits (property_id, visited_at desc)
  where property_id is not null;

alter table public.site_visits enable row level security;
revoke all on table public.site_visits from anon, authenticated;
revoke all on sequence public.site_visits_id_seq from anon, authenticated;

-- 공개 브라우저는 이 테이블에 직접 접근하지 않습니다.
-- 공개 Route Handler와 관리자 대시보드만 서버의 Secret Key로 읽고 씁니다.

commit;
