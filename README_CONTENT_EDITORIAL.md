# Chuyện vườn & Cẩm nang — editorial + CRUD patch

Baseline: xunanggio_config_cleanup.zip + EditStory/EditPost from xng_mobile_responsive_patch.zip. Not a current Git checkout. Merge locally if changed.

## Install
Extract ZIP into repository root. The existing shared ListPagination/useListPagination and Mobile ModalPortal are required. ImageUploadField must support optional onUploadStateChange (already provided by xng_storefront_image_upload_patch.zip); otherwise upload guard is inactive. Do not overwrite the shared component with an older version.
Run `node --test tests/content-editorial.mjs`, `npm test && npm run build`.

## Database
Run supabase/tests/content_crud_readonly.sql in SQL Editor to inspect existing RLS, trigger functions and sequence values. If the deployed triggers still use fixed `lpad(...,2,...)`, run the included migration after reviewing the function definitions. It preserves existing IDs and sequences; it does not repair sequence drift or duplicate IDs. No data is deleted. The UI fix itself does not require SQL. Do not relax RLS.

## Manual acceptance (staging preferred)
1. Sign in as owner/admin. For each of Chuyện vườn and Cẩm nang, create one clearly marked QA article with cover, title, summary/body; verify row in DB and public page after refresh.
2. Edit title/body/cover; check that updated row, public detail and reload match. Verify save is blocked during upload if ImageUploadField supports callback.
3. Delete only the QA article: cancel first (row stays), then confirm (row removed in DB and after reload). Delete last article only on isolated staging. Simulate denied permission: UI must not remove row or claim success.
4. Verify anon can read but cannot insert/update/delete; warehouse cannot write. Verify admin can upload to posts/stories buckets. Do not expose service role key.
5. Test filters/search, 320/375/390/768/1024 widths, missing/broken cover, long titles, return from detail, pagination. No live mutations or browser E2E were performed here.

Known limits: existing content query loads all posts/stories; pagination is client-side. Initial loading and errors are still owned by app-level data flow; no new fetch. Reset button invokes existing reload callback. No automatic storage deletion (images may be shared). No content changes. Build requires dependencies in user's workspace.
