import { test, expect } from '@playwright/test';
import { GuardrailsPage } from './pages/GuardrailsPage';

// Covers TEST_PLAN.md section 2.4 — Words in assistant's reply

test.describe('Guardrail rule — Words in assistant\'s reply field', () => {
  let guardrails: GuardrailsPage;

  test.beforeEach(async ({ page }) => {
    guardrails = new GuardrailsPage(page);
    await guardrails.goto();
    await guardrails.openNewRuleForm();
  });

  test('AR-01 — single keyword is accepted and saved', async () => {
    await guardrails.fillRuleName('AR-01 single keyword');
    await guardrails.addAssistantReplyWords('guaranteed');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
  });

  test('AR-08 — empty word list does not block saving a rule using only other fields', async () => {
    await guardrails.fillRuleName('AR-08 empty word list');
    await guardrails.fillSubject('Support ticket');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
  });

  test('AR/UM independence — a word set only on the reply field does not require a user-message match', async () => {
    // Guards against a bug where the two word-list fields get merged into one condition.
    await guardrails.fillRuleName('Independence check reply-only');
    await guardrails.addAssistantReplyWords('guaranteed refund');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
    // Confirming actual independent firing (UM-10 / AR-10) needs a live automation run —
    // see matching-logic.spec.ts.
  });
});
