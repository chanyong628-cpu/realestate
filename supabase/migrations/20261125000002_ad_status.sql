begin;

-- 광고현황판: 매물 1건당 4개 플랫폼(N.부동산, C.Y부동산, 당근, 블로그) 광고 상태.
-- 마감하면 이 표의 행만 삭제한다. properties / property_archive 와는 연결하지 않는다(사진·매물 데이터 보호).
create table if not exists public.ad_status (
  id uuid primary key default gen_random_uuid(),
  ad_date date not null default ((now() at time zone 'Asia/Seoul')::date),
  title text not null,
  property_number text,
  naver_status text not null default 'pending',
  cy_status text not null default 'pending',
  karrot_status text not null default 'pending',
  blog_status text not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ad_status_naver_check check (naver_status in ('pending','written','posted','hold','failed')),
  constraint ad_status_cy_check check (cy_status in ('pending','written','posted','hold','failed')),
  constraint ad_status_karrot_check check (karrot_status in ('pending','written','posted','hold','failed')),
  constraint ad_status_blog_check check (blog_status in ('pending','written','posted','hold','failed'))
);

create index if not exists ad_status_date_idx on public.ad_status (ad_date desc, created_at desc);

alter table public.ad_status enable row level security;
revoke all on table public.ad_status from anon, authenticated;

commit;
