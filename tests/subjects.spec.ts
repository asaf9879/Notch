import { test } from '@playwright/test';
import { GuardrailsPage } from './pages/GuardrailsPage';

// Covers TEST_PLAN.md section 3.2 — Subjects

test.describe('Subjects', () => {
  let guardrails: GuardrailsPage;

  test.beforeEach(async ({ page }) => {
    guardrails = new GuardrailsPage(page);
    await guardrails.goto();
  });

  test('SU-01 — a keyword is accepted and saved as a chip', async () => {
    const value = `qa-keyword-${Date.now()}`;
    await guardrails.addChip('subjects', value);
    await guardrails.expectChipPresent('subjects', value);
  });

  // SU-01/SU-02 (actual "contains anywhere in subject line" matching) and SU-03 (case
  // sensitivity) require a live conversation to test against — see
  // logic-and-lifecycle.spec.ts's skipped block.
});
