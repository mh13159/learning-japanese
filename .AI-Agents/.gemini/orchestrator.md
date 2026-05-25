# Google Gemini Provider Orchestrator

Local orchestrator for Gemini model workflows and multimodal processing.

## Responsibilities

- **Model Selection** - Routes between Gemini Pro and Vision
- **Multimodal Processing** - Handles text, images, video
- **Vision Tasks** - Manages image analysis
- **Content Filtering** - Manages safety settings
- **Streaming** - Handles response streaming

## Supported Models

- Gemini Pro (text, general purpose)
- Gemini Pro Vision (multimodal, images)

## Model Selection Strategy

- **Gemini Pro Vision** - Image analysis, multimodal
- **Gemini Pro** - Text-only, general purpose (default)

## Configuration

```json
{
  "defaultModel": "gemini-pro",
  "visionModel": "gemini-pro-vision",
  "maxTokens": 2048,
  "safetyLevel": "medium",
  "timeout": 20000
}
```
