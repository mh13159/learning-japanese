# Claude Provider Orchestrator

Local orchestrator for Claude-specific workflows and skill coordination.

## Responsibilities

- **Skill Routing** - Routes to appropriate Claude skills
- **Model Selection** - Chooses Claude model (Opus, Sonnet, Haiku)
- **Token Management** - Optimizes token usage
- **Rate Limiting** - Manages API rate limits
- **Context Management** - Maintains conversation context

## Supported Skills

- Code Analysis
- Reasoning & Logic
- Translation
- Documentation
- Testing

## Model Selection Strategy

- **Opus** - Complex reasoning, analysis (slower, more expensive)
- **Sonnet** - Balanced performance (default)
- **Haiku** - Fast, simple tasks (cheaper)

## Configuration

```json
{
  "defaultModel": "sonnet",
  "maxTokens": 4096,
  "rateLimit": 100,
  "timeout": 30000
}
```
