import { test } from '@playwright/test';
import { GuardrailsPage } from './pages/GuardrailsPage';

// Covers TEST_PLAN.md section 3.4 — Words in Assistant's Reply

test.describe("Words in Assistant's Reply", () => {
  let guardrails: GuardrailsPage;

  test.beforeEach(async ({ page }) => {
    guardrails = new GuardrailsPage(page);
    await guardrails.goto();
  });

  test('AR-01 — a word is accepted and saved as a chip', async () => {
    const value = `qa-reply-word-${Date.now()}`;
    await guardrails.addChip('assistantReplyWords', value);
    await guardrails.expectChipPresent('assistantReplyWords', value);
  });

  // AR-06/UM-06 (field independence — a word only in one field shouldn't trigger the
  // other) and AR-07 (markdown-formatted replies still match) require a live
  // conversation — see logic-and-lifecycle.spec.ts's skipped block.
});
