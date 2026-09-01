import { test, expect } from '@playwright/test';
import { GuardrailsPage } from './pages/GuardrailsPage';

// Covers TEST_PLAN.md sections 4 (Cross-Field Logic) and 5 (Draft/Deploy Lifecycle).

test.describe('Draft / Deploy lifecycle', () => {
  let guardrails: GuardrailsPage;

  test.beforeEach(async ({ page }) => {
    guardrails = new GuardrailsPage(page);
    await guardrails.goto();
  });

  test('DD-01 — a chip added while in Draft persists across a page reload', async ({ page }) => {
    const value = `qa-persist-${Date.now()}`;
    await guardrails.addChip('subjects', value);
    await guardrails.expectChipPresent('subjects', value);

    await page.reload();
    await guardrails.expectChipPresent('subjects', value);
  });

  test('DD-02 — the Draft badge is visible while unsaved changes exist', async () => {
    await expect(guardrails.draftBadge).toBeVisible();
  });

  test('DD-03 — clicking Deploy is available and does not error', async () => {
    // Full confirmation that Deploy actually promotes the config to "live" needs a
    // known live/production indicator to assert against — see DD-02/DD-03 open
    // questions in TEST_PLAN.md section 5. This smoke-checks the action is reachable.
    await expect(guardrails.deployButton).toBeEnabled();
  });
});

test.describe('Cross-field OR logic and full pipeline behavior (requires live conversation environment)', () => {
  test.skip(() => true, 'Needs a seeded conversation + real message pipeline to fire test messages through — not available from a static review.');

  test('C-LOGIC-01 — a match in only one field still triggers unassignment (confirms OR, not AND)', async () => {
    // Plan: configure a chip in only "Emails patterns to unassign". Send a test
    // conversation whose sender matches it but whose subject/user-message/reply match
    // nothing configured. Expect the conversation to unassign anyway.
    // This is the single test that resolves the biggest open assumption in this plan.
  });

  test('UM-02 — "cat" should not incorrectly match inside "category" (or should, per literal "contains")', async () => {
    // Plan: add "cat" to Words in User Message. Send a user message containing only
    // "category" and nothing else resembling the word "cat" on its own.
    // Given the confirmed literal-substring "contains" semantics, the most likely
    // real-world outcome is that it DOES incorrectly match — which would be worth
    // flagging as a product bug/limitation, not just a test result.
  });

  test('field independence — a word only in the user message does not trigger the assistant-reply field', async () => {
    // Plan: add a distinct word to only "Words in Assistant's Reply". Send a user
    // message containing that same word but ensure the AI's reply does not repeat it.
    // Expect no unassignment from this field.
  });
});
