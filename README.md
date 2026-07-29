# CY 부동산

Next.js 16, TypeScript, Tailwind CSS 4, Supabase 기반 임대광고 사이트입니다.

## 1단계 구성

- App Router + TypeScript strict mode
- Supabase 브라우저/서버/관리자 클라이언트 분리
- 매물번호 `CY-0001` 자동 생성 및 RLS가 포함된 초기 스키마
- 환경변수 관리자 계정 + 서명된 HTTP-only 세션 쿠키
- `/admin` 보호 레이아웃과 기본 관리자 메뉴

## 로컬 실행

1. `.env.example`을 참고해 `.env.local`을 작성합니다.
2. Supabase SQL Editor에서
   `supabase/migrations/202607010001_initial_schema.sql`을 실행합니다.
3. `npm run dev`로 실행합니다.

`SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET`은 서버 전용이며
`NEXT_PUBLIC_` 접두사를 붙이면 안 됩니다.
