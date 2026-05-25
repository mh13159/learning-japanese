# Global Agentic Workflow Orchestrator

Master orchestrator that coordinates all AI providers and routes tasks intelligently.

## Responsibilities

- **Provider Selection** - Routes tasks to optimal provider based on requirements
- **Load Balancing** - Distributes workload across providers
- **Fallback Management** - Routes to alternate provider if primary fails
- **Cost Optimization** - Selects cost-effective providers when quality is equivalent
- **Response Aggregation** - Consolidates results from multiple providers
- **Caching** - Reduces redundant API calls
- **Error Handling** - Manages provider failures gracefully

## Routing Logic

```
Task Input
    ↓
Analyze Requirements (cost, speed, quality needed)
    ↓
Provider Selection Matrix
    ├─ Claude (high reasoning)
    ├─ NVIDIA (fast, free)
    ├─ OpenAI (general purpose)
    └─ Gemini (multimodal)
    ↓
Execute with Selected Provider
    ↓
Validate & Aggregate Results
    ↓
Return to Caller
```

## Configuration

- `primaryProvider`: Default provider
- `fallbackProvider`: Secondary provider
- `costThreshold`: Max acceptable cost
- `speedThreshold`: Max acceptable latency
- `qualityThreshold`: Min acceptable quality score

## Provider-Specific Orchestrators

Each provider has its own orchestrator. See:
- [Claude Orchestrator](./.claude/orchestrator.md)
- [NVIDIA Orchestrator](./.nvidia/orchestrator.md)
- [OpenAI Orchestrator](./.openai/orchestrator.md)
- [Gemini Orchestrator](./.gemini/orchestrator.md)
