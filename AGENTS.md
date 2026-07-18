# KiDit Helper Agent Card

Scope: public, nurse-first KiDit bookmarklet and its static installation site.

- `src/bookmarklet.js` is the sole source of runtime behavior.
- The tool must remain self-contained: no remote code, telemetry, persistence, cookies, or automatic form submission.
- Fail closed unless the exact KiDit host, numeric `/Start/Edit/<id>` path, and `/Start/SaveDeleteCancel` form action match.
- v0.1 enhances only the native `TurnHospital` select; defer every additional field until nurse feedback.
- The transfer flow may start at No or with no county selected: remain active across dynamic control insertion, disable search until options load, and never treat that valid empty state as schema drift.
- The primary installer is the direct draggable `javascript:` link on GitHub Pages; accept Chrome's default globe favicon instead of adding download/import steps.
- Preserve native controls, exact option values, blank semantics, KiDit change events, and manual save.
- Never add patient data, KiDit credentials, session material, or clinical screenshots to this repository or its issues.
- Version all first-stage releases as `0.x`; keep source, package, installation page, and release tag identical.
- Run `npm test` before every release and commit generated `docs/` artifacts.
- User-facing text is Traditional Chinese; code and machine-facing instructions are English.
