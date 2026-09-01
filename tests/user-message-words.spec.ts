import { test } from '@playwright/test';
import { GuardrailsPage } from './pages/GuardrailsPage';

// Covers TEST_PLAN.md section 3.3 — Words in User Message

test.describe('Words in User Message', () => {
  let guardrails: GuardrailsPage;

  test.beforeEach(async ({ page }) => {
    guardrails = new GuardrailsPage(page);
    await guardrails.goto();
  });

  test('UM-01 — a word is accepted and saved as a chip', async () => {
    const value = `qa-word-${Date.now()}`;
    await guardrails.addChip('userMessageWords', value);
    await guardrails.expectChipPresent('userMessageWords', value);
  });

  // UM-02 (does "cat" incorrectly match inside "category"?) is the single highest-value
  // test in this whole suite, precisely because the confirmed "contains" semantics make
  // it a real, likely bug rather than a hypothetical edge case. It requires a live
  // conversation to fire a real user message through — see
  // logic-and-lifecycle.spec.ts's skipped block, test 'UM-02'.
});
