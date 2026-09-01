# Notch QA Assignment — Guardio Automation Audit Guardrails

Test suite for `config/guardrails` — Automation Audit rules (email patterns, subject, words in user
message, words in assistant's reply).

**Start here:** [`TEST_PLAN.md`](./TEST_PLAN.md) — the full test suite design: test suite types, a
field-by-field test case matrix with IDs, composite/cross-field cases, and non-functional (security,
performance, accessibility) coverage. This repo implements a representative slice of that plan, per the
assignment ("you do not need to implement all test cases").

## Status / honesty note

I didn't have access to the live staging environment or the walkthrough video, but I was given a real
screenshot of the page, which is what this plan and suite are grounded in (see `TEST_PLAN.md` section 0
for exactly what that screenshot confirmed vs. what's still open). Two rounds of correction happened here
worth knowing about going into the interview:

- **My first draft assumed** a multi-rule builder with AND-logic across fields and email-format
  validation. **The screenshot overturned all three**: it's a single versioned Draft/Deploy config, each
  field is an independent OR condition, and there's no email-format validation (proven by real saved
  values like `noreply` sitting in the "email patterns" field).
- Field labels, the Deploy button, and the chip-input placeholder text in
  `tests/pages/GuardrailsPage.ts` are exact, taken from the screenshot. What's still guessed is DOM
  *nesting* (a screenshot shows layout, not markup) — each such guess is flagged
  `// ASSUMED DOM STRUCTURE`. Real HTML for one field would let me lock in the rest.
- Tests requiring a live conversation pipeline (does a match actually trigger unassignment?) are
  `test.skip`'d in `logic-and-lifecycle.spec.ts`, with the plan and rationale written inline.

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
  pages/GuardrailsPage.ts           Page Object — grounded in the real screenshot
  chip-mechanics.spec.ts            CHIP-* cases, parametrized across all 4 fields
  email-patterns.spec.ts            EP-* cases
  subjects.spec.ts                  SU-* cases
  user-message-words.spec.ts        UM-* cases
  assistant-reply-words.spec.ts     AR-* cases
  logic-and-lifecycle.spec.ts       C-LOGIC-*, DD-*, skipped live-pipeline cases
```

## Pushing to your own remote

This was built in a sandbox with no outbound network access, so it's committed locally only. To push:

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```
