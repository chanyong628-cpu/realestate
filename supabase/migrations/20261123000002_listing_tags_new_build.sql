begin;

-- '신축, 리모델링' 테마 태그(theme_new_build)가 허용 목록에 없어 태그 저장이 거부되던 문제 수정.
-- 매물(properties)과 매물장 보관(property_archive) 양쪽 모두 갱신한다.
do $$
declare c record;
begin
  for c in
    select conrelid::regclass as tbl, conname from pg_constraint
    where conrelid in ('public.properties'::regclass, 'public.property_archive'::regclass)
      and contype = 'c' and pg_get_constraintdef(oid) ilike '%listing_tags%'
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;

  alter table public.properties add constraint properties_listing_tags_check check (
    listing_tags <@ array['office','store','theme_new_build','theme_whole_rent','theme_sale','theme_rooftop','theme_etc']::text[]);
  alter table public.property_archive add constraint property_archive_listing_tags_check check (
    listing_tags <@ array['office','store','theme_new_build','theme_whole_rent','theme_sale','theme_rooftop','theme_etc']::text[]);
end $$;

commit;
