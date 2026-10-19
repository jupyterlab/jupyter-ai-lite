/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ISignal, Signal } from '@lumino/signaling';

import { IAgentConfig, IAgentSettings, AGENT_SETTINGS_ID } from './tokens';

/**
 * The settings shared by the personas, backed by the JupyterLab setting registry.
 */
export class AgentSettings implements IAgentSettings {
  constructor(options: AgentSettings.IOptions) {
    this._registry = options.settingRegistry;
    this.ready = this._load();
  }

  readonly ready: Promise<void>;

  get config(): IAgentConfig {
    return { ...this._config };
  }

  get changed(): ISignal<IAgentSettings, void> {
    return this._changed;
  }

  async update(updates: Partial<IAgentConfig>): Promise<void> {
    await this.ready;
    if (!this._settings) {
      this._config = { ...this._config, ...updates };
      this._changed.emit();
      return;
    }
    for (const [key, value] of Object.entries(updates)) {
      await this._settings.set(key, value);
    }
  }

  private async _load(): Promise<void> {
    try {
      this._settings = await this._registry.load(AGENT_SETTINGS_ID);
    } catch (error) {
      console.warn('Failed to load the agent settings:', error);
      return;
    }
    this._read();
    this._settings.changed.connect(this._read, this);
  }

  private _read(): void {
    this._config = {
      ...this._config,
      ...(this._settings?.composite as Partial<IAgentConfig>)
    };
    this._changed.emit();
  }

  private _config: IAgentConfig = {
    commandsRequiringApproval: [
      'notebook:restart-run-all',
      'notebook:run-cell',
      'notebook:run-cell-and-select-next',
      'notebook:run-cell-and-insert-below',
      'notebook:run-all-cells',
      'notebook:run-all-above',
      'notebook:run-all-below',
      'console:execute',
      'console:execute-forced',
      'fileeditor:run-code',
      'kernelmenu:run',
      'kernelmenu:restart-and-run-all',
      'runmenu:run-all',
      'jupyterlab-ai-commands:run-cell'
    ],
    commandsAutoRenderMimeBundles: ['jupyterlab-ai-commands:execute-in-kernel'],
    trustedMimeTypesForAutoRender: ['text/html'],
    skillsPaths: ['.agents/skills', '_agents/skills']
  };
  private _registry: ISettingRegistry;
  private _settings: ISettingRegistry.ISettings | null = null;
  private _changed = new Signal<IAgentSettings, void>(this);
}

export namespace AgentSettings {
  export interface IOptions {
    settingRegistry: ISettingRegistry;
  }
}
