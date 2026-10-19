# Building an in-browser persona

[Jupyter AI](https://github.com/jupyterlab/jupyter-ai) personas run on the Jupyter server. The `jupyter-ai-agent-lite` package holds the building blocks of personas that run in the browser instead, so they also work in JupyterLite. [Jupyternaut](https://pypi.org/project/jupyternaut-lite/), in this repository, is built on it. A persona built on `@jupyter-ai/agent-lite` lives in its own repository and does not depend on Jupyternaut.

## What `@jupyter-ai/agent-lite` provides

`@jupyter-ai/agent-lite` is a JupyterLab extension (Python package `jupyter-ai-agent-lite`) that provides these tokens:

- `IToolRegistry`: the tools a persona can offer to a model. The extension registers `discover_commands`, `execute_command`, `browser_fetch`, `discover_skills` and `load_skill`. Other extensions can add their own tools.
- `ISkillRegistry`: the [agent skills](./skills.md) loaded from the skills paths or registered by extensions.
- `IAgentSettings`: the settings shared by the personas, with the settings id `@jupyter-ai/agent-lite:settings`:
  - `commandsRequiringApproval`: the JupyterLab commands that need the approval of the user before a persona runs them
  - `commandsAutoRenderMimeBundles`: the commands whose `execute_command` outputs may render MIME bundles in the chat
  - `trustedMimeTypesForAutoRender`: the MIME types marked as trusted when those outputs render
  - `skillsPaths`: the directories that hold agent skills

  The `execute_command` tool does not ask for approval itself: the agent reads `settings.config.commandsRequiringApproval` before each call of the tool and asks the user when the command is listed (Jupyternaut uses the `toolApproval` option of the AI SDK for this).

The package also exports helpers:

- `getToolInputSchema(tool)` and `parseToolInput(name, tool, input)`: the JSON schema of the input of a tool, and the parsed input of a tool call. A tool is an `ITool`: an object with a `description`, an `inputSchema` (a [zod](https://zod.dev) schema or an [AI SDK](https://ai-sdk.dev) JSON schema object), an `execute` function and an optional `metadata.title`. AI SDK tool objects have this shape.
- `extractMimeBundles(output, trustedMimeTypes)`: the rich outputs of a JupyterLab command, as chat MIME bundles.
- `requestApiKey(options)` and `forwardAuthCode()`: the [OpenRouter](./openrouter.md) sign-in flow. The extension runs the forwarder plugin, so a persona only calls `requestApiKey`.
- `getAppAttribution()`: the application name and URL sent to the providers that support attribution.

`@jupyter-ai/agent-lite` has no dependency on the AI SDK: a persona can use any agent runtime.

(depending-on-agent-lite)=

## Depending on `@jupyter-ai/agent-lite`

A persona extension, or an extension that only adds tools or skills, consumes `@jupyter-ai/agent-lite` as a shared singleton, so that the tokens are the same objects in every extension. In `package.json`:

```json
{
  "dependencies": {
    "@jupyter-ai/agent-lite": "^0.21.0"
  },
  "jupyterlab": {
    "extension": true,
    "sharedPackages": {
      "@jupyter-ai/agent-lite": {
        "bundled": false,
        "singleton": true
      }
    }
  }
}
```

With `bundled: false`, the `@jupyter-ai/agent-lite` extension must be installed: the Python package of the persona depends on `jupyter-ai-agent-lite`:

```toml
dependencies = [
    "jupyter-ai-agent-lite >=0.21.0,<0.22",
]
```

`@jupyter-ai/agent-lite` follows the `0.x` convention: a new minor version may change the API. It is released with Jupyternaut, so each minor release of Jupyternaut is also a minor release of `@jupyter-ai/agent-lite`. Pin the minor version, and test and bump the pin at each minor release.

## Registering a persona in the chat

The chat and its persona selector come from [jupyterlab-chat](https://github.com/jupyterlab/jupyter-chat) and `@jupyter-ai/persona-manager`. A persona attaches to each chat panel from `IChatTracker`, registers itself in the chat with `IPersonaSessionRegistry` (`registerFrontendPersona`), answers the messages addressed to it, and publishes its state (model, usage, processing). The Jupyternaut plugins in `packages/jupyternaut-lite/src/index.ts` are the reference implementation. A helper for this glue is planned in `@jupyter-ai/agent-lite`.

## Developing against this repository

To work on a persona with an unreleased version of `@jupyter-ai/agent-lite`:

1. In this repository, build and install the packages in development mode: `jlpm install && jlpm build`, then `python scripts/dev_install.py`.
2. In the persona repository, use the same Python environment and link the `@jupyter-ai/agent-lite` workspace: `jlpm link /path/to/this-repository/packages/agent-lite`. This writes a `portal:` resolution in `package.json` that must not be committed.
3. Build the persona and install it with `jupyter-builder develop . --overwrite`, then reload JupyterLab.
