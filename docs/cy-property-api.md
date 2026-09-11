# C.Y Property API

ChatGPT나 MCP가 Supabase에 직접 접근하지 않고, C.Y 홈페이지 서버의 제한된 매물 관리 기능만 호출하기 위한 서버 전용 API입니다. 홈페이지에서 OpenAI API를 호출하지 않습니다.

## 운영 설정

Vercel의 Production 환경변수에 다음 값을 추가합니다.

```text
CY_PROPERTY_API_SECRET=<32자 이상의 충분히 긴 랜덤 값>
```

- `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.
- Supabase publishable/secret/service role key를 재사용하지 않습니다.
- Secret 값은 Git, 브라우저 코드, URL, 로그에 넣지 않습니다.
- MCP 또는 ChatGPT Action에는 이 전용 Secret만 전달합니다.
- Secret을 변경한 뒤에는 C.Y 홈페이지와 연결 클라이언트 양쪽의 값을 함께 교체합니다.

예를 들어 로컬 PowerShell에서 Secret 후보를 만들 때는 다음처럼 암호학적 난수를 사용할 수 있습니다.

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

## 인증

모든 요청은 아래 헤더가 필요합니다.

```http
Authorization: Bearer <CY_PROPERTY_API_SECRET>
```

Secret이 없거나 틀리면 `401 UNAUTHORIZED`, 서버에 32자 이상의 Secret이 설정되지 않았으면 `500 API_NOT_CONFIGURED`를 반환합니다.

## Endpoint와 Tool 매핑

| Tool | Method | Endpoint |
| --- | --- | --- |
| `searchProperties` | `GET` | `/api/cy/properties?q=검색어&limit=20` |
| `getProperty` | `GET` | `/api/cy/properties/{identifier}` |
| `createProperty` | `POST` | `/api/cy/properties` |
| `updateProperty` | `PATCH` | `/api/cy/properties/{identifier}` |
| `publishProperty` | `POST` | `/api/cy/properties/{identifier}/publish` |
| `unpublishProperty` | `POST` | `/api/cy/properties/{identifier}/unpublish` |

`identifier`에는 UUID 내부 ID 또는 `CY-0001` 형식의 매물번호를 사용할 수 있습니다. 생성된 매물은 요청과 관계없이 항상 비공개(`is_published: false`)로 저장되며, 공개 상태 변경은 별도 endpoint로만 수행합니다. 삭제 endpoint는 제공하지 않습니다.

## 요청 예시

```http
GET /api/cy/properties/CY-0152
Authorization: Bearer <secret>
```

```http
POST /api/cy/properties
Authorization: Bearer <secret>
Content-Type: application/json

{
  "property_number": "CY-0152",
  "title": "문정동 사무실",
  "category": "office",
  "deposit": 3000,
  "monthly_rent": 250
}
```

```http
PATCH /api/cy/properties/CY-0152
Authorization: Bearer <secret>
Content-Type: application/json

{
  "monthly_rent": 230
}
```

금액과 면적 등 값의 단위는 기존 관리자 CRUD와 `properties` 테이블의 단위를 그대로 사용합니다.

## 안전 제한

- JSON 객체만 허용하며 요청 본문은 최대 64 KiB입니다.
- Zod strict schema로 예상하지 못한 필드를 차단합니다.
- PATCH는 명시된 매물 필드만 허용하며 `id`, `property_number`, `is_published`, `view_count`, 생성/수정 시각은 바꿀 수 없습니다.
- `property_number` 중복은 사전 검사와 DB unique 오류 양쪽에서 `409`로 차단합니다.
- 사진은 현재 Supabase 프로젝트의 `property-images` 공개 bucket HTTPS URL만 허용합니다.
- 신규 매물은 반드시 비공개로 생성합니다.
- DELETE, SQL, Auth, 임의 테이블, Storage 관리, schema 변경 기능은 없습니다.
- 응답은 `private, no-store`로 캐시되지 않습니다.
- 쓰기 로그에는 action, property ID, property number, timestamp만 기록합니다.

## 응답 예시

```json
{
  "success": true,
  "property": {
    "id": "11111111-1111-4111-8111-111111111111",
    "property_number": "CY-0152"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "PROPERTY_NOT_FOUND",
    "message": "해당 매물을 찾을 수 없습니다."
  }
}
```

## ChatGPT 연결

[`cy-property-api.openapi.yaml`](./cy-property-api.openapi.yaml)은 위 endpoint를 각각 독립된 operationId로 정의합니다. ChatGPT Action/OpenAPI 연결 시 이 파일을 가져오고 Bearer 인증에 `CY_PROPERTY_API_SECRET` 값을 설정합니다. MCP를 사용할 경우에도 MCP server가 동일 endpoint만 호출하고, Supabase 키는 MCP에 전달하지 않습니다.

실제 쓰기 Tool 호출 전 사용자 확인은 ChatGPT/MCP 계층에서 처리합니다. API는 이미 승인된 단일 작업을 실행하는 역할만 합니다.
