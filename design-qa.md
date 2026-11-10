**Source visual truth**

- `C:\Users\박찬영\AppData\Local\Temp\codex-clipboard-d32e90af-bf39-4357-91c3-0b728affff77.png`
- Source pixels: 826 × 472.
- The source shows the existing header typography and the four theme choices. Its open dropdown is not the target interaction; the user explicitly requested that the same choices appear only after navigating to the theme page.

**Implementation evidence**

- Browser-rendered screenshot: `C:\Users\박찬영\Documents\Codex\2026-08-26\https-cy-office-com-https-cy\work\realestate\implementation-theme-preview.png`
- Side-by-side comparison: `C:\Users\박찬영\Documents\Codex\2026-08-26\https-cy-office-com-https-cy\work\realestate\design-qa-theme-comparison.png`
- Preview URL: `https://cy-realestate-4qa0yfs2f-01065465997s-projects.vercel.app/theme`
- Viewport and screenshot pixels: 1848 × 886 CSS pixels at device scale factor 1.
- Density normalization: the comparison board scales both captures to a common height while preserving aspect ratio; no finding was based on raster density alone.
- State: desktop, theme landing page after clicking the normal `테마` header link.

**Primary interactions tested**

- Confirmed `테마` appears as a normal header link beside `상가`, with the same size, weight, and color classes.
- Clicked `테마` and confirmed navigation to `/theme` rather than opening a dropdown.
- Confirmed the destination exposes the four 2 × 2 choices: 통임대, 매매, 루프탑, 기타.
- Checked the browser console after navigation. No application errors were present.

**Full-view comparison evidence**

- Typography: the header navigation uses the same 15 px bold brand-dark treatment for `상가` and `테마`. The destination page keeps the established C.Y heading hierarchy.
- Spacing and layout rhythm: the four options form an even 2 × 2 grid with consistent padding, gaps, radii, and card heights. Nothing is clipped at the verified desktop viewport.
- Colors and tokens: the implementation uses the existing brand navy, blue accent, muted copy, border, and surface tokens rather than introducing a new palette.
- Image quality and asset fidelity: no new raster asset was required. Existing logo and icon assets remain sharp; the user-requested destination intentionally replaces the source dropdown-over-hero state.
- Copy and content: all four requested themes and their descriptions are present and readable.

**Focused region comparison evidence**

- A separate crop was unnecessary because the combined comparison keeps the header labels and all four card labels legible at review size.

**Findings**

- No actionable P0, P1, or P2 visual mismatch remains.
- The absent header dropdown is an intentional product change required by the user, not design drift.

**Comparison history**

- Pass 1: no actionable P0/P1/P2 issues were found, so no visual repair iteration was required.

**Residual test gap**

- The preview admin route requires a separate C.Y administrator login, so the authenticated bulk-selection toolbar could not be visually captured in this browser session. Its server/client paths passed TypeScript, lint, and the full automated test suite.

**Implementation checklist**

- [x] Normal header navigation to `/theme`.
- [x] `테마` matches `상가` typography and color.
- [x] Four theme choices appear only on the destination page.
- [x] Desktop layout and console checked in the Vercel preview.

**Prior QA history retained from the previous release**

- References: `C:/Users/박찬영/Desktop/0061.png`, `C:/Users/박찬영/Desktop/0062.png`, `C:/Users/박찬영/Desktop/0063.png`, and `C:/Users/박찬영/AppData/Local/Temp/codex-clipboard-8e45d77f-5278-4aa7-a1c7-bfd58b098c58.png`.
- Existing and Excel-imported properties expose the same smart auto-input section and complete edit form.
- Room-style floor labels normalize on public detail pages: `201호`, `2층전체`, and `410호` display as `2층`, `2층`, and `4층`.
- Basement labels normalize as well: `B1층전체` displays as `지하1층`.
- The public detail and map quick-view use the same floor formatter.
- Previous verification: TypeScript and ESLint passed; 53 tests passed; production deployment `9dc25a3` was ready with no runtime errors during that verification window; `CY-0265` displayed `4층 (총 4층)`; the authenticated edit page showed automatic input, all property fields, existing images, and exposure settings.

final result: passed
