# Japanese 4-Way Translator / Mapper
## Full Project Handoff + Product Specification

---

# Overview

A unified Japanese language mapping tool that accepts:

1. English
2. Romaji
3. Hyōjungo (standard Japanese)
4. Audio

…and converts/maps to all other representations.

Core concept:

> Input ANY format → receive all remaining formats.

The app is intended to bridge:
- learners
- travelers
- anime fans
- pronunciation learners
- shadowing learners
- conversational Japanese users

Unlike traditional translators, this app focuses heavily on:
- pronunciation
- transliteration
- normalization
- natural Japanese speech
- speech/audio mapping

---

# Clarification of “Hyōjungo”

The user clarified that “Hyōjungo” means:

- Standard Tokyo-style Japanese
- Natural pronunciation
- Normalized Japanese output
- Standard speech patterns

The app should:
- normalize slang/casual Japanese when possible
- produce standard spoken Japanese
- support native-like pronunciation audio

---

# Main User Workflow

## Inputs

The user can provide:

### 1. English
Example:
```text
Good morning
```

### 2. Romaji
Example:
```text
ohayou gozaimasu
```

### 3. Japanese
Example:
```text
おはようございます
```

### 4. Audio
Example:
- spoken Japanese
- spoken English

---

# Outputs

Regardless of input type, the app should produce:

```ts
{
  english: string
  japanese: string
  kana: string
  romaji: string
  audioUrl?: string
}
```

---

# Why Kana Must Exist Separately

DO NOT only store:
- English
- Japanese
- Romaji

Store kana separately.

Reason:
- furigana
- pronunciation scoring
- karaoke highlighting
- syllable timing
- speech analysis
- pitch accent support

---

# Recommended MVP Stack

## Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

---

# Japanese Processing

## Transliteration Engine

Recommended:
- Kuroshiro
- Kuromoji.js

Responsibilities:
- Japanese ↔ Romaji
- Kana conversion
- Furigana support
- Japanese tokenization

---

# Translation Layer

## MVP Recommendation

Use:
- DeepL API

Fallback:
- LibreTranslate

Reason:
DeepL generally produces significantly better Japanese quality.

---

# Audio / TTS

## MVP Audio Recommendation

Use browser TTS initially:

```js
speechSynthesis.speak()
```

Benefits:
- instant implementation
- native Japanese voices
- minimal backend work
- surprisingly good quality

---

# Speech Recognition

## Recommended

Use:
- OpenAI Whisper API

Future:
- whisper.cpp for offline mode

Purpose:
- speech-to-text transcription

---

# Recommended Architecture

```text
Client
  ↓
Next.js API Layer
  ├── Input detector
  ├── Translation engine
  ├── Transliteration engine
  ├── TTS generator
  └── Speech transcription
```

---

# Input Detection Strategy

## Detect:
- Japanese characters
- Romaji patterns
- English
- Audio

---

# Japanese Detection

Regex detection:
- Hiragana
- Katakana
- Kanji

---

# Romaji Detection

Detect common phonetics:
- desu
- ka
- wa
- tsu
- shi
- ou
- ryou
- kyou

Etc.

---

# English Detection

Fallback when:
- normal English vocabulary dominates
- no Japanese character set detected

---

# Suggested Unified Pipeline

```text
INPUT
  ↓
Input Type Detection
  ↓
Normalize Input
  ↓
Generate Canonical Japanese
  ↓
Generate:
  - English
  - Romaji
  - Kana
  - Audio
```

---

# MVP Scope

## Features

### Core
- single page app
- text input
- audio input
- auto detection
- English output
- Japanese output
- Romaji output
- kana output
- audio playback

---

# UI Features

- copy buttons
- playback controls
- clear button
- input swap
- mobile responsive layout

---

# Suggested UI Layout

```text
┌─────────────────────┐
│ Input Area          │
│ [Text / Audio]      │
└─────────────────────┘

┌─────────────────────┐
│ English             │
├─────────────────────┤
│ Romaji              │
├─────────────────────┤
│ Kana                │
├─────────────────────┤
│ Japanese            │
├─────────────────────┤
│ Audio Playback      │
└─────────────────────┘
```

---

# Recommended Folder Structure

```text
/app
/components
/lib
  /translation
  /transliteration
  /audio
  /speech
/types
```

---

# Suggested API Modules

## translation.ts
Handles:
- EN ↔ JP translation

## transliteration.ts
Handles:
- romaji
- kana
- furigana

## speech.ts
Handles:
- Whisper transcription

## tts.ts
Handles:
- audio generation

---

# Time Estimates

## Quick Prototype
Estimated:
4–8 hours

Includes:
- working UI
- translation
- transliteration
- browser TTS
- Whisper integration

---

# Production-ish Build
Estimated:
2–4 days

Includes:
- polished UX
- caching
- improved error handling
- mobile optimization
- audio improvements
- translation cleanup
- normalization logic

---

# Existing Apps Reviewed

Closest overlaps:
- Perapera
- TabiTalk
- VoiceTra
- Takoboto

Observation:
No app fully unifies:
- English
- Romaji
- Japanese
- Audio
into a clean single workflow.

This remains a meaningful niche.

---

# Key Product Differentiator

This should NOT be marketed simply as:
- translator

Better positioning:
- Japanese speech mapper
- Japanese pronunciation bridge
- Romaji-to-real-Japanese assistant
- Japanese speech companion

---

# Future Features

## 1. Romaji Auto Correction

Input:
```text
konichiwa
```

Output:
```text
konnichiwa
こんにちは
```

---

# 2. Anime/Casual → Standard Mode

Input:
```text
omae nani shiteru
```

Output:
```text
お前、何してる？
```

Also generate:
```text
あなたは何をしていますか？
```

Explain:
- masculine
- informal
- casual speech

---

# 3. Furigana Layer

Example:

```text
日本語
にほんご
nihongo
```

---

# 4. Accent-Aware Audio

Goal:
- standard Tokyo pronunciation

---

# 5. Pitch Accent Visualization

Future advanced feature:
- visualize Japanese pitch accents
- useful for pronunciation learners

---

# 6. Shadowing Practice

Features:
- repeat-after-me playback
- looping phrases
- slow playback
- pronunciation comparison

---

# 7. Pronunciation Scoring

Use:
- speech recognition similarity
- phoneme matching
- syllable timing

---

# 8. JLPT Tagging

Tag vocabulary/sentences:
- N5
- N4
- N3
- N2
- N1

---

# 9. AI Explanation Layer

Explain:
- grammar
- nuance
- politeness
- slang
- gendered speech

---

# 10. Offline Mode

Future stack:
- whisper.cpp
- local TTS
- local translation models

---

# Suggested Build Order

1. UI scaffold
2. Input detection
3. Kuroshiro integration
4. Translation API
5. Browser TTS
6. Whisper transcription
7. Mobile optimization
8. Polishing

---

# Suggested Libraries

## Core
- kuroshiro
- kuromoji

## Translation
- deepl-node
OR
- libretranslate

## Speech
- openai whisper
OR
- whisper.cpp

## UI
- shadcn/ui
- Tailwind CSS

---

# Final Recommendation

Build MVP FAST.

Avoid over-engineering:
- local AI
- offline models
- complex NLP pipelines

Start with:
- browser TTS
- hosted translation APIs
- Kuroshiro

Validate UX first.

---

# DETAILED PRODUCT PROMPT

## Master Prompt

Build a modern Japanese language mapping web application that functions as a unified 4-way translator and pronunciation bridge.

The app must support the following input types:
1. English
2. Romaji
3. Standard Japanese (Hyōjungo)
4. Audio speech input

The app should automatically detect the input type and generate all remaining forms.

For every input, the system should output:
- English translation
- Standard Japanese output
- Kana representation
- Romaji transliteration
- Native-like audio pronunciation playback

The app should focus heavily on:
- natural Japanese
- pronunciation
- transliteration
- speech normalization
- beginner friendliness
- conversational usability

The app should not feel like a traditional translator. It should feel like a Japanese pronunciation and speech companion.

Use:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

Use:
- Kuroshiro + Kuromoji for transliteration
- DeepL or LibreTranslate for translation
- Whisper for speech-to-text
- browser TTS initially for speech synthesis

The UI should:
- be mobile responsive
- have a modern minimal design
- support audio playback
- support copy buttons
- support live updates
- support dark mode
- clearly separate outputs

The app architecture should include:
- input detection layer
- translation layer
- transliteration layer
- speech recognition layer
- text-to-speech layer

Future advanced features should include:
- Romaji auto correction
- anime/casual Japanese normalization
- furigana overlays
- pitch accent visualization
- pronunciation scoring
- shadowing practice
- AI grammar explanations
- JLPT tagging
- offline mode
- local speech models

The app should emphasize:
- fast response
- clean UX
- natural pronunciation
- Tokyo-standard Japanese speech
- educational usefulness

The product positioning should be:
- Japanese speech mapper
- Japanese pronunciation bridge
- Romaji-to-real-Japanese assistant
- Japanese speech companion

The app should aim to become the easiest way for users to move fluidly between:
- hearing Japanese
- reading Japanese
- typing romaji
- understanding English
- speaking naturally
