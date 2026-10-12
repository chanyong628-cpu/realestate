begin;

create schema if not exists private;
create table if not exists private.analytics_config (
  id boolean primary key default true check (id),
  secret_hash text not null check (char_length(secret_hash) = 64)
);
revoke all on schema private from public, anon, authenticated;
revoke all on table private.analytics_config from public, anon, authenticated;

create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  visitor_hash text not null check (char_length(visitor_hash) = 64),
  network_hash text check (network_hash is null or char_length(network_hash) = 64),
  pathname text not null check (char_length(pathname) between 1 and 300 and pathname like '/%'),
  property_number text,
  is_entry boolean not null default true,
  source_type text not null check (source_type in ('direct', 'search', 'site', 'campaign')),
  source_name text not null check (char_length(source_name) between 1 and 100),
  referrer_host text check (char_length(referrer_host) <= 253),
  search_query text check (char_length(search_query) <= 200),
  visited_at timestamptz not null default now()
);

create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  network_hash text check (network_hash is null or char_length(network_hash) = 64),
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists site_visits_visited_at_idx on public.site_visits (visited_at desc);
create index if not exists site_visits_visitor_visited_idx on public.site_visits (visitor_hash, visited_at desc);
create index if not exists site_visits_network_visited_idx on public.site_visits (network_hash, visited_at desc) where network_hash is not null;
create index if not exists site_visits_property_visited_idx on public.site_visits (property_number, visited_at desc) where property_number is not null;
create index if not exists admin_login_attempts_network_attempted_idx on public.admin_login_attempts (network_hash, attempted_at desc) where network_hash is not null;

alter table public.site_visits enable row level security;
alter table public.admin_login_attempts enable row level security;
revoke all on table public.site_visits, public.admin_login_attempts from anon, authenticated;
revoke all on sequence public.site_visits_id_seq, public.admin_login_attempts_id_seq from anon, authenticated;

create or replace function public.record_site_visit(
  p_secret text,
  p_visitor_hash text,
  p_network_hash text,
  p_pathname text,
  p_property_number text,
  p_is_entry boolean,
  p_source_type text,
  p_source_name text,
  p_referrer_host text,
  p_search_query text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_secret is null or not exists (
    select 1 from private.analytics_config
    where secret_hash = encode(extensions.digest(p_secret, 'sha256'), 'hex')
  ) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  insert into public.site_visits (
    visitor_hash, network_hash, pathname, property_number, is_entry,
    source_type, source_name, referrer_host, search_query
  ) values (
    p_visitor_hash, p_network_hash, p_pathname, p_property_number, p_is_entry,
    p_source_type, p_source_name, p_referrer_host, p_search_query
  );
end;
$$;

create or replace function public.record_admin_login_attempt(
  p_secret text,
  p_network_hash text,
  p_succeeded boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_secret is null or not exists (
    select 1 from private.analytics_config
    where secret_hash = encode(extensions.digest(p_secret, 'sha256'), 'hex')
  ) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  insert into public.admin_login_attempts (network_hash, succeeded)
  values (p_network_hash, p_succeeded);
end;
$$;

create or replace function public.get_analytics_dashboard(
  p_secret text,
  p_range_days integer default 30
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today timestamptz;
  v_range_start timestamptz;
  v_top_properties jsonb;
  v_sources jsonb;
  v_searches jsonb;
  v_repeat_visitors jsonb;
  v_repeat_logins jsonb;
begin
  if p_secret is null or not exists (
    select 1 from private.analytics_config
    where secret_hash = encode(extensions.digest(p_secret, 'sha256'), 'hex')
  ) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_range_days not in (7, 30, 90) then
    p_range_days := 30;
  end if;

  v_today := date_trunc('day', timezone('Asia/Seoul', now())) at time zone 'Asia/Seoul';
  v_range_start := v_today - ((p_range_days - 1) * interval '1 day');

  select coalesce(jsonb_agg(to_jsonb(item) order by item.count desc, item.label), '[]'::jsonb)
  into v_top_properties
  from (
    select property_number as label,
      count(*)::integer as count,
      round(count(*) * 100.0 / sum(count(*)) over (), 1)::double precision as rate
    from public.site_visits
    where visited_at >= v_range_start and property_number is not null
    group by property_number
    order by count desc, property_number
    limit 5
  ) item;

  select coalesce(jsonb_agg(to_jsonb(item) order by item.count desc, item.label), '[]'::jsonb)
  into v_sources
  from (
    select source_name as label, count(*)::integer as count
    from public.site_visits
    where visited_at >= v_range_start and is_entry
    group by source_name
    order by count desc, source_name
    limit 5
  ) item;

  select coalesce(jsonb_agg(to_jsonb(item) order by item.count desc, item.label), '[]'::jsonb)
  into v_searches
  from (
    select coalesce(search_query, source_name) as label, count(*)::integer as count
    from public.site_visits
    where visited_at >= v_range_start and is_entry and source_type = 'search'
    group by coalesce(search_query, source_name)
    order by count desc, label
    limit 5
  ) item;

  select coalesce(jsonb_agg(to_jsonb(item) order by item.count desc, item.last_seen desc), '[]'::jsonb)
  into v_repeat_visitors
  from (
    select coalesce(network_hash, visitor_hash) as visitor_hash,
      count(*)::integer as count,
      max(visited_at) as last_seen
    from public.site_visits
    where visited_at >= v_range_start and is_entry
    group by coalesce(network_hash, visitor_hash)
    having count(*) >= 2
    order by count desc, last_seen desc
    limit 3
  ) item;

  select coalesce(jsonb_agg(to_jsonb(item) order by item.count desc, item.last_seen desc), '[]'::jsonb)
  into v_repeat_logins
  from (
    select network_hash as visitor_hash,
      count(*)::integer as count,
      max(attempted_at) as last_seen
    from public.admin_login_attempts
    where attempted_at >= v_range_start and not succeeded and network_hash is not null
    group by network_hash
    having count(*) >= 2
    order by count desc, last_seen desc
    limit 3
  ) item;

  return jsonb_build_object(
    'today_visitors', (select count(distinct visitor_hash) from public.site_visits where visited_at >= v_today),
    'total_visitors', (select count(distinct visitor_hash) from public.site_visits),
    'top_properties', v_top_properties,
    'sources', v_sources,
    'searches', v_searches,
    'repeat_visitors', v_repeat_visitors,
    'repeat_logins', v_repeat_logins
  );
end;
$$;

revoke all on function public.record_site_visit(text,text,text,text,text,boolean,text,text,text,text) from public;
revoke all on function public.record_admin_login_attempt(text,text,boolean) from public;
revoke all on function public.get_analytics_dashboard(text,integer) from public;
grant execute on function public.record_site_visit(text,text,text,text,text,boolean,text,text,text,text) to anon, authenticated, service_role;
grant execute on function public.record_admin_login_attempt(text,text,boolean) to anon, authenticated, service_role;
grant execute on function public.get_analytics_dashboard(text,integer) to anon, authenticated, service_role;

commit;
