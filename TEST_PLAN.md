# Test Suite Plan — Guardio "Automation Audit" Guardrails

**Feature under test:** `config/guardrails` → Automation Audit rule builder
**Scope:** Rule fields = *Email patterns*, *Subject*, *Words in user message*, *Words in assistant's reply*

---

## 0. How this plan was built — access limitations, then a real screenshot

I could not open the linked Google Drive video or reach the `guardio.app.getnotch.dev` staging URL directly (auth-gated,
private environment). The first draft of this plan was built from the scope text alone and got some real structure
wrong. I was then given a screenshot of the actual page, which corrected the design. What follows reflects the
screenshot; anything still unconfirmed is marked **[OPEN QUESTION]**.

### Confirmed from the screenshot

- **Location:** Config → Automation → Guardrails (sibling pages: *Automation Level*, *Rules*, *Workflows* — so
  "Guardrails" and "Rules" are apparently two distinct features; this plan covers Guardrails only).
- **No multi-rule builder.** There's a single **config version** (e.g. `YP-15DECEMBER-174421`), shown with a **Draft**
  badge, a **Deploy** button, and a **"⋮" menu**. This is a versioned/draft-then-deploy config, not CRUD over many
  named rules — closer to a feature-flag or config-as-code pattern than a rules engine.
- **Page description:** *"Control AI handoffs by setting deterministic rules with attributes and data, or natural
  language guidance."* This implies a second, natural-language configuration mode may exist elsewhere on this page or
  a related one — **[OPEN QUESTION]**, not covered below since it wasn't visible in the screenshot.
- **The action all four fields drive is "unassign the conversation"** — i.e. hand the conversation off from the AI
  back to a human. This is a meaningfully different mental model from "audit/flag," and it reframes the whole
  feature as a **handoff-trigger config**, not a passive audit log.
- **Each field is independently sufficient — likely OR across fields, not AND.** The copy for each field reads
  "The AI will unassign the conversation if [that field] contains any of these [values]," stated independently per
  field with no "and" language tying them together. This **directly overturns my original AND-composite assumption**
  from the first draft. Test case **C-LOGIC-01** below exists specifically to confirm this against the real product,
  since it's still inferred from copy, not observed behavior.
- **Matching is plain substring "contains," with no format validation.** Proven by real saved data in the
  screenshot: the email-patterns field contains `noreply` and `Gamer @ .com` — neither is a valid email address, yet
  both are saved values. So this field does **not** validate email syntax; it's a bare substring match against the
  sender's address. This overturns my original EP-05 ("invalid email rejected") test case entirely — that behavior
  is not just unconfirmed, it's now confirmed *not* to be the case.
- **Input mechanic:** each field is a chip/tag list. Type text into an input, press **Enter**, and it becomes a
  removable chip (✕ button). Confirmed directly from the empty "Words in Assistant's Reply" field's placeholder:
  *"Add a word (e.g., 'paperwork') and press Enter."*
- **The four fields, verbatim:**

  | Field label | Behavior copy | Example saved values |
  |---|---|---|
  | Emails patterns to unassign | "...if the sender's email address contains any of these patterns." | `newsletters@email.crosswalk.com`, `hey@hey.hey`, `Gamer @ .com`, `noreply` |
  | Subjects | "...if the subject line contains any of these keywords." | `lawyer` |
  | Words in User Message | "...if the user message contains any of these words." | `qwerty`, `bonus`, `banana` |
  | Words in Assistant's Reply | "Unassigns the conversation if the AI agent generated reply contains any of these words." | *(empty in screenshot)* |

### Still open — not visible in the one screenshot I have

- **[OPEN QUESTION]** Exact Draft → Deploy semantics: does adding/removing a chip auto-save to the Draft immediately,
  or is there an unsaved-changes state? Does Deploy apply instantly, and is there a rollback/previous-version view
  (the URL's `?version=` param and the "⋮" menu both suggest yes)?
  Does Deploy instantly? Is there a rollback/previous-version view (the URL's `?version=` param and the "⋮" menu both
  suggest yes)?
- **[OPEN QUESTION]** Case sensitivity of the "contains" match, and whether it's true raw substring (so a user-message
  word list entry `"cat"` would match inside `"category"`) or has some hidden word-boundary logic. The UI copy just
  says "contains," which reads as literal substring — this plan tests against that literal reading and flags it as
  the thing to double check live.
- **[OPEN QUESTION]** Whether empty fields are allowed at Deploy time, any max chip count, duplicate-chip handling,
  and whether the small diamond/sparkle icon next to Deploy does anything (AI-assisted rule suggestion? diff view?).

---

## 1. Test Suite Types

QA on a feature like this isn't one test suite — it's several, each answering a different question:

| Suite | Question it answers | Why it matters here |
|---|---|---|
| **Functional (CRUD)** | Does the rule builder do the basic job — create, read, update, delete, enable/disable? | Foundation; everything else depends on this working |
| **Field Validation / Boundary** | Does each input field accept valid data and reject/handle invalid data sensibly? | Guardrails are a security/safety surface — a rule that silently fails to save, or saves malformed, is worse than no rule |
| **Matching Logic (Functional-Integration)** | Once a rule is saved, does it actually match/trigger correctly against real automation traffic? | The rule builder's *entire purpose* is to produce correct matching — this is the highest-value suite |
| **Negative / Error Handling** | What happens on bad input, conflicting rules, malformed regex, network failure mid-save? | Prevents silent misconfiguration of a safety feature |
| **Security** | Can the input fields be used for ReDoS, script injection, or unauthorized access? | Guardrail config is high-privilege; pattern fields (esp. if regex-capable) are a classic ReDoS vector |
| **UI/UX** | Are validation messages, empty states, confirmation dialogs, and affordances clear and correct? | Misread configuration UI → wrong rule → real-world safety gap |
| **Regression** | Do previously-fixed bugs stay fixed as the feature evolves? | Standard hygiene; seeded from bugs found in other suites |
| **Non-functional: Performance/Scale** | Does matching stay fast/correct with hundreds of rules or huge word lists? | Guardrails must not add meaningful latency to live automations |
| **Accessibility** | Can the form be built and read via keyboard/screen reader? | Standard compliance bar |

Priority key used below: **P0** = blocks release if broken, **P1** = high value, **P2** = nice-to-have coverage.

---

## 2. Chip/Tag UI Mechanics (applies identically to all four fields)

Since all four fields share one input pattern (type → Enter → chip → ✕ to remove), these are written once and
should be run against each of the four fields rather than four times over:

| ID | Test Case | Priority |
|---|---|---|
| CHIP-01 | Typing a value and pressing Enter adds it as a chip and clears the input | P0 |
| CHIP-02 | Clicking a chip's ✕ removes it immediately | P0 |
| CHIP-03 | Adding the same value twice — confirm whether it's silently deduped, rejected with a message, or allowed as a literal duplicate chip | P1 |
| CHIP-04 | Submitting an empty string (Enter with no text) does not create a blank chip | P1 |
| CHIP-05 | A value that is only whitespace does not create a blank/invisible chip | P1 |
| CHIP-06 | Leading/trailing whitespace on an otherwise valid value is trimmed before saving as a chip | P2 |
| CHIP-07 | A very long value (e.g. 500+ chars) — confirm truncation/limit/scroll behavior rather than broken layout | P2 |
| CHIP-08 | Keyboard-only flow: tab into the input, type, Enter, tab to the new chip's ✕, activate with Enter/Space (accessibility) | P1 |
| CHIP-09 | Pasting a comma or newline-separated block of text — confirm whether it's split into multiple chips or added as one literal chip (screenshot doesn't show a bulk-add affordance, so single-chip-per-paste is the current best guess) | P2 |

## 3. Field-Level Test Case Matrix

All four fields use plain **substring "contains"** matching per the on-page copy, confirmed by real data in the
screenshot (`noreply` and `Gamer @ .com` are saved values in a field labeled "Emails patterns," despite not being
valid email syntax — proving there's no format validation, just text containment). Test cases below test *that*
behavior, not a hypothetical wildcard/regex/exact-match engine.

### 3.1 Emails patterns to unassign

| ID | Test Case | Priority |
|---|---|---|
| EP-01 | A pattern like `@notch.dev` is accepted and saved as a chip, with no email-format validation required (matches observed `noreply` / `Gamer @ .com` behavior) | P0 |
| EP-02 | A saved pattern matches when it appears anywhere within the sender's email address (true substring, e.g. `crosswalk.com` matches `newsletters@email.crosswalk.com`) | P0 |
| EP-03 | A pattern does **not** trigger unassignment when it is absent from the sender's address | P0 |
| EP-04 | Case sensitivity of the contains-match is confirmed either way (`NOREPLY` vs `noreply`) | P1 |
| EP-05 | Multiple patterns in the field are OR'd — any single pattern matching is sufficient to unassign | P0 |
| EP-06 | Removing a chip (✕) stops that pattern from triggering unassignment on the next message | P0 |
| EP-07 | An empty patterns field means this category never triggers unassignment (not "always matches") | P0 |
| EP-08 | Chip mechanics (see Section 2) all pass for this field specifically | P1 |

### 3.2 Subjects

| ID | Test Case | Priority |
|---|---|---|
| SU-01 | A keyword like `lawyer` triggers unassignment when the subject line contains it anywhere, not just as a whole word (per "contains" copy) | P0 |
| SU-02 | A keyword absent from the subject does not trigger unassignment | P0 |
| SU-03 | Case sensitivity is confirmed either way (`Lawyer` vs `lawyer`) | P1 |
| SU-04 | Special characters/unicode/emoji in a keyword are accepted and match correctly | P2 |
| SU-05 | Empty subjects field means this category never triggers unassignment | P0 |
| SU-06 | Chip mechanics (Section 2) pass for this field | P1 |

### 3.3 Words in User Message

| ID | Test Case | Priority |
|---|---|---|
| UM-01 | A saved word (e.g. `banana`) triggers unassignment when it appears anywhere in the user's message | P0 |
| UM-02 | **Substring bleed-through**, given literal "contains" semantics: does the word `cat` incorrectly match inside `category`? This is the single highest-value test in this field, precisely because the confirmed behavior (plain substring) makes it a real risk, not a hypothetical | P0 |
| UM-03 | Multiple words in the list are OR'd — any one present is sufficient | P0 |
| UM-04 | Case sensitivity is confirmed either way | P1 |
| UM-05 | Empty word list means this category never triggers unassignment | P0 |
| UM-06 | A word appearing only in the **assistant's reply** does not incorrectly trigger this field (field independence) | P0 |
| UM-07 | Chip mechanics (Section 2) pass for this field | P1 |

### 3.4 Words in Assistant's Reply

| ID | Test Case | Priority |
|---|---|---|
| AR-01–AR-05 | Mirror UM-01–UM-05 against the assistant-reply field and its own saved words | P0–P1 |
| AR-06 | A word appearing only in the **user's message** does not incorrectly trigger this field (independence, mirrors UM-06) | P0 |
| AR-07 | Matching isn't broken by markdown/formatting in the AI's rendered reply (e.g. a bolded `**paperwork**` still contains "paperwork") | P1 |
| AR-08 | Chip mechanics (Section 2) pass for this field | P1 |

---

## 4. Cross-Field Logic Test Cases

The on-page copy states each field's trigger independently ("The AI will unassign the conversation if [field]
contains any of these..."), with no "and" language linking fields — the working model is **OR across fields**, a
reversal of my original AND assumption. This section exists to lock that in against real behavior.

| ID | Test Case | Priority |
|---|---|---|
| C-LOGIC-01 | A conversation whose email matches **only** the email-patterns field (subject/words don't match anything configured) still gets unassigned — confirms fields are OR'd, not AND'd | P0 |
| C-LOGIC-02 | A conversation matching **all four** fields simultaneously gets unassigned exactly once (not four redundant unassign actions/events) | P1 |
| C-LOGIC-03 | A conversation matching **none** of the four fields is not unassigned | P0 |
| C-LOGIC-04 | Editing one field (e.g. removing the only chip in Subjects) doesn't affect the independent triggering of the other three fields | P1 |

## 5. Draft / Deploy Lifecycle

This is new territory the screenshot surfaced that a simple "rule builder" model would have missed entirely.

| ID | Test Case | Priority |
|---|---|---|
| DD-01 | Adding/removing a chip while in Draft persists across a page reload (confirms it autosaves to the draft, vs. being lost) | P0 |
| DD-02 | The Draft badge accurately reflects that changes are **not yet live** — verified against whatever live/production indicator exists (needs product access to confirm what that indicator is) | P0 |
| DD-03 | Clicking **Deploy** promotes the current draft to the active/live config | P0 |
| DD-04 | After Deploy, making a further chip edit creates a new Draft rather than silently mutating the already-deployed version | P1 |
| DD-05 | The "⋮" menu next to the version badge — enumerate its actual options (rename, discard draft, view history, duplicate) once accessible, and write cases per option | P2 — **[OPEN QUESTION]**, contents unknown from the screenshot |
| DD-06 | The `?version=` URL param can be used to view a prior deployed version's config as read-only or editable — confirm which, since this affects whether direct-navigation tests can safely run in parallel | P2 — **[OPEN QUESTION]** |
| DD-07 | Two people editing the same Draft concurrently — last-write-wins vs. conflict warning (worth a quick manual check even if not automated) | P2 |

---

## 4. Non-Functional Suites

### Security
| ID | Test Case | Priority |
|---|---|---|
| SEC-01 | ReDoS check: a pathological regex pattern (e.g. `(a+)+$`) in any regex-capable field does not hang the matching engine | P0 |
| SEC-02 | Script/HTML injection in rule name, pattern, or word-list fields is escaped on render, not executed | P0 |
| SEC-03 | Permission check: a user without guardrail-admin rights cannot create/edit/delete rules via UI or direct API call | P0 |
| SEC-04 | API-level test: guardrail endpoints reject requests without a valid session/auth token | P0 |

### Performance
| ID | Test Case | Priority |
|---|---|---|
| PERF-01 | Matching latency stays within acceptable bounds with 500+ active rules | P1 |
| PERF-02 | A single word list with 1,000+ entries still matches correctly and quickly | P2 |

### Accessibility
| ID | Test Case | Priority |
|---|---|---|
| A11Y-01 | All form fields have programmatic labels (screen-reader accessible) | P1 |
| A11Y-02 | Full rule-creation flow is completable via keyboard only | P1 |

---

## 6. Implementation Notes

- **Stack chosen:** Playwright + TypeScript — strong auto-waiting (fewer flaky tests), and reads cleanly for an
  interview presentation. Happy to swap to Cypress, Selenium/Python, or pure API tests if that better matches your
  stack.
- **What's actually implemented** (per the assignment, not everything needs to be): the chip UI mechanics (Section 2)
  against all four fields, a representative slice of the field-level P0 cases, and the OR-across-fields logic check.
  Draft/Deploy lifecycle tests are stubbed but marked as needing product access to confirm the live/production
  indicator before they can assert anything meaningful.
- **Selectors are grounded in the real screenshot** — exact field labels, the confirmed placeholder text, and the
  visible "Deploy" button text — rather than invented `data-testid`s. What's still guessed is the *DOM nesting*
  (which container wraps which heading/input/chip), since a screenshot doesn't reveal markup structure. Each such
  guess is commented `// ASSUMED DOM STRUCTURE`. Sharing the rendered HTML (or DevTools → "Copy → Copy element") for
  one field would let me lock the rest in exactly.
- **Not implemented, by design:** end-to-end "does unassignment actually happen" tests (C-LOGIC-*) require a live
  conversation/automation pipeline to fire test messages through — written as *skipped* specs with the plan and
  assertions ready to un-skip once there's a seeded test conversation to run them against.
