# AI Agents Framework

Unified orchestration for multiple AI provider integrations.

## Orchestration Architecture

- **Global Orchestrator** - [orchestrator.md](./orchestrator.md) - Master router
  - **Claude Orchestrator** - [.claude/orchestrator.md](./.claude/orchestrator.md)
  - **NVIDIA Orchestrator** - [.nvidia/orchestrator.md](./.nvidia/orchestrator.md)
  - **OpenAI Orchestrator** - [.openai/orchestrator.md](./.openai/orchestrator.md)
  - **Gemini Orchestrator** - [.gemini/orchestrator.md](./.gemini/orchestrator.md)

## AI Providers

### Claude (Anthropic)
- **Folder**: `.claude/`
- **Models**: Claude 3 Opus, Sonnet, Haiku
- **Capabilities**: Code analysis, reasoning, orchestration
- **Docs**: [Claude Setup](./claude/CLAUDE.md)

### NVIDIA Build
- **Folder**: `.nvidia/`
- **Models**: Llama, Mistral, Mixtral
- **Capabilities**: Free inference, translation, code generation
- **Docs**: [NVIDIA Setup](./nvidia/NVIDIA_BUILD_SETUP.md)

### OpenAI
- **Folder**: `.openai/`
- **Models**: GPT-4, GPT-3.5-turbo
- **Capabilities**: Advanced reasoning, embeddings
- **Docs**: [OpenAI Setup](./openai/OPENAI_SETUP.md)

### Google Gemini
- **Folder**: `.gemini/`
- **Models**: Gemini Pro, Gemini Vision
- **Capabilities**: Multimodal analysis, translation
- **Docs**: [Gemini Setup](./gemini/GEMINI_SETUP.md)

## Provider Comparison

| Provider | Cost | Speed | Quality | Best For |
|----------|------|-------|---------|----------|
| Claude | Paid | Medium | Excellent | Reasoning, Analysis |
| NVIDIA | Free | Fast | Good | Translation, Inference |
| OpenAI | Paid | Fast | Excellent | General Purpose |
| Gemini | Paid | Fast | Very Good | Multimodal Tasks |

## Documentation

- [Base Dev Lifecycle Skills](./claude/base_dev_lifecycle_skills.md)
- [Agentic Workflow Orchestrator](./claude/agentic_workflow_orchestrator.md)
- [Skills Registry](./claude/skills_registry.md)
- [Configuration](./claude/config.json)

## Overview

See individual markdown files in `.claude/` for detailed skill documentation.
