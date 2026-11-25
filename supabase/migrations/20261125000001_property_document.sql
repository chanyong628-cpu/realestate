begin;

-- 매물 상세 안내 문서(PDF/PPT). 있으면 상세페이지가 매물설명·요약 카드 대신 이 문서를 보여준다.
alter table public.properties
  add column if not exists document_url text,
  add column if not exists document_name text;

-- 매물장(property_archive)에도 같은 칸을 둔다. archive_property()가 컬럼 이름으로 복사하므로 없으면 값이 버려진다.
alter table public.property_archive
  add column if not exists document_url text,
  add column if not exists document_name text;

-- 공개 사이트(anon)는 컬럼 단위로만 읽을 수 있다.
grant select (document_url, document_name) on public.properties to anon, authenticated;

commit;
