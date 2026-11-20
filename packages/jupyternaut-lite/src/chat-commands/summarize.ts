/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import { ChatCommand, IChatCommandProvider, IInputModel } from '@jupyter/chat';

import { DEFAULT_PERSONA } from '../tokens';

export class SummarizeCommandProvider implements IChatCommandProvider {
  constructor(options: SummarizeCommandProvider.IOptions) {
    this._isDefault = options.isDefault;
    this._summarize = options.summarize;
  }

  public id: string = '@jupyter-ai/jupyternaut-lite:summarize';

  async listCommandCompletions(
    inputModel: IInputModel
  ): Promise<ChatCommand[]> {
    if (!this._isActive(inputModel)) {
      return [];
    }

    const match = inputModel.currentWord?.match(this._regex)?.[0];
    if (!match) {
      return [];
    }

    if (this._command.name.startsWith(match)) {
      return [this._command];
    }

    return [];
  }

  async onSubmit(inputModel: IInputModel): Promise<void> {
    if (!this._isActive(inputModel)) {
      return;
    }

    const trimmed = inputModel.value.trim();
    if (trimmed !== this._command.name) {
      return;
    }

    const chatName = inputModel.chatContext?.name;
    if (!chatName) {
      return;
    }

    this._summarize(chatName);

    inputModel.value = '';
    inputModel.clearAttachments();
    inputModel.clearMentions();
  }

  private _isActive(inputModel: IInputModel): boolean {
    const metaPersonaId = (inputModel.getMetadata() as any).to_persona;
    const chatName = inputModel.chatContext?.name;
    return (
      metaPersonaId === DEFAULT_PERSONA.username ||
      (!!chatName && this._isDefault(chatName))
    );
  }

  private _command: ChatCommand = {
    name: '/summarize',
    providerId: this.id,
    description: 'Summarize the conversation history'
  };

  private _regex: RegExp = /^\/\w*$/;
  private _isDefault: (chatName: string) => boolean;
  private _summarize: (chatName: string) => Promise<void>;
}

export namespace SummarizeCommandProvider {
  export interface IOptions {
    isDefault: (chatName: string) => boolean;
    summarize: (chatName: string) => Promise<void>;
  }
}
