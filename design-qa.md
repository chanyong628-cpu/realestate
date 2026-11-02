# Design QA

## References

- `C:/Users/박찬영/AppData/Local/Temp/codex-clipboard-4e32828d-86c1-4980-8b37-0ebd638a1f65.png`
- `C:/Users/박찬영/AppData/Local/Temp/codex-clipboard-9923de24-e97e-4592-ac08-a61a5d040171.png`
- `C:/Users/박찬영/Desktop/a매물장 상세보기.png`

## Implemented checks

- ON 상태 uses navy and OFF uses neutral gray.
- Site publishing and the property database share the same `is_published` state.
- Property-database direct entry defaults to OFF, while normal website registration remains visible and automatically appears in the property database.
- The desktop table removes the registration-date column and shows address, R/P/E/T/A, deposit, rent, maintenance fee, and pyeong.
- Hidden listings retain full administrator-only photos, private address, and exact-location map inputs.
- Detail and edit modes use the same reference layout.
- Administrator memo is editable directly and has its own save button.
- The list changes to responsive cards before the desktop grid can overflow.

## Verification

- TypeScript: passed.
- ESLint: passed.
- Automated tests: 48 passed.
- Vercel preview build: passed (`9a10be6`).
- Local webpack compilation: passed; prerender stopped only because the local sandbox does not contain the Supabase secret environment variable.
- Live authenticated visual comparison: waiting for the user to sign in to the protected preview.

final result: blocked
