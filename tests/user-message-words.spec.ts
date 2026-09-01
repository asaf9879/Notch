import { test, expect } from '@playwright/test';
import { GuardrailsPage } from './pages/GuardrailsPage';

// Covers TEST_PLAN.md section 2.3 — Words in user message

test.describe('Guardrail rule — Words in user message field', () => {
  let guardrails: GuardrailsPage;

  test.beforeEach(async ({ page }) => {
    guardrails = new GuardrailsPage(page);
    await guardrails.goto();
    await guardrails.openNewRuleForm();
  });

  test('UM-01 — single keyword is accepted and saved', async () => {
    await guardrails.fillRuleName('UM-01 single keyword');
    await guardrails.addUserMessageWords('refund');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
  });

  test('UM-06 — bulk-paste of a comma-separated word list is accepted', async () => {
    await guardrails.fillRuleName('UM-06 bulk word list');
    await guardrails.addUserMessageWords('refund, chargeback, dispute, cancel subscription');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
  });

  test('UM-08 — empty word list does not block saving a rule using only other fields', async () => {
    await guardrails.fillRuleName('UM-08 empty word list');
    await guardrails.fillSubject('Billing question');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
  });

  // UM-03 (word-boundary correctness) and UM-04/05 (case-insensitivity, punctuation) require
  // firing a real message through the matching engine — see matching-logic.spec.ts.
});
