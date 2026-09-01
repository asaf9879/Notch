# Notch QA Assignment — Guardio Automation Audit Guardrails

Test suite for `config/guardrails` — Automation Audit rules (email patterns, subject, words in user
message, words in assistant's reply).

**Start here:** [`TEST_PLAN.md`](./TEST_PLAN.md) — the full test suite design: test suite types, a
field-by-field test case matrix with IDs, composite/cross-field cases, and non-functional (security,
performance, accessibility) coverage. This repo implements a representative slice of that plan, per the
assignment ("you do not need to implement all test cases").

## Status / honesty note

I did not have access to the live staging environment or the walkthrough video when building this, so:
- The test plan is built from the scope description alone. Assumptions are marked **[ASSUMPTION]** in
  `TEST_PLAN.md` — please correct me on any of these.
- Selectors in `tests/pages/GuardrailsPage.ts` are placeholders, each flagged `// ASSUMED SELECTOR`.
  Point me at the real markup and they take five minutes to fix.
- A few specs under `composite-rules.spec.ts` are intentionally `test.skip`'d — they need a live
  automation pipeline to fire messages through, which isn't available from a static review. The
  assertion logic and rationale are written inline, ready to un-skip.

## Setup

```bash
npm install
npx playwright install --with-deps chromium
```

## Running

```bash
BASE_URL=https://guardio.app.getnotch.dev npm test        # headless
BASE_URL=https://guardio.app.getnotch.dev npm run test:ui  # interactive UI mode
npm run report                                             # view last HTML report
```

Auth: none is wired up yet since I don't know the login flow for the environment — add a
`storageState` / login fixture in `playwright.config.ts` once that's known, per the
[Playwright auth docs](https://playwright.dev/docs/auth).

## Repo layout

```
TEST_PLAN.md                        full test suite design (start here)
playwright.config.ts
tests/
  pages/GuardrailsPage.ts           Page Object — all selectors isolated here
  email-patterns.spec.ts            EP-* cases
  subject.spec.ts                   SU-* cases
  user-message-words.spec.ts        UM-* cases
  assistant-reply-words.spec.ts     AR-* cases
  composite-rules.spec.ts           C-COMPOSITE-*, CRUD, skipped matching-logic cases
```

## Pushing to your own remote

This was built in a sandbox with no outbound network access, so it's committed locally only. To push:

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```
