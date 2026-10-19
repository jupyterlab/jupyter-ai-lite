/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

// Public API of @jupyter-ai/agent-lite

import plugins from './plugins';

export {
  CommandIds,
  IAgentSettings,
  ISkillRegistry,
  IToolRegistry,
  AGENT_SETTINGS_ID
} from './tokens';
export type {
  INamedTool,
  IAgentConfig,
  ITool,
  IToolCallOptions,
  ToolMap
} from './tokens';
export { getAppAttribution } from './app-attribution';
export { forwardAuthCode, requestApiKey } from './oauth/openrouter';
export { ToolRegistry } from './tools/tool-registry';
export {
  createDiscoverCommandsTool,
  createExecuteCommandTool
} from './tools/commands';
export { createDiscoverSkillsTool, createLoadSkillTool } from './tools/skills';
export { extractMimeBundles } from './tools/mime-bundles';
export { getToolInputSchema, parseToolInput } from './tools/tool-input';
export { createBrowserFetchTool } from './tools/web';
export {
  loadSkillsFromPaths,
  SkillRegistry,
  type ISkillDefinition,
  type ISkillRegistration,
  type ISkillResourceResult,
  type ISkillSummary
} from './skills';

export default plugins;
