# KiDit Helper Agent Card

Scope: public, nurse-first KiDit bookmarklet and its static installation site.

- `src/bookmarklet.js` is the sole source of runtime behavior.
- The tool must remain self-contained: no remote code, telemetry, persistence, cookies, or automatic form submission.
- Fail closed unless the exact KiDit host, patient Create/Edit path, and expected form action match.
- Preserve native controls, exact option values, blank semantics, KiDit change events, and manual save.
- Never add patient data, KiDit credentials, session material, or clinical screenshots to this repository or its issues.
- Version all first-stage releases as `0.x`; keep source, package, installation page, and release tag identical.
- Run `npm test` before every release and commit generated `docs/` artifacts.
- User-facing text is Traditional Chinese; code and machine-facing instructions are English.
