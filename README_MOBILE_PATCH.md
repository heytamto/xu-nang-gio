# Mobile responsive patch

Based on supplied configuration-cleanup source and later checkout / policy patches. Stop Vite before copying. Copy listed files at project root. No DB migration, dependency or Edge Function update.

Changes: checkout single-column order on mobile/tablet, compact policy with expandable details, sticky submit/total (inline while typing), desktop policy fit retained; CustomDropdown portal with desktop anchored menu, mobile bottom sheet, Escape/outside close and Tab cycling; opt-in full-screen editors for product/post/story/shipping policy; mobile editor sticky header/footer; input 16px and QR wrapping. Existing submit handler remains the only order creation path.

Existing policyLayout.mjs dependency included to prevent missing import. Ensure it is tracked by Git (git check-ignore -v; git add -f if necessary). All 99 existing tests passed; syntax parse of 172 source files and relative import checks passed. No node_modules/browser in environment; no actual production build, device test or Lighthouse. CSS visual order on mobile differs from DOM order; keyboard / screen-reader order requires further verification. Full focus trapping not added to existing general modals; only dropdown. Admin and warehouse pages outside edited forms not redesigned. Safe-area CSS uses env values from browser without changing viewport meta.

Acceptance: 320/375/390/412/768/1024 widths; COD and both QR modes, voucher, gift, submit failures, virtual keyboard, modal nested dropdown, Escape, upload/save, no horizontal overflow; confirm desktop 7-mode policy fitting. Run npm test and npm run build in WSL before commit.
