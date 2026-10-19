# Migration Guide

This guide provides an overview of major (potentially breaking) changes and the steps to
follow to update Jupyter AI Lite from one version to another.

## `v0.20.0` to `v0.21.0`

```{warning}
Jupyter AI Lite 0.21.0 renames all the packages, moves the chat to `jupyterlab-chat` and
changes the settings ids. Please read the following sections carefully to check if you
are impacted by these changes.
```

### Packages

The packages are renamed, under the `@jupyter-ai` scope on npm. The `@jupyternaut/agent`
library is split into a kit to build in-browser personas and the Jupyternaut persona
([#393](https://github.com/jupyterlite/ai/pull/393)):

| Before                                                     | After                                                                                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `jupyterlite-ai` (PyPI)                                    | `jupyter-ai-lite` (PyPI)                                                                                                           |
| `jupyternaut-persona` (PyPI), `@jupyternaut/persona` (npm) | `jupyternaut` (PyPI), `@jupyter-ai/jupyternaut` (npm)                                                                              |
| `@jupyternaut/agent` (npm)                                 | `jupyter-ai-persona-kit` (PyPI), `@jupyter-ai/persona-kit` (npm), and `@jupyter-ai/jupyternaut` for the AI SDK agent and providers |

`jupyter-ai-lite` is a meta package: it installs `jupyternaut`, which installs
`jupyter-ai-persona-kit`.

`pip` does not remove the old packages when you install the new ones. If the old and the
new extensions load together, the API keys stay locked in the secrets manager. Remove the
old packages first:

```bash
pip uninstall jupyterlite-ai jupyternaut-persona
pip install jupyter-ai-lite
```

If you have `jupyter-ai-jupyternaut` (the Jupyternaut persona that runs on the server),
remove it before the install: the two packages install the same labextension folder,
`@jupyter-ai/jupyternaut`.

### Chat

The `@jupyterlite/ai` extension and its chat are removed
([#387](https://github.com/jupyterlite/ai/pull/387)). Jupyternaut now answers in the
chats of [jupyterlab-chat](https://github.com/jupyterlab/jupyter-chat), and the persona
and the model are selected with the persona manager of Jupyter AI
(`jupyter-ai-persona-manager`), in JupyterLab and in JupyterLite alike. The user
experience is the same as with [Jupyter AI](https://github.com/jupyterlab/jupyter-ai) on
a server.

Changes in the interface:

- The persona and the model are selected in the input toolbar of the chat. The token
  usage and the context usage are shown there too.
- The chats are `.chat` files, saved when a message is added: the save and restore
  buttons are removed.
- The tools menu of the chat toolbar is removed. The tools are enabled or disabled in the
  Jupyternaut settings, from the **Settings** menu (**Jupyternaut Settings**) or the
  command palette.
- The settings button of the chat side panel is removed: open the settings from the
  **Settings** menu.

The chat settings of `@jupyterlite/ai:chat` (`sendWithShiftEnter`, `autoTitle`,
`showTokenUsage`, `showContextUsage`, `chatBackupDirectory`, `toolbar`) are removed. The
settings of jupyterlab-chat apply instead (`jupyterlab-chat-extension:factory`, **Chat**
in the settings editor), for example `sendWithShiftEnter`.

### Settings

The settings ids change, and the settings are not migrated: enter the providers, the
model choice and the settings of the Behavior tab again. The API keys stored in the
secrets manager are kept. With the secrets manager disabled, the API keys stored in the
settings must be entered again.

| Settings of `@jupyternaut/persona:settings-model`                                                                                                                              | New id                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `providers`, `defaultProvider`, `activeCompleterProvider`, `useSameProviderForChatAndCompleter`, `systemPrompt`, `completionSystemPrompt`, `toolsEnabled`, `useSecretsManager` | `@jupyter-ai/jupyternaut:settings-model`                                  |
| `commandsRequiringApproval`, `commandsAutoRenderMimeBundles`, `trustedMimeTypesForAutoRender`, `skillsPaths`                                                                   | `@jupyter-ai/persona-kit:settings`, shared by all the in-browser personas |
| `codeExecution`, `contextAwareness`, `diffDisplayMode`, `showCellDiff`, `showFileDiff`                                                                                         | Removed (unused)                                                          |

The identifier of the inline completion provider changes from
`@jupyternaut/persona:completer` to `@jupyter-ai/jupyternaut:completer`. If you
configured it in the `@jupyterlab/completer-extension:inline-completer` settings, update
the identifier:

```diff
{
  "providers": {
-   "@jupyternaut/persona:completer": {
+   "@jupyter-ai/jupyternaut:completer": {
      "enabled": true,
      "timeout": 5000
    }
  }
}
```

### Plugin IDs

The plugins of `@jupyternaut/persona` are now provided by `@jupyter-ai/jupyternaut`, and
the registries, the skills and the shared settings by `@jupyter-ai/persona-kit`:

| Before                                            | After                                     |
| ------------------------------------------------- | ----------------------------------------- |
| `@jupyternaut/persona:tool-registry`              | `@jupyter-ai/persona-kit:tool-registry`   |
| `@jupyternaut/persona:skill-registry`             | `@jupyter-ai/persona-kit:skill-registry`  |
| `@jupyternaut/persona:skills`                     | `@jupyter-ai/persona-kit:skills`          |
| `@jupyternaut/persona:openrouter-auth`            | `@jupyter-ai/persona-kit:openrouter-auth` |
| (new)                                             | `@jupyter-ai/persona-kit:settings`        |
| `@jupyternaut/persona:diff-manager`               | Removed                                   |
| `@jupyternaut/persona:<name>` (the other plugins) | `@jupyter-ai/jupyternaut:<name>`          |

If you were disabling or deferring any of these plugins, for example in a custom
`jupyter-lite.json` file, you will need to update the plugin IDs as follows:

```diff
{
  "jupyter-lite-schema-version": 0,
  "jupyter-config-data": {
-   "disabledExtensions": ["@jupyternaut/persona:skills"]
+   "disabledExtensions": ["@jupyter-ai/persona-kit:skills"]
  }
}
```

### Requirements

- `jupyterlab-ai-commands >= 0.4.0` (was `>= 0.3.1`).
- JupyterLab >= 4.5.0 or Notebook >= 7.5.0.

### Extensions built on `@jupyternaut/agent`

The exports of `@jupyternaut/agent` and `@jupyternaut/persona` move to the two new
packages:

| Before                                                                                                                        | After                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `IToolRegistry`, `ISkillRegistry`, `ITool` from `@jupyternaut/agent`                                                          | `@jupyter-ai/persona-kit` (tokens `@jupyter-ai/persona-kit:IToolRegistry` and `@jupyter-ai/persona-kit:ISkillRegistry`) |
| `IAISettingsModel` from `@jupyternaut/agent`, for the shared settings (command approvals, MIME rendering, skills paths)       | `IPersonaKitSettings` from `@jupyter-ai/persona-kit`                                                                    |
| `IAISettingsModel`, `IProviderRegistry`, `IAgentManagerFactory`, the providers and the AI SDK agent from `@jupyternaut/agent` | `@jupyter-ai/jupyternaut` (tokens `@jupyter-ai/jupyternaut:I...`)                                                       |
| `IPersonaRegistry` from `@jupyternaut/persona`                                                                                | `@jupyter-ai/jupyternaut`                                                                                               |
| The `IAgentManager` and `IDiffManager` tokens                                                                                 | Removed                                                                                                                 |

Update the imports accordingly:

```diff
-import { IToolRegistry } from '@jupyternaut/agent';
+import { IToolRegistry } from '@jupyter-ai/persona-kit';
```

An extension that only adds tools or skills depends on the kit, consumed as a shared
singleton. See [Building an in-browser persona](./personas.md).

The chat username of the persona stays `jupyternaut-frontend`, so the mention
`@jupyternaut-frontend` still works.

## `v0.19.0` to `v0.20.0`

### The Jupyternaut persona

Jupyter AI Lite 0.20.0 adds a second extension, `@jupyternaut/persona` (PyPI
`jupyternaut-persona`), which provides Jupyternaut as a persona of the chats tracked by
the chat tracker, including the chats of
[Jupyter AI](https://github.com/jupyterlab/jupyter-ai)
([#356](https://github.com/jupyterlite/ai/pull/356)). `jupyterlite-ai` depends on it and
keeps its chat interface. In a chat of Jupyter AI, mention `@jupyternaut-frontend` to get
an answer from the in-browser persona.

### Settings

The settings of `@jupyterlite/ai:settings-model` are split in two, and are not migrated.
The API keys stored in the secrets manager are kept.

| Settings                                                                                                                     | New id                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| The agent settings: providers, model, system prompts, tools, command approvals, skills paths...                              | `@jupyternaut/persona:settings-model`, edited in the **Jupyternaut Settings** panel of the **Settings** menu (and from the chat toolbar as before) |
| The chat settings: `sendWithShiftEnter`, `autoTitle`, `showTokenUsage`, `showContextUsage`, `chatBackupDirectory`, `toolbar` | `@jupyterlite/ai:chat`, in the settings editor                                                                                                     |
| `mcpServers`                                                                                                                 | Removed, see below                                                                                                                                 |

### MCP servers

The MCP servers are managed by the
[jupyter-mcp-manager](https://github.com/brichet/jupyter-mcp-manager) extension,
installed with `jupyternaut-persona` ([#360](https://github.com/jupyterlite/ai/pull/360)).
The `mcpServers` key is removed from the settings: add the servers again in the **MCP
Servers** tab of the settings panel, which saves them in the `jupyter-mcp-manager:manager`
settings.

### Plugin IDs

The plugins of the agent move from `@jupyterlite/ai` to `@jupyternaut/persona`: the
providers (`anthropic-provider`, `generic-provider`, `google-provider`,
`mistral-provider`, `openai-provider`), `provider-registry`, `settings-model`,
`settings-panel`, `tool-registry`, `skill-registry`, `skills`, `skills-command`,
`completion-status` and `diff-manager`. `@jupyterlite/ai` keeps the chat plugins
(`chat`, `chat-model-handler`, `chat-toolbar-factory`, `input-toolbar-factory`,
`clear-command`, `activeCellManager`, `chat-command-registry`).

```diff
{
  "jupyter-lite-schema-version": 0,
  "jupyter-config-data": {
-   "disabledExtensions": ["@jupyterlite/ai:skills"]
+   "disabledExtensions": ["@jupyternaut/persona:skills"]
  }
}
```

### AI SDK 7

The agent and the providers use the [AI SDK](https://ai-sdk.dev) 7
([#358](https://github.com/jupyterlite/ai/pull/358)): `ai` 7 and the `@ai-sdk/*` provider
packages 4. [Custom providers](./custom-providers.md) must update their AI SDK packages.

### JupyterLite 0.8

The `jupyterlite-ai[jupyter]` extra installs JupyterLite 0.8
([#370](https://github.com/jupyterlite/ai/pull/370)). See the
[JupyterLite migration guide](https://jupyterlite.readthedocs.io/en/latest/migration.html)
for the changes of JupyterLite 0.8.

## `v0.18.0` to `v0.19.0`

### Monorepo

The JavaScript package `@jupyterlite/ai` is split in two
([#353](https://github.com/jupyterlite/ai/pull/353)):

- `@jupyternaut/agent`, a library with the AI SDK agent, the providers, the tools, the
  skills and their tokens;
- `@jupyterlite/ai`, the JupyterLab extension with the chat.

The Python package `jupyterlite-ai` is unchanged.

An extension that imports the tokens of the agent (`IAgentManager`,
`IAgentManagerFactory`, `IDiffManager`, `IProviderRegistry`, `ISkillRegistry`,
`IToolRegistry`) from `@jupyterlite/ai` must import them from `@jupyternaut/agent`. Their
IDs change accordingly, for example `@jupyterlite/ai:IToolRegistry` becomes
`@jupyternaut/agent:IToolRegistry`. `IAISettingsModel` and `IChatModelHandler` stay in
`@jupyterlite/ai`:

```diff
-import { IToolRegistry } from '@jupyterlite/ai';
+import { IToolRegistry } from '@jupyternaut/agent';
```

### Chat components

`jupyterlite-ai` 0.19.0 requires `jupyter-chat-components >= 0.6.0`.
