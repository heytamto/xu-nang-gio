# Unified UI + Weather integration

This patch adds design tokens and shared UI primitives, normalizes page wrappers and literal h1 classes across eight pages, uses PageHeader on StoryPage, integrates weather in HomePage and ConfigVoucherTab, and improves weather diagnostics. It does not redesign all forms or cards, change CRUD, change checkout pricing, or replace the existing global CSS.

## Apply
1. Back up/commit your working tree. Extract ZIP at repository root. Weather files replace the previous Performance patch versions; review local edits first.
2. Run `node scripts/apply-unified-ui.mjs` from repository root. It stages page changes in memory before writing, fails if required integration anchors/files are absent, and is safe to run twice on the tested baseline. Inspect `git diff`. It does not copy old page files over current ones.
3. If the two weather migrations have not been applied, run them in order in Supabase SQL Editor. They preserve existing weather config and cache. Use `supabase/tests/weather_diagnostics_readonly.sql` to check. Do not blindly rerun migrations if already present.
4. Vercel server environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WEATHERAPI_KEY (no VITE_ prefix). Redeploy after changes. Keep the service key and provider key out of Git and frontend.
5. Admin > Cấu hình & Mã > Cấu hình thời tiết nhà vườn > enable + save. Weather defaults disabled. CDN can retain old response ~60s, frontend cache 5 min (pending 30s); refresh once after saving. Provider backoff may be 5–30 min after errors. Do not reset the lease/backoff just to debug.
6. `npm test && npm run build`. Deploy. `curl -i https://www.xunanggio.com/api/weather` must return JSON. If disabled, check settings; if pending, inspect logs and cache; if 503, check migrations/env; HTML/404 indicates route/deploy issue. Standard Vite dev does not serve Vercel functions; use Vercel dev or production.

Logs include only RPC name and HTTP status / generic messages, not provider URL or credentials. Existing 15-min shared TTL, lease, stale cache, backoff and 8s provider timeout are unchanged.

## Scope / verification
Baseline assembled from Configuration Cleanup and Adaptive Shipping, Mobile, Brand Identity, Performance, Story Editorial patches. 109/109 baseline regression tests pass in Node 22.16.0; 16 files had zero TypeScript transpile syntax diagnostics. Script ran twice with no changes on second run. Not a production build, CSS compiler run, browser visual regression or actual PostgreSQL concurrency test. Production URL inaccessible from this environment. Existing custom header structure and business widgets kept. Button/Card are provided for incremental adoption; most current controls remain unchanged. No new libraries.
