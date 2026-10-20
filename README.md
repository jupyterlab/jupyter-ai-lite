# jupyter-ai-lite

[![Github Actions Status](https://github.com/jupyterlab/jupyter-ai-lite/workflows/Build/badge.svg)](https://github.com/jupyterlab/jupyter-ai-lite/actions/workflows/build.yml)
[![Documentation Status](https://readthedocs.org/projects/jupyter-ai-lite/badge/?version=latest)](https://jupyter-ai-lite.readthedocs.io/en/latest/?badge=latest)
[![lite-badge](https://jupyterlite.rtfd.io/en/latest/_static/badge.svg)](https://jupyterlab.github.io/jupyter-ai-lite/lab/index.html)

AI code completions and chat for JupyterLab, Notebook 7 and JupyterLite, with the Jupyternaut persona of [Jupyter AI](https://github.com/jupyterlab/jupyter-ai) running in the browser.

[a screencast showing the Jupyter AI Lite extension in JupyterLite](https://github.com/user-attachments/assets/e33d7d84-53ca-4835-a034-b6757476c98b)

## Requirements

- JupyterLab >= 4.5.0 or Notebook >= 7.5.0

## Try it in your browser

You can try the extension in your browser using JupyterLite:

[![lite-badge](https://jupyterlite.rtfd.io/en/latest/_static/badge.svg)](https://jupyterlab.github.io/jupyter-ai-lite/lab/index.html)

## Install

To install the extension, execute:

```bash
pip install jupyter-ai-lite
```

To install requirements (JupyterLab, JupyterLite and Notebook):

```bash
pip install jupyter-ai-lite[jupyter]
```

## Packages

| Package                                                 | npm                            | Description                                                                                    |
| ------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| [`jupyter-ai-agent-lite`](python/jupyter-ai-agent-lite) | `@jupyter-ai/agent-lite`       | The building blocks of in-browser personas: tools, skills, shared settings and sign-in helpers |
| [`jupyternaut-lite`](python/jupyternaut-lite)           | `@jupyter-ai/jupyternaut-lite` | The Jupyternaut persona: AI chat and code completions with the AI SDK providers                |
| [`jupyter-ai-lite`](python/jupyter-ai-lite)             |                                | A meta package that installs both                                                              |

See [Building an in-browser persona](docs/personas.md) to build a persona on `@jupyter-ai/agent-lite` in another repository.

## Documentation

For detailed usage instructions, including how to configure AI providers, see the [documentation](https://jupyter-ai-lite.readthedocs.io/).

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyter-ai-lite jupyternaut-lite jupyter-ai-agent-lite
```

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md)
