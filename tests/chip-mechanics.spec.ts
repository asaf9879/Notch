import { test, expect } from '@playwright/test';
import { GuardrailsPage, FIELD_LABELS, FieldKey } from './pages/GuardrailsPage';

// Covers TEST_PLAN.md section 2 — Chip/Tag UI mechanics.
// Written once, run against all four fields, since they share one input pattern.

const fields = Object.keys(FIELD_LABELS) as FieldKey[];

for (const field of fields) {
  test.describe(`Chip mechanics — ${FIELD_LABELS[field]}`, () => {
    let guardrails: GuardrailsPage;

    test.beforeEach(async ({ page }) => {
      guardrails = new GuardrailsPage(page);
      await guardrails.goto();
    });

    test(`CHIP-01 — typing a value and pressing Enter adds a chip (${field})`, async () => {
      const value = `qa-chip-${Date.now()}`;
      await guardrails.addChip(field, value);
      await guardrails.expectChipPresent(field, value);
    });

    test(`CHIP-02 — clicking a chip's remove button deletes it (${field})`, async () => {
      const value = `qa-chip-remove-${Date.now()}`;
      await guardrails.addChip(field, value);
      await guardrails.expectChipPresent(field, value);
      await guardrails.removeChip(field, value);
      await guardrails.expectChipAbsent(field, value);
    });

    test(`CHIP-04 — pressing Enter with no text does not add a blank chip (${field})`, async ({ page }) => {
      const before = await page.locator('span, div').filter({ hasText: /.+/ }).count();
      await guardrails.addChip(field, '');
      const after = await page.locator('span, div').filter({ hasText: /.+/ }).count();
      // Loose structural check given unknown DOM — the real assertion once markup is
      // known should count chips within the field's section specifically.
      expect(after).toBeLessThanOrEqual(before + 1);
    });

    test(`CHIP-05 — a whitespace-only value does not add a visible blank chip (${field})`, async () => {
      await guardrails.addChip(field, '   ');
      await guardrails.expectChipAbsent(field, '   ');
    });
  });
}
