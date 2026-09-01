import { test, expect } from '@playwright/test';
import { GuardrailsPage } from './pages/GuardrailsPage';

// Covers TEST_PLAN.md section 3 — Composite / Cross-Field test cases,
// plus core CRUD (create/edit/disable/delete) from section 1's "Functional (CRUD)" suite.

test.describe('Guardrail rule — composite fields & CRUD', () => {
  let guardrails: GuardrailsPage;

  test.beforeEach(async ({ page }) => {
    guardrails = new GuardrailsPage(page);
    await guardrails.goto();
  });

  test('C-COMPOSITE-02 — a rule with all four fields populates and saves together', async () => {
    await guardrails.openNewRuleForm();
    await guardrails.fillRuleName('C-COMPOSITE-02 all fields');
    await guardrails.addEmailPattern('*@notch.dev');
    await guardrails.fillSubject('Refund request');
    await guardrails.addUserMessageWords('refund');
    await guardrails.addAssistantReplyWords('approved');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
  });

  test('C-COMPOSITE-07 — saving a rule with every field empty is rejected', async () => {
    await guardrails.openNewRuleForm();
    await guardrails.fillRuleName('C-COMPOSITE-07 all empty');
    await guardrails.save();
    await guardrails.expectValidationError('at least one');
  });

  test('CRUD — a saved rule appears in the rule list', async () => {
    const ruleName = `CRUD list check ${Date.now()}`;
    await guardrails.openNewRuleForm();
    await guardrails.fillRuleName(ruleName);
    await guardrails.addEmailPattern('*@notch.dev');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();

    const row = await guardrails.ruleRowByName(ruleName);
    await expect(row).toBeVisible();
  });

  test('CRUD — deleting a rule removes it from the list', async () => {
    const ruleName = `CRUD delete check ${Date.now()}`;
    await guardrails.openNewRuleForm();
    await guardrails.fillRuleName(ruleName);
    await guardrails.addEmailPattern('*@notch.dev');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();

    await guardrails.deleteRuleByName(ruleName);
    const row = await guardrails.ruleRowByName(ruleName);
    await expect(row).toHaveCount(0);
  });

  test.describe('Matching-logic confirmation (requires live automation environment)', () => {
    test.skip(() => true, 'Needs a seeded automation + real message pipeline to fire against — not available from this sandbox.');

    test('C-COMPOSITE-01 — confirms whether cross-field logic is AND or OR', async () => {
      // Plan: create a rule with an email pattern AND a user-message word.
      // Send one automation matching only the email. Send another matching only the word.
      // Send a third matching both.
      // If only the third fires -> AND. If the first two also fire -> OR.
      // Assertions intentionally left unresolved until the AND/OR assumption in
      // TEST_PLAN.md section 0 is confirmed against the real product.
    });

    test('UM-03 — word boundary correctness ("cat" should not match "category")', async () => {
      // Plan: rule with user-message word "cat". Send message containing only "category".
      // Expect rule NOT to fire (assuming whole-word matching is intended behavior).
    });
  });
});
