begin;

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
  v_repeat_14_start timestamptz;
  v_repeat_28_start timestamptz;
  v_top_properties jsonb;
  v_sources jsonb;
  v_searches jsonb;
  v_repeat_visitors_14 jsonb;
  v_repeat_visitors_28 jsonb;
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
  v_repeat_14_start := v_today - interval '13 days';
  v_repeat_28_start := v_today - interval '27 days';

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

  select coalesce(jsonb_agg(to_jsonb(item) order by item.visit_days desc, item.count desc, item.last_seen desc), '[]'::jsonb)
  into v_repeat_visitors_14
  from (
    select coalesce(network_hash, visitor_hash) as visitor_hash,
      count(*)::integer as count,
      count(distinct (visited_at at time zone 'Asia/Seoul')::date)::integer as visit_days,
      max(visited_at) as last_seen
    from public.site_visits
    where visited_at >= v_repeat_14_start and is_entry
    group by coalesce(network_hash, visitor_hash)
    having count(distinct (visited_at at time zone 'Asia/Seoul')::date) >= 2
    order by visit_days desc, count desc, last_seen desc
    limit 5
  ) item;

  select coalesce(jsonb_agg(to_jsonb(item) order by item.visit_days desc, item.count desc, item.last_seen desc), '[]'::jsonb)
  into v_repeat_visitors_28
  from (
    select coalesce(network_hash, visitor_hash) as visitor_hash,
      count(*)::integer as count,
      count(distinct (visited_at at time zone 'Asia/Seoul')::date)::integer as visit_days,
      max(visited_at) as last_seen
    from public.site_visits
    where visited_at >= v_repeat_28_start and is_entry
    group by coalesce(network_hash, visitor_hash)
    having count(distinct (visited_at at time zone 'Asia/Seoul')::date) >= 2
    order by visit_days desc, count desc, last_seen desc
    limit 5
  ) item;

  select coalesce(jsonb_agg(to_jsonb(item) order by item.count desc, item.last_seen desc), '[]'::jsonb)
  into v_repeat_logins
  from (
    select network_hash as visitor_hash,
      count(*)::integer as count,
      count(distinct (attempted_at at time zone 'Asia/Seoul')::date)::integer as visit_days,
      max(attempted_at) as last_seen
    from public.admin_login_attempts
    where attempted_at >= v_repeat_28_start and not succeeded and network_hash is not null
    group by network_hash
    having count(*) >= 2
    order by count desc, last_seen desc
    limit 5
  ) item;

  return jsonb_build_object(
    'today_visitors', (select count(distinct visitor_hash) from public.site_visits where visited_at >= v_today),
    'total_visitors', (select count(distinct visitor_hash) from public.site_visits),
    'top_properties', v_top_properties,
    'sources', v_sources,
    'searches', v_searches,
    'repeat_visitors_14', v_repeat_visitors_14,
    'repeat_visitors_28', v_repeat_visitors_28,
    'repeat_logins', v_repeat_logins
  );
end;
$$;

revoke all on function public.get_analytics_dashboard(text,integer) from public;
grant execute on function public.get_analytics_dashboard(text,integer) to anon, authenticated, service_role;

commit;
