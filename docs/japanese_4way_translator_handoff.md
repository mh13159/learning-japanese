# Japanese 4-Way Translator / Mapper — Refined Handoff
## Executive summary

A single-page app that accepts English, Romaji, Japanese (kana/kanji), or audio and produces a canonical set of representations: English, Japanese (Hyōjungo / normalized), kana, romaji, and optional generated audio. The goal is to prioritize pronunciation, transliteration fidelity, and a consistent canonical Japanese form suitable for learners and conversational use.

Key outcomes
- Accurate orthographic conversions (kanji ⇄ kana ⇄ romaji)
- Natural, standardized Japanese output (Hyōjungo)
- High-quality speech input (transcription) and TTS output
- Lightweight, fast UI for copy and playback

---

## Goals (MVP)

- Auto-detect input type (English / Romaji / Japanese / Audio)
- Produce the canonical outputs: english, japanese, kana, romaji, audioUrl?
- Keep processing deterministic and reversible where practical
- Use browser TTS for initial audio; support backend TTS later

Non-goals (initial)
- Offline speech transcription (defer whisper.cpp)
- Enterprise-grade scalability (MVP is single-region)

---

## Data contract

Canonical output shape (JSON):

```json
{
  "english": "",
  "japanese": "",
  "kana": "",
  "romaji": "",
  "audioUrl": "optional"
}
```

Validation rules
- `japanese` must be normalized to Hyōjungo (no casual slang unless requested)
- `kana` must contain hiragana/katakana only (no kanji)
- `romaji` should use Hepburn-style by default

---

## Minimal API surface (Next.js / API routes)

POST /api/convert
- body: { input: string | null, audioBase64?: string }
- response: canonical JSON above

GET /api/health
- simple readiness/liveness

Notes
- Keep endpoints idempotent; add request-id and caching later for repeated queries.

---

## Detection & normalization rules

Input detection (priority):
1. Audio payload present → audio path (whisper)
2. Character set detection (kanji/kana) → Japanese
3. Romaji patterns (common syllables) → Romaji
4. Fallback → English

Normalization
- Strip leading/trailing whitespace, normalize punctuation, convert fullwidth ASCII
- For Japanese inputs, run tokenization then canonicalize readings (use Kuroshiro)

Edge cases
- Mixed-language inputs: detect dominant language and provide best-effort conversions
- Ambiguous Romaji: prompt user or return multiple candidate kana/kanji when confidence is low

---

## Pipeline (detailed)

1. Input detector
2. If audio: Whisper → transcript
3. Normalizer: canonical whitespace/punctuation
4. Transliteration: japanese ⇄ kana ⇄ romaji (Kuroshiro + Kuromoji)
5. Translation: DeepL (or fallback) to produce/verify English/JP
6. TTS: browser speechSynthesis (MVP) or backend TTS (later)
7. Return canonical JSON and audio URL where available

---

## Recommended stack & libs

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- Transliteration/tokenization: Kuroshiro, Kuromoji.js
- Translations: DeepL API (MVP), LibreTranslate fallback
- Speech → Whisper (OpenAI) or whisper.cpp for offline
- TTS: browser speechSynthesis (MVP), Amazon Polly / Azure TTS later

---

## UI mock & UX notes

- Single input area supporting text/audio
- Output tiles for English, Romaji, Kana, Japanese, and Audio playback
- Per-output copy and “export as CSV/JSON” buttons
- Confidence indicator per output; when low, show "ambiguous — review" and list alternatives

---

## Acceptance criteria (MVP)

1. A user can paste any one of: English, Romaji, Japanese, or upload short audio, and receive valid canonical JSON.
2. Kana output is always present and separated from `japanese`.
3. Romaji follows Hepburn and is consistent across conversions.
4. Audio playback generated via browser TTS for Japanese output.

---

## Milestones & estimates

1. Prototype (UI + transliteration + browser TTS) — 1 day (4–8 hours)
2. Add translation (DeepL) + normalization — 1 day
3. Whisper integration (serverless function) + confidence handling — 1 day
4. Polish (UX, caching, tests) — 1–2 days

---

## Testing plan

- Unit tests: transliteration rules, detection heuristics
- Integration tests: /api/convert happy path with each input type
- E2E: simulate audio upload → full conversion
- Add small fixtures with common ambiguous romaji cases

---

## Accessibility & performance

- Ensure keyboard access for input and copy buttons
- Lazy-load heavy libs (Kuromoji) only when needed
- Use small audio chunks for preview; stream TTS where possible

---

## Security & privacy

- When using external APIs (Whisper/DeepL), surface minimal text and avoid storing raw audio unless consented
- Add privacy notice and clear opt-in for storing audio

---

## Dev ergonomics

- Local dev: `pnpm install && pnpm dev` (or `npm`/`yarn` equivalents)
- Keep transliteration logic in `/lib/transliteration` and translation logic in `/lib/translation`

---

## Open questions

1. Preferred romaji standard (Hepburn vs Kunrei)? Default: Hepburn.
2. Should we attempt kanji disambiguation (show candidates) or only return kana + translation? MVP: show kana + optional kanji candidates.
3. Do we need offline-first mode for learners? (defer)

---

## Next steps (concrete)

1. Create a minimal Next.js app shell with a single `/api/convert` route.
2. Implement input detection + Kuroshiro transliteration unit tests.
3. Wire browser TTS for Japanese output and add playback button.
4. Add Whisper demo integration as a serverless route.
5. Integrate skills/agents from Agentic AI project (use provided sync script).

---

## Files I added for you

- `scripts/sync-copilot-skills.ps1` — PowerShell script to copy `.github/skills` and `.github/agents` from the Agentic AI project into this repo and add a `copilot-instructions.md` if missing.
- `.github/copilot-instructions.md` — concise project-level Copilot instructions derived from the top rules in this plan.

---

If you want, I can also scaffold a minimal Next.js repo and implement the `/api/convert` route and a tiny UI prototype (say "scaffold prototype").
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
