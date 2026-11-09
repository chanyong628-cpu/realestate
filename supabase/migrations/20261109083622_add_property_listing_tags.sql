begin;

alter table public.properties
  add column if not exists listing_tags text[] not null default '{}';

update public.properties
set listing_tags = case
  when category in ('office', 'store') then array[category]
  else '{}'::text[]
end
where cardinality(listing_tags) = 0;

alter table public.properties
  drop constraint if exists properties_listing_tags_check;

alter table public.properties
  add constraint properties_listing_tags_check check (
    listing_tags <@ array[
      'office',
      'store',
      'theme_whole_rent',
      'theme_sale',
      'theme_rooftop',
      'theme_etc'
    ]::text[]
  );

create index if not exists properties_listing_tags_idx
  on public.properties using gin (listing_tags);

grant select (listing_tags) on public.properties to anon, authenticated;

commit;
