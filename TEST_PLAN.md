# Test Suite Plan — Guardio "Automation Audit" Guardrails

**Feature under test:** `config/guardrails` → Automation Audit rule builder
**Scope:** Rule fields = *Email patterns*, *Subject*, *Words in user message*, *Words in assistant's reply*

---

## 0. How this plan was built — access limitations & assumptions

I could not open the linked Google Drive video or the `guardio.app.getnotch.dev` staging URL (auth-gated, private
environment, no network egress from where this was authored). Everything below is inferred from the scope text and
general knowledge of how rule/guardrail builders in this space work. Assumptions that materially affect the plan are
marked **[ASSUMPTION]** so they're easy to find and correct.

**[ASSUMPTION]** The feature lets an admin define one or more **Automation Audit rules**. Each rule has some
combination of:
- **Email patterns** — matches against the sender/recipient email of an automation (exact, wildcard, or regex)
- **Subject** — matches against an email/automation subject line
- **Words in user message** — a keyword/phrase list matched against the inbound user message the automation is
  reacting to
- **Words in assistant's reply** — a keyword/phrase list matched against the AI-generated reply

**[ASSUMPTION]** A rule fires (gets flagged/audited/blocked — exact action unknown) when its configured fields match,
and multiple fields on one rule combine with **AND** logic, while multiple values within one field (e.g. two words in
the same list) combine with **OR** logic. This is the most common pattern for rule builders of this shape, but it is
the single biggest assumption in this plan — **Test Case #C-COMPOSITE-01 below exists specifically to confirm or
disprove it**, and if it's wrong most of the composite section needs re-priority, not re-design.

**[ASSUMPTION]** Rules can be created, edited, enabled/disabled, and deleted, and there is some list/table view to
manage them.

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

## 2. Field-Level Test Case Matrix

### 2.1 Email Patterns

| ID | Test Case | Priority |
|---|---|---|
| EP-01 | Exact email address matches an automation from/to that exact address | P0 |
| EP-02 | Wildcard domain pattern (e.g. `*@notch.dev`) matches any sender on that domain | P0 |
| EP-03 | Wildcard pattern does **not** match a similar-but-different domain (e.g. `*@notch.dev` vs `notch.devil.com`) | P0 |
| EP-04 | Matching is case-insensitive (`User@Notch.dev` matches `user@notch.dev`) | P1 |
| EP-05 | Invalid email syntax is rejected on save with a clear error, not silently accepted | P0 |
| EP-06 | Multiple email patterns in one rule combine as OR (any one match fires the rule) | P0 |
| EP-07 | Leading/trailing whitespace in the pattern is trimmed or explicitly rejected (not silently non-matching) | P1 |
| EP-08 | Subdomain handling: does `*@notch.dev` match `user@mail.notch.dev`? Behavior should be defined and tested either way | P1 |
| EP-09 | Internationalized/unicode local-part or domain (e.g. `user@münchen.example`) | P2 |
| EP-10 | Duplicate pattern across two different rules — confirm both rules still evaluate independently | P1 |
| EP-11 | Extremely long pattern string (e.g. 5,000 chars) — save behavior and any max-length enforcement | P2 |
| EP-12 | Empty email-pattern field with other fields populated — confirm field is correctly treated as "not part of the match condition," not "matches everything" or "matches nothing" | P0 |

### 2.2 Subject

| ID | Test Case | Priority |
|---|---|---|
| SU-01 | Exact subject string match | P0 |
| SU-02 | Partial/"contains" match, if supported — confirm which mode is default | P0 |
| SU-03 | Case sensitivity behavior is defined and consistent with documented/expected behavior | P1 |
| SU-04 | Special characters (quotes, emoji, non-Latin script) in subject match correctly | P1 |
| SU-05 | Empty subject field is treated as "no constraint," not as "match empty subjects only" | P0 |
| SU-06 | Leading/trailing/internal whitespace differences don't break an otherwise-correct match | P2 |
| SU-07 | Regex/wildcard subject pattern (if supported) — valid pattern matches; invalid pattern rejected at save | P1 |

### 2.3 Words in User Message

| ID | Test Case | Priority |
|---|---|---|
| UM-01 | Single keyword present in user message triggers the rule | P0 |
| UM-02 | Multiple keywords combine as OR — any one present is sufficient | P0 |
| UM-03 | Word-boundary correctness: a listed word like "cat" does not falsely match inside "category" (unless substring matching is the documented, intended behavior) | P0 |
| UM-04 | Case-insensitive matching ("Refund" list word matches "I want a refund") | P1 |
| UM-05 | Punctuation adjacent to the word doesn't prevent a match ("refund." / "refund," / "(refund)") | P1 |
| UM-06 | Bulk-add / paste a list of words works and each entry is matched independently | P1 |
| UM-07 | Duplicate word entries in the same list are handled gracefully (de-duped or harmlessly redundant) | P2 |
| UM-08 | Empty word list is treated as "no constraint from this field" | P0 |
| UM-09 | Non-English / unicode words match correctly | P2 |
| UM-10 | A word that only appears in the **assistant's** reply does *not* incorrectly trigger the user-message field | P0 |

### 2.4 Words in Assistant's Reply

| ID | Test Case | Priority |
|---|---|---|
| AR-01 through AR-09 | Mirror UM-01–UM-09 against the assistant-reply field | P0–P2 (mirrors above) |
| AR-10 | A word appearing only in the **user's** message does not incorrectly trigger the assistant-reply field (independence from UM-10) | P0 |
| AR-11 | Matching ignores markdown/HTML formatting artifacts in the assistant's rendered reply (e.g. a bolded `**refund**` still matches "refund") | P1 |

---

## 3. Composite / Cross-Field Test Cases

These validate the interaction between fields — arguably the highest-risk area, since it's where the
**[ASSUMPTION]** in Section 0 about AND/OR logic gets proven right or wrong.

| ID | Test Case | Priority |
|---|---|---|
| C-COMPOSITE-01 | A rule with both an email pattern and a user-message word: confirm whether **both** must match (AND) or **either** (OR), and lock that behavior into a test | P0 |
| C-COMPOSITE-02 | A rule with all four fields populated fires only when every configured field's condition is met (assuming AND) | P0 |
| C-COMPOSITE-03 | Disabling a rule stops it from firing on new automations without deleting its configuration | P0 |
| C-COMPOSITE-04 | Editing a live rule's word list takes effect on the next automation run without requiring a re-save/republish step elsewhere | P1 |
| C-COMPOSITE-05 | Deleting a rule stops future triggers but does not retroactively remove/alter past audit log entries | P1 |
| C-COMPOSITE-06 | Two overlapping rules both fire independently on the same automation event (no "first match wins" swallowing) — or, if the product intentionally uses first-match-wins, that priority order is deterministic and testable | P1 |
| C-COMPOSITE-07 | Saving a rule with all fields empty is rejected (a rule that matches everything is very likely not intended) | P0 |

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

## 5. Implementation Notes

- **Stack chosen:** Playwright + TypeScript. It's the current industry-standard for browser E2E, has strong
  auto-waiting (fewer flaky tests), and reads cleanly for an interview presentation. Happy to swap to Cypress,
  Selenium/Python, or pure API tests (Postman/pytest+requests) if that better matches your stack — say the word and
  I'll port it.
- **What's actually implemented** (per the assignment, not everything needs to be): a representative slice covering
  P0 cases across all four fields, plus one composite case, structured with a Page Object so the rest of the matrix
  can be filled in quickly. Every implemented test is traceable to its ID above via a comment.
- **Selectors are placeholders.** Since I can't see the real DOM, `GuardrailsPage.ts` uses `data-testid`-style
  selectors with a clearly marked `// ASSUMED SELECTOR` comment on each one. Swap these for the real ones (or send me
  a screenshot / the rendered HTML and I'll do it) and the suite runs as-is.
- **Not implemented, by design:** matching-logic tests that require a live backend to actually run an automation
  end-to-end (Section 2 "trigger" assertions) are written as *skipped* specs with the assertion logic ready to
  un-skip once there's a test environment with a seeded automation to fire against.
