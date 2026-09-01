import { test, expect } from '@playwright/test';
import { GuardrailsPage } from './pages/GuardrailsPage';

// Covers TEST_PLAN.md section 2.2 — Subject

test.describe('Guardrail rule — Subject field', () => {
  let guardrails: GuardrailsPage;

  test.beforeEach(async ({ page }) => {
    guardrails = new GuardrailsPage(page);
    await guardrails.goto();
    await guardrails.openNewRuleForm();
  });

  test('SU-01 — exact subject string is accepted and saved', async () => {
    await guardrails.fillRuleName('SU-01 exact subject');
    await guardrails.fillSubject('Password reset request');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
  });

  test('SU-04 — special characters (unicode, emoji) in subject are accepted', async () => {
    await guardrails.fillRuleName('SU-04 unicode subject');
    await guardrails.fillSubject('Réinitialisation du mot de passe 🔒');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
  });

  test('SU-05 — empty subject field does not block saving a rule using only other fields', async () => {
    await guardrails.fillRuleName('SU-05 empty subject');
    await guardrails.addEmailPattern('*@notch.dev');
    await guardrails.save();
    await guardrails.expectSaveSucceeded();
  });
});
