import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Config > Automation > Guardrails > Automation Audit
 * (https://guardio.app.getnotch.dev/config/guardrails?version=...)
 *
 * Grounded in a real screenshot of the page (see TEST_PLAN.md section 0), so field
 * labels, the Deploy button text, and the confirmed placeholder ("Add a word (e.g.,
 * 'paperwork') and press Enter") are exact, not guessed.
 *
 * What's still a guess: the DOM *nesting* — which element wraps a field's heading,
 * chip list, and input together. A screenshot shows layout, not markup, so
 * `.filter({ hasText })` is used as a best-effort way to scope to the right section.
 * This is flagged `// ASSUMED DOM STRUCTURE` — swap for a real container selector
 * (ideally a data-testid the product could add per field) once available.
 */
export const FIELD_LABELS = {
  emailPatterns: 'Emails patterns to unassign',
  subjects: 'Subjects',
  userMessageWords: 'Words in User Message',
  assistantReplyWords: "Words in Assistant's Reply",
} as const;

export type FieldKey = keyof typeof FIELD_LABELS;

export class GuardrailsPage {
  readonly page: Page;
  readonly deployButton: Locator;
  readonly draftBadge: Locator;
  readonly versionMenuButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.deployButton = page.getByRole('button', { name: 'Deploy' });
    this.draftBadge = page.getByText('Draft', { exact: true });
    this.versionMenuButton = page.getByRole('button', { name: '⋮' }); // ASSUMED SELECTOR — accessible name of the "..." menu is unconfirmed
  }

  async goto(version?: string) {
    const url = version ? `/config/guardrails?version=${version}` : '/config/guardrails';
    await this.page.goto(url);
  }

  /**
   * Locates the card/section for a given field by its heading text.
   * ASSUMED DOM STRUCTURE: assumes each field's heading, description, chip list and
   * input all live inside one common ancestor block that `hasText` filtering can find.
   * If the real layout nests things differently this is the one place to fix it.
   */
  private section(field: FieldKey): Locator {
    const label = FIELD_LABELS[field];
    return this.page.locator('div').filter({ hasText: label }).last();
  }

  private input(field: FieldKey): Locator {
    // Confirmed placeholder pattern from the "Words in Assistant's Reply" field in the
    // screenshot: "Add a word (e.g., 'paperwork') and press Enter". Other fields'
    // placeholders weren't visible (their inputs were below existing chips, out of
    // frame) so this regex is deliberately loose to match all four once implemented.
    return this.section(field).getByPlaceholder(/press Enter/i);
  }

  async addChip(field: FieldKey, value: string) {
    const input = this.input(field);
    await input.fill(value);
    await input.press('Enter');
  }

  async removeChip(field: FieldKey, value: string) {
    const chip = this.section(field).getByText(value, { exact: true });
    // ASSUMED SELECTOR: the remove "x" is assumed to be the next sibling element of
    // the chip's text node. Confirm against real markup.
    await chip.locator('xpath=following-sibling::*[1]').click();
  }

  async expectChipPresent(field: FieldKey, value: string) {
    await expect(this.section(field).getByText(value, { exact: true })).toBeVisible();
  }

  async expectChipAbsent(field: FieldKey, value: string) {
    await expect(this.section(field).getByText(value, { exact: true })).toHaveCount(0);
  }

  async deploy() {
    await this.deployButton.click();
  }
}
