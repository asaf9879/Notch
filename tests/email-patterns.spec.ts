import { test, expect } from '@playwright/test';
import { GuardrailsPage } from './pages/GuardrailsPage';

// Covers TEST_PLAN.md section 2.1 — Email Patterns

test.describe('Guardrail rule — Email patterns field', () => {
  let guardrails: GuardrailsPage;

  test.beforeEach(async ({ page }) => {
    guardrails = new GuardrailsPage(page);
    await guardrails.goto();
    await guardrails.openNewRuleForm();
  });

  test('EP-01 — exact email pattern is accepted and saved', async () => {
    await guardrails.fillRuleName('EP-01 exact email');
    await guardrails.addEmailPattern('finance@notch.dev');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
  });

  test('EP-02 — wildcard domain pattern is accepted', async () => {
    await guardrails.fillRuleName('EP-02 wildcard domain');
    await guardrails.addEmailPattern('*@notch.dev');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
  });

  test('EP-05 — invalid email syntax is rejected with a clear error', async () => {
    await guardrails.fillRuleName('EP-05 invalid syntax');
    await guardrails.addEmailPattern('not-an-email');
    await guardrails.save();
    await guardrails.expectValidationError('valid email');
  });

  test('EP-06 — multiple email patterns on one rule combine as OR', async () => {
    await guardrails.fillRuleName('EP-06 multi-pattern OR');
    await guardrails.addEmailPattern('a@notch.dev');
    await guardrails.addEmailPattern('b@notch.dev');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
    // Full OR-behavior confirmation requires firing a live automation against each
    // address independently — see matching-logic.spec.ts (skipped, needs live env).
  });

  test('EP-12 — empty email-pattern field does not block saving a rule using only other fields', async () => {
    await guardrails.fillRuleName('EP-12 empty email field');
    await guardrails.fillSubject('Refund request');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
  });

  test('SEC-01 — pathological regex pattern does not hang the save request', async ({ page }) => {
    await guardrails.fillRuleName('SEC-01 ReDoS probe');
    await guardrails.addEmailPattern('(a+)+$@notch.dev');
    const start = Date.now();
    await guardrails.save();
    // Either it's rejected as invalid, or it saves — but must respond within a sane bound.
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
    expect(Date.now() - start).toBeLessThan(5000);
  });
});
