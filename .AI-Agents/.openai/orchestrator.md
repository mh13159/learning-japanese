# OpenAI Provider Orchestrator

Local orchestrator for OpenAI model workflows and API management.

## Responsibilities

- **Model Selection** - Routes between GPT-4 and GPT-3.5-turbo
- **Token Optimization** - Manages token consumption
- **Cost Control** - Monitors spending limits
- **Function Calling** - Manages OpenAI function calls
- **Embedding Management** - Handles vector embeddings

## Supported Models

- GPT-4 (high capability, high cost)
- GPT-3.5-turbo (fast, economical)
- Embeddings (vector generation)

## Model Selection Strategy

- **GPT-4** - Complex tasks, reasoning
- **GPT-3.5-turbo** - General purpose, cost-effective (default)

## Configuration

```json
{
  "defaultModel": "gpt-3.5-turbo",
  "maxTokens": 2048,
  "costLimit": 10.0,
  "timeout": 25000
}
```
