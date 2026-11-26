# Xứ Nắng Gió — release candidate

React + Vite + Supabase.

- `src/`: unchanged application source.
- `supabase/functions/`: Edge Functions.
- `supabase/archive/`: historical SQL; do not replay automatically.
- `supabase/migrations/`: future migrations after baseline reconciliation.
- `docs/`, `scripts/`, `tests/`: documentation, tooling and regression tests.

Use Node 22.16 or a compatible newer release. Preserve local `.env` and `.git`; copy `.env.example` only for new setups.

```sh
npm ci
npm test
npm run build
npm run dev
```

See `docs/TESTING.md` for quality tooling, `docs/CONFIG_CLEANUP.md` for applying the cleanup. No SQL or Edge deployment required by this configuration-only change.
