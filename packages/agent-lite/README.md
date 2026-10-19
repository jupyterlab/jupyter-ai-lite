# @jupyter-ai/agent-lite

The building blocks of in-browser AI personas for [Jupyter AI](https://github.com/jupyterlab/jupyter-ai), in JupyterLab, Notebook 7 and JupyterLite. The Python package is [`jupyter-ai-agent-lite`](https://pypi.org/project/jupyter-ai-agent-lite/).

The package is a JupyterLab extension that provides:

- `IToolRegistry`: the tools a persona offers to a model, with the built-in `discover_commands`, `execute_command`, `browser_fetch`, `discover_skills` and `load_skill` tools
- `ISkillRegistry`: the agent skills loaded from the skills paths or registered by extensions
- `IAgentSettings`: the settings shared by the personas (`@jupyter-ai/agent-lite:settings`): the commands that require an approval, the commands whose outputs render in the chat, the trusted MIME types and the skills paths
- helpers: `getToolInputSchema`, `parseToolInput`, `extractMimeBundles`, `requestApiKey` and `forwardAuthCode` (OpenRouter sign-in), `getAppAttribution`

The package has no dependency on the AI SDK.

## Usage

A persona extension consumes `@jupyter-ai/agent-lite` as a shared singleton:

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

Its Python package depends on `jupyter-ai-agent-lite`, so that the extension is installed.

```typescript
import { IToolRegistry } from '@jupyter-ai/agent-lite';

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'my-persona:tools',
  autoStart: true,
  requires: [IToolRegistry],
  activate: (app: JupyterFrontEnd, tools: IToolRegistry) => {
    for (const { name, tool } of tools.namedTools) {
      console.log(name, tool.description);
    }
  }
};
```

See [Building an in-browser persona](https://jupyterlite-ai.readthedocs.io/en/latest/personas/) for the complete guide.
