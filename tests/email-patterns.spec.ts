import { test, expect } from '@playwright/test';
import { GuardrailsPage } from './pages/GuardrailsPage';

// Covers TEST_PLAN.md section 3.1 — Emails patterns to unassign
// Confirmed behavior: plain substring "contains" match against sender email, NO email
// format validation (screenshot shows saved non-email values like "noreply").

test.describe('Emails patterns to unassign', () => {
  let guardrails: GuardrailsPage;

  test.beforeEach(async ({ page }) => {
    guardrails = new GuardrailsPage(page);
    await guardrails.goto();
  });

  test('EP-01 — a non-email-shaped pattern is accepted (no format validation)', async () => {
    // Mirrors the real saved value "noreply" seen in the screenshot.
    const value = `qa-noreply-${Date.now()}`;
    await guardrails.addChip('emailPatterns', value);
    await guardrails.expectChipPresent('emailPatterns', value);
  });

  test('EP-06 — removing a pattern chip stops it from being a saved condition', async () => {
    const value = `qa-remove-me-${Date.now()}`;
    await guardrails.addChip('emailPatterns', value);
    await guardrails.expectChipPresent('emailPatterns', value);
    await guardrails.removeChip('emailPatterns', value);
    await guardrails.expectChipAbsent('emailPatterns', value);
  });

  // EP-02/EP-03 (actual substring matching against a live sender address) and
  // EP-04 (case sensitivity) require firing a real conversation through the pipeline —
  // see logic-and-lifecycle.spec.ts's skipped block.
});
