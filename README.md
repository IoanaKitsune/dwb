# Dogs Without Borders — Playpen Tracker

Mobile-first web app for shelter volunteers to see which dogs need to be
walked today, grouped by playpen (Țarc 1/2/3 + Padoc/Fricoși). No login required.

## Data model

Two separate tabs:

- **"Grupuri"** (cols A-D): `Țarc`, `Nr. Padoc`, `Căței în Padoc`, `Status`
  — one row per group/padoc.
- **"Catei"** (cols A-F): `Nume Câine`, `Nr. Padoc`, `Mărime Ham`, `Tip`
  (`Prietenos` / `Fricos`), `A Fost Scos` (`TRUE`/`FALSE`), `Istoric / Note`
  — one row per individual dog.

**Dogs are matched to their group primarily by box number (`Nr. Padoc`),
not by name.** A group's `Nr. Padoc` can list more than one box separated by
"/" (e.g. `10/33`) when its dogs are split across boxes — any dog in "Catei"
whose own `Nr. Padoc` is one of those numbers belongs to that group. Name
matching (against "Căței în Padoc") is only a fallback for groups with no
box number, since dog names aren't guaranteed unique (two different dogs can
both be named "Lorien" — this is exactly why box-number matching is the
primary key).

**Any dog in "Catei" that no row in "Grupuri" claims doesn't get dropped** —
it shows up as its own one-dog card in a 5th tab, "Nesortați" (only appears
when there's actually an orphaned dog). That tab is a signal something needs
fixing in "Grupuri", not a permanent home for those dogs.

Each dog's walk checkbox lives on its padoc's detail page and writes
straight into that dog's own row in "Catei", column E (`A Fost Scos`).

This mapping lives in two places that must stay in sync if the sheet layout
ever changes:
- `src/api/parseSheet.js` (client-side, used for the read-only CSV fallback)
- `apps-script/Code.gs` (server-side, used for real read+write)

## Setting up real-time shared sync (recommended)

By default the app can only *read* the sheet (via its public CSV export) and
each dog's walk checkbox is saved per-browser only — it won't sync between
volunteers' phones. To make it fully shared, deploy a small Google Apps
Script Web App bound to the sheet:

1. Open your Google Sheet → **Extensions → Apps Script**.
2. Delete any starter code, then paste in the contents of
   [`apps-script/Code.gs`](apps-script/Code.gs) from this repo.
3. Click **Deploy → New deployment**.
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, then **Authorize access** (this is your own Google
   account approving the script to read/write the sheet on your behalf —
   it's the owner's permission, not each volunteer's).
5. Copy the resulting **Web app URL** (looks like
   `https://script.google.com/macros/s/AKfycb.../exec`).
6. Put it in `.env` (copy from `.env.example`) as:
   ```
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
   ```
   Also set this same value as an environment variable in Netlify (Site
   settings → Environment variables) before deploying there.

Once set, every volunteer's checkbox tap writes straight into that dog's own
row in "Catei" — no login needed, the Google Sheet stays the single source
of truth, and everyone's app polls it every ~20s.

**If you ever update the Apps Script code**, redeploy via **Deploy → Manage
deployments → ✏️ (edit) → New version → Deploy** — the URL stays the same.

### Without Apps Script (read-only mode)

If `VITE_APPS_SCRIPT_URL` isn't set, the app reads the "Grupuri" and "Catei"
tabs via their CSV exports instead (`VITE_GRUPURI_CSV_URL` /
`VITE_CATEI_CSV_URL`) and each dog's walk checkbox is stored only in that
volunteer's browser (localStorage, resets daily).

If neither works (sheet unreachable), the app falls back to built-in demo
data so the UI is still viewable.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Netlify

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Netlify: "Add new site" → connect the repo. Build command `npm run build`,
   publish directory `dist` (already configured in `netlify.toml`).
3. Add `VITE_APPS_SCRIPT_URL` in Netlify env vars (see above).
4. Deploy.
