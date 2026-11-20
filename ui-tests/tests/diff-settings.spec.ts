/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import {
  expect,
  galata,
  IJupyterLabPageFixture,
  test
} from '@jupyterlab/galata';
import { Locator } from '@playwright/test';

import {
  DEFAULT_GENERIC_PROVIDER_SETTINGS,
  openChatPanel,
  openSettings
} from './test-utils';

const TEST_CHAT_NAME = 'diff-settings-test';
const TEST_CHAT_FILE = `${TEST_CHAT_NAME}.chat`;
const NOTEBOOK = 'diff-settings.ipynb';
const CHAT_URL = 'http://localhost:11434/v1/chat/completions';
const MODEL_REPLY = 'The cell is updated.';
const SPLIT_DIFF = '.jp-SplitDiffView';
const UNIFIED_DIFF = '.cm-deletedChunk';
const DIFF_MODE = 'Diff Display Mode';

test.use({
  mockSettings: {
    ...galata.DEFAULT_SETTINGS,
    ...DEFAULT_GENERIC_PROVIDER_SETTINGS,
    '@jupyterlab/apputils-extension:notification': {
      checkForUpdates: false,
      fetchNews: 'false',
      doNotDisturbMode: true
    },
    '@jupyter-ai/jupyternaut-lite:settings-model': {
      ...DEFAULT_GENERIC_PROVIDER_SETTINGS[
        '@jupyter-ai/jupyternaut-lite:settings-model'
      ],
      toolsEnabled: true
    }
  }
});

/**
 * Reply to the chat requests in place of the model: set the content of the
 * active cell with the given diff arguments, then end the turn.
 */
async function mockModel(
  page: IJupyterLabPageFixture,
  diffArgs: { showDiff: boolean; diffMode: 'split' | 'unified' }
): Promise<void> {
  const chunk = (delta: object, finishReason: string | null) =>
    `data: ${JSON.stringify({
      id: 'chatcmpl-test',
      object: 'chat.completion.chunk',
      created: 0,
      model: 'test',
      choices: [{ index: 0, delta, finish_reason: finishReason }]
    })}\n\n`;
  const toolCall = {
    index: 0,
    id: 'call_test',
    type: 'function',
    function: {
      name: 'execute_command',
      arguments: JSON.stringify({
        commandId: 'jupyterlab-ai-commands:set-cell-content',
        args: { content: 'a = 2', ...diffArgs }
      })
    }
  };
  await page.route(CHAT_URL, route => {
    const { messages } = route.request().postDataJSON();
    const toolCalled = messages.some(
      (message: { role: string }) => message.role === 'tool'
    );
    return route.fulfill({
      contentType: 'text/event-stream',
      body: toolCalled
        ? chunk({ content: MODEL_REPLY }, null) +
          chunk({}, 'stop') +
          'data: [DONE]\n\n'
        : chunk({ tool_calls: [toolCall] }, null) +
          chunk({}, 'tool_calls') +
          'data: [DONE]\n\n'
    });
  });
}

/**
 * Open the Behavior tab of the settings panel.
 */
async function openBehaviorSettings(
  page: IJupyterLabPageFixture
): Promise<Locator> {
  const settings = await openSettings(page);
  await settings.getByRole('tab', { name: 'Behavior' }).click();
  return settings;
}

/**
 * Ask the model to change the cell, and wait for the end of its turn.
 */
async function changeCell(page: IJupyterLabPageFixture): Promise<void> {
  await page.notebook.activate(NOTEBOOK);
  const panel = await openChatPanel(page, TEST_CHAT_NAME);
  await panel
    .locator('.jp-chat-input-container')
    .getByRole('combobox')
    .pressSequentially('Change the cell');
  await panel.locator('.jp-chat-input-container .jp-chat-send-button').click();
  await expect(panel.getByText(MODEL_REPLY)).toBeVisible();
}

test.describe('#diffSettings', () => {
  test.beforeEach(async ({ page }) => {
    await page.notebook.createNew(NOTEBOOK);
    await page.notebook.setCell(0, 'code', 'a = 1');
  });

  test.afterEach(async ({ page }) => {
    if (await page.contents.fileExists(TEST_CHAT_FILE)) {
      await page.contents.deleteFile(TEST_CHAT_FILE);
    }
  });

  test('should show a unified cell diff by default', async ({ page }) => {
    await mockModel(page, { showDiff: true, diffMode: 'split' });

    const settings = await openBehaviorSettings(page);
    await expect(
      settings.getByRole('switch', { name: 'Show Cell Diff' })
    ).toBeChecked();
    await expect(
      settings.getByRole('switch', { name: 'Show File Diff' })
    ).toBeChecked();
    await expect(
      settings.getByRole('combobox', { name: DIFF_MODE })
    ).toHaveText('Unified View');

    await changeCell(page);

    const notebook = await page.notebook.getNotebookInPanelLocator();
    await expect(notebook!.locator(UNIFIED_DIFF)).toBeVisible();
    await expect(notebook!.locator(SPLIT_DIFF)).toHaveCount(0);
  });

  test('should show a split cell diff when selected in the settings', async ({
    page
  }) => {
    await mockModel(page, { showDiff: true, diffMode: 'unified' });

    const settings = await openBehaviorSettings(page);
    const mode = settings.getByRole('combobox', { name: DIFF_MODE });
    await mode.click();
    await page.getByRole('option', { name: 'Split View' }).click();
    await expect(mode).toHaveText('Split View');

    await changeCell(page);

    const notebook = await page.notebook.getNotebookInPanelLocator();
    await expect(notebook!.locator(SPLIT_DIFF)).toBeVisible();
    await expect(notebook!.locator(UNIFIED_DIFF)).toHaveCount(0);
  });

  test('should not show a cell diff when disabled in the settings', async ({
    page
  }) => {
    await mockModel(page, { showDiff: true, diffMode: 'split' });

    const settings = await openBehaviorSettings(page);
    await settings.getByRole('switch', { name: 'Show Cell Diff' }).click();
    await expect(
      settings.getByRole('combobox', { name: DIFF_MODE })
    ).toHaveCount(0);

    await changeCell(page);

    expect(await page.notebook.getCellTextInput(0)).toBe('a = 2');
    const notebook = await page.notebook.getNotebookInPanelLocator();
    await expect(notebook!.locator(SPLIT_DIFF)).toHaveCount(0);
    await expect(notebook!.locator(UNIFIED_DIFF)).toHaveCount(0);
  });
});
