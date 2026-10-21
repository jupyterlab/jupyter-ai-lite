/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import { expect, galata, test } from '@jupyterlab/galata';
import { DEFAULT_GENERIC_PROVIDER_SETTINGS, openChatPanel } from './test-utils';

const REGISTRY_PLUGIN_ID = '@jupyter-ai/jupyternaut-lite:registry';
const TEST_CHAT_NAME = 'summarize-test';
const TEST_CHAT_FILE = `${TEST_CHAT_NAME}.chat`;

async function getAgentHistory(page: any): Promise<unknown[]> {
  return page.evaluate((pluginId: string) => {
    const registry = (window as any).jupyterapp.pluginRegistry._plugins.get(
      pluginId
    ).service;
    // There should be only one chat and one persona available.
    const persona = registry._personas.values().next().value;
    return persona?.agentManager.getHistory() ?? [];
  }, REGISTRY_PLUGIN_ID);
}

test.use({
  mockSettings: {
    ...galata.DEFAULT_SETTINGS,
    ...DEFAULT_GENERIC_PROVIDER_SETTINGS,
    '@jupyterlab/apputils-extension:notification': {
      checkForUpdates: false,
      fetchNews: 'false',
      doNotDisturbMode: true
    }
  }
});

test.describe('#summarizeCommand', () => {
  test.beforeEach(async ({ page }) => {
    await openChatPanel(page, TEST_CHAT_NAME);
  });

  test.afterEach(async ({ page }) => {
    if (await page.contents.fileExists(TEST_CHAT_FILE)) {
      await page.contents.deleteFile(TEST_CHAT_FILE);
    }
  });

  test('should suggest /summarize when typing /sum', async ({ page }) => {
    const panel = await openChatPanel(page);
    const input = panel
      .locator('.jp-chat-input-container')
      .getByRole('combobox');

    await input.pressSequentially('/sum');

    await expect(page.getByText('/summarize', { exact: true })).toBeVisible();
  });

  test('should summarize the conversation with /summarize', async ({
    page
  }) => {
    test.setTimeout(240 * 1000);

    const panel = await openChatPanel(page);
    const input = panel
      .locator('.jp-chat-input-container')
      .getByRole('combobox');
    const sendButton = panel.locator(
      '.jp-chat-input-container .jp-chat-send-button'
    );
    const messages = panel.locator('.jp-chat-message');

    // Send a message and wait for the AI reply.
    await input.pressSequentially('Hello, this is a test conversation.');
    await sendButton.click();
    await expect(
      panel.locator('.jp-chat-message-header:has-text("Jupyternaut")')
    ).toHaveCount(1, { timeout: 60000 });

    // Wait for the writing indicator to disappear (response complete).
    await expect(panel.locator('.jp-chat-writers > *')).toHaveCSS(
      'visibility',
      'hidden',
      { timeout: 60000 }
    );

    const historyBeforeSummarize = await getAgentHistory(page);
    expect(historyBeforeSummarize.length).toBeGreaterThanOrEqual(2);

    // Run the /summarize command.
    await input.pressSequentially('/summarize');
    await sendButton.click();

    // A new message containing the summary header should appear.
    await expect(
      panel.locator(
        '.jp-chat-rendered-message:has-text("Conversation summary")'
      )
    ).toBeVisible({ timeout: 60000 });

    // After summarizing, the agent history should be collapsed to a single
    // assistant message containing the summary.
    const historyAfterSummarize = await getAgentHistory(page);
    expect(historyAfterSummarize).toHaveLength(1);
    expect((historyAfterSummarize[0] as any).role).toBe('assistant');

    const countBeforeSummarize = historyBeforeSummarize.length;
    expect(messages).toHaveCount(countBeforeSummarize + 1);
  });

  test('should show writing indicator while summarizing', async ({ page }) => {
    test.setTimeout(240 * 1000);

    const panel = await openChatPanel(page);
    const input = panel
      .locator('.jp-chat-input-container')
      .getByRole('combobox');
    const sendButton = panel.locator(
      '.jp-chat-input-container .jp-chat-send-button'
    );
    const writingIndicator = panel.locator('.jp-chat-writers > *');

    // Send a message and wait for the AI reply.
    await input.pressSequentially('Hello');
    await sendButton.click();
    await expect(
      panel.locator('.jp-chat-message-header:has-text("Jupyternaut")')
    ).toHaveCount(1, { timeout: 60000 });
    await expect(writingIndicator).toHaveCSS('visibility', 'hidden', {
      timeout: 60000
    });

    // Submit /summarize — the writing indicator should become visible while the
    // summary is being generated.
    await input.pressSequentially('/summarize');
    await sendButton.click();

    await expect(writingIndicator).toHaveCSS('visibility', 'visible', {
      timeout: 30000
    });

    // After the summary message appears the indicator should be hidden again.
    await expect(
      panel.locator(
        '.jp-chat-rendered-message:has-text("Conversation summary")'
      )
    ).toBeVisible({ timeout: 60000 });
    await expect(writingIndicator).toHaveCSS('visibility', 'hidden', {
      timeout: 30000
    });
  });

  test('should restore history to the summary when reopening after reload', async ({
    page
  }) => {
    test.setTimeout(360 * 1000);

    const panel = await openChatPanel(page);
    const input = panel
      .locator('.jp-chat-input-container')
      .getByRole('combobox');
    const sendButton = panel.locator(
      '.jp-chat-input-container .jp-chat-send-button'
    );

    // Send a message and wait for the AI reply.
    await input.pressSequentially('Hello, this is a test conversation.');
    await sendButton.click();
    await expect(
      panel.locator('.jp-chat-message-header:has-text("Jupyternaut")')
    ).toHaveCount(1, { timeout: 60000 });
    await expect(panel.locator('.jp-chat-writers > *')).toHaveCSS(
      'visibility',
      'hidden',
      { timeout: 60000 }
    );

    // Run /summarize and wait for the summary to appear.
    await input.pressSequentially('/summarize');
    await sendButton.click();
    await expect(
      panel.locator(
        '.jp-chat-rendered-message:has-text("Conversation summary")'
      )
    ).toBeVisible({ timeout: 60000 });

    // Reload the page to simulate closing and reopening the application.
    await page.reload();

    // Reopen the same chat file — this triggers a fresh _rebuildHistory() call
    // from the file contents, exercising the full load path.
    const reopenedPanel = await openChatPanel(page, TEST_CHAT_NAME);

    // Wait for the summary message to be visible, confirming the file loaded.
    await expect(
      reopenedPanel.locator(
        '.jp-chat-rendered-message:has-text("Conversation summary")'
      )
    ).toBeVisible({ timeout: 60000 });

    // History must collapse to a single assistant message (the summary).
    const historyAfterReload = await getAgentHistory(page);
    expect(historyAfterReload).toHaveLength(1);
    expect((historyAfterReload[0] as any).role).toBe('assistant');
  });

  test('should clear input after /summarize is submitted', async ({ page }) => {
    test.setTimeout(120 * 1000);

    const panel = await openChatPanel(page);
    const input = panel
      .locator('.jp-chat-input-container')
      .getByRole('combobox');
    const sendButton = panel.locator(
      '.jp-chat-input-container .jp-chat-send-button'
    );

    // Send a message and wait for the AI reply so there is history to summarize.
    await input.pressSequentially('Hello');
    await sendButton.click();
    await expect(
      panel.locator('.jp-chat-message-header:has-text("Jupyternaut")')
    ).toHaveCount(1, { timeout: 60000 });
    await expect(panel.locator('.jp-chat-writers > *')).toHaveCSS(
      'visibility',
      'hidden',
      { timeout: 60000 }
    );

    await input.pressSequentially('/summarize');
    await sendButton.click();

    // Wait for the summary to appear, then check the input is cleared.
    await expect(
      panel.locator(
        '.jp-chat-rendered-message:has-text("Conversation summary")'
      )
    ).toBeVisible({ timeout: 60000 });

    await expect(input).toHaveValue('');
  });
});
