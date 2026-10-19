/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import { Token } from '@lumino/coreutils';
import type { IDisposable } from '@lumino/disposable';
import { ISignal } from '@lumino/signaling';

import type {
  ISkillDefinition,
  ISkillRegistration,
  ISkillResourceResult,
  ISkillSummary
} from './skills';

/*
 * THE TOOL REGISTRY
 */
/**
 * The options a persona passes to a tool call.
 */
export interface IToolCallOptions {
  toolCallId: string;
  messages?: unknown[];
  abortSignal?: AbortSignal;
  context?: unknown;
}

/**
 * A tool a persona offers to a model: a description, the schema of its input
 * (a zod schema or an object with a `jsonSchema` field, see
 * `getToolInputSchema` and `parseToolInput`), the function that runs it and
 * optional metadata such as a title. The tools of the AI SDK have this shape,
 * so they register unchanged.
 */
export interface ITool<TInput = any, TOutput = unknown> {
  description?: string | ((options: { context: unknown }) => string);
  inputSchema: unknown;
  execute?(
    input: TInput,
    options: IToolCallOptions
  ): AsyncIterable<TOutput> | PromiseLike<TOutput> | TOutput;
  metadata?: Record<string, unknown>;
}

/**
 * A map containing tools.
 */
export type ToolMap = Record<string, ITool>;

/**
 * Interface for a named tool (tool with a name identifier)
 */
export interface INamedTool {
  /**
   * The unique name of the tool
   */
  name: string;
  /**
   * The tool instance
   */
  tool: ITool;
}

/**
 * The tool registry interface for managing AI tools
 */
export interface IToolRegistry {
  /**
   * The registered tools as a record (name -> tool mapping).
   */
  readonly tools: Record<string, ITool>;

  /**
   * The registered named tools array.
   */
  readonly namedTools: INamedTool[];

  /**
   * A signal triggered when the tools have changed.
   */
  readonly toolsChanged: ISignal<IToolRegistry, void>;

  /**
   * Add a new tool to the registry.
   */
  add(name: string, tool: ITool): void;

  /**
   * Get a tool for a given name.
   * Return null if the name is not provided or if there is no registered tool with the
   * given name.
   */
  get(name: string | null): ITool | null;

  /**
   * Remove a tool from the registry by name.
   */
  remove(name: string): boolean;
}

/**
 * The tool registry token.
 */
export const IToolRegistry = new Token<IToolRegistry>(
  '@jupyter-ai/agent-lite:IToolRegistry',
  'Tool registry for AI agent functionality'
);

/*
 * THE SKILL REGISTRY
 */

/**
 * Registry for skills available to the AI agent.
 */
export interface ISkillRegistry {
  /**
   * Signal emitted when skills change.
   */
  readonly skillsChanged: ISignal<ISkillRegistry, void>;

  /**
   * Register a single skill.
   */
  registerSkill(skill: ISkillRegistration): IDisposable;

  /**
   * List all skills with summary info, optionally filtered by a search query.
   */
  listSkills(query?: string): ISkillSummary[];

  /**
   * Get a full skill definition by name.
   */
  getSkill(name: string): ISkillDefinition | null;

  /**
   * Load a resource for a skill.
   */
  getSkillResource(
    name: string,
    resource: string
  ): Promise<ISkillResourceResult>;
}

/**
 * The skill registry token.
 */
export const ISkillRegistry = new Token<ISkillRegistry>(
  '@jupyter-ai/agent-lite:ISkillRegistry',
  'Skill registry for AI agent functionality'
);

/*
 * THE SETTINGS
 */

/**
 * The settings shared by the in-browser personas.
 */
export interface IAgentConfig {
  /**
   * The JupyterLab commands that need the approval of the user before a
   * persona runs them.
   */
  commandsRequiringApproval: string[];
  /**
   * The commands whose `execute_command` outputs may render MIME bundles in
   * the chat.
   */
  commandsAutoRenderMimeBundles: string[];
  /**
   * The MIME types marked as trusted when command outputs render in the chat.
   */
  trustedMimeTypesForAutoRender: string[];
  /**
   * The directories that hold agent skills, relative to the server root.
   */
  skillsPaths: string[];
}

/**
 * The settings model shared by the personas.
 */
export interface IAgentSettings {
  /**
   * The current settings, with the defaults applied.
   */
  readonly config: IAgentConfig;
  /**
   * A signal emitted when the settings change.
   */
  readonly changed: ISignal<IAgentSettings, void>;
  /**
   * A promise that resolves once the settings are loaded.
   */
  readonly ready: Promise<void>;
  /**
   * Save new values for some settings.
   */
  update(updates: Partial<IAgentConfig>): Promise<void>;
}

/**
 * The agent settings token.
 */
export const IAgentSettings = new Token<IAgentSettings>(
  '@jupyter-ai/agent-lite:IAgentSettings',
  'Settings shared by the in-browser personas'
);

/**
 * The id of the agent settings plugin, which is also the settings id.
 */
export const AGENT_SETTINGS_ID = '@jupyter-ai/agent-lite:settings';

/**
 * The commands of @jupyter-ai/agent-lite.
 */
export namespace CommandIds {
  export const refreshSkills = '@jupyter-ai/agent-lite:refresh-skills';
}
