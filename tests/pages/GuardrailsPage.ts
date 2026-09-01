import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for /config/guardrails — Automation Audit rule builder.
 *
 * IMPORTANT: I don't have access to the real staging environment, so every selector
 * below is a placeholder guess at what a data-testid convention would look like.
 * Each is flagged `// ASSUMED SELECTOR`. Once you share the real markup (or I get
 * access), swap these one-for-one and every spec file keeps working unchanged —
 * that's the point of isolating them here instead of inlining selectors in tests.
 */
export class GuardrailsPage {
  readonly page: Page;

  // --- Navigation / list view ---
  readonly newRuleButton: Locator;
  readonly ruleRows: Locator;

  // --- Rule form fields ---
  readonly ruleNameInput: Locator;
  readonly emailPatternInput: Locator;
  readonly addEmailPatternButton: Locator;
  readonly subjectInput: Locator;
  readonly userMessageWordsInput: Locator;
  readonly assistantReplyWordsInput: Locator;
  readonly enabledToggle: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly confirmDeleteButton: Locator;

  // --- Feedback ---
  readonly validationError: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;

    this.newRuleButton = page.getByTestId('guardrail-new-rule-button'); // ASSUMED SELECTOR
    this.ruleRows = page.getByTestId('guardrail-rule-row'); // ASSUMED SELECTOR

    this.ruleNameInput = page.getByTestId('guardrail-rule-name-input'); // ASSUMED SELECTOR
    this.emailPatternInput = page.getByTestId('guardrail-email-pattern-input'); // ASSUMED SELECTOR
    this.addEmailPatternButton = page.getByTestId('guardrail-add-email-pattern'); // ASSUMED SELECTOR
    this.subjectInput = page.getByTestId('guardrail-subject-input'); // ASSUMED SELECTOR
    this.userMessageWordsInput = page.getByTestId('guardrail-user-message-words-input'); // ASSUMED SELECTOR
    this.assistantReplyWordsInput = page.getByTestId('guardrail-assistant-reply-words-input'); // ASSUMED SELECTOR
    this.enabledToggle = page.getByTestId('guardrail-enabled-toggle'); // ASSUMED SELECTOR
    this.saveButton = page.getByTestId('guardrail-save-button'); // ASSUMED SELECTOR
    this.deleteButton = page.getByTestId('guardrail-delete-button'); // ASSUMED SELECTOR
    this.confirmDeleteButton = page.getByTestId('guardrail-confirm-delete-button'); // ASSUMED SELECTOR

    this.validationError = page.getByTestId('guardrail-validation-error'); // ASSUMED SELECTOR
    this.successToast = page.getByTestId('toast-success'); // ASSUMED SELECTOR
  }

  async goto() {
    await this.page.goto('/config/guardrails');
  }

  async openNewRuleForm() {
    await this.newRuleButton.click();
  }

  async fillRuleName(name: string) {
    await this.ruleNameInput.fill(name);
  }

  async addEmailPattern(pattern: string) {
    await this.emailPatternInput.fill(pattern);
    await this.addEmailPatternButton.click();
  }

  async fillSubject(subject: string) {
    await this.subjectInput.fill(subject);
  }

  async addUserMessageWords(csv: string) {
    // Assumed UI accepts comma-separated bulk entry — adjust if it's one-word-at-a-time chips.
    await this.userMessageWordsInput.fill(csv);
  }

  async addAssistantReplyWords(csv: string) {
    await this.assistantReplyWordsInput.fill(csv);
  }

  async save() {
    await this.saveButton.click();
  }

  async expectValidationError(messageSubstring: string) {
    await expect(this.validationError).toBeVisible();
    await expect(this.validationError).toContainText(messageSubstring);
  }

  async expectSaveSucceeded() {
    await expect(this.successToast).toBeVisible();
  }

  async ruleRowByName(name: string): Promise<Locator> {
    return this.ruleRows.filter({ hasText: name });
  }

  async deleteRuleByName(name: string) {
    const row = await this.ruleRowByName(name);
    await row.getByTestId('guardrail-delete-button').click(); // ASSUMED SELECTOR
    await this.confirmDeleteButton.click();
  }
}
