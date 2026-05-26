# Japanese Speech Companion

A FOSS Japanese ↔ English ↔ Romaji ↔ Kana mapper. Type or speak any of the four forms and see the rest. No commercial AI, no API keys at runtime.

## 🎯 Overview

The pipeline is 100% free and open-source:

| Layer | Stack | License |
|---|---|---|
| Framework | Next.js 16 + React 19 + TypeScript 5 | MIT |
| UI | Tailwind v4 + shadcn/ui (Radix) | MIT |
| Tokenization & readings | [Kuromoji.js](https://github.com/takuyaa/kuromoji.js) | Apache 2.0 |
| Kana ↔ Romaji ↔ Kanji-reading | [Kuroshiro](https://github.com/hexenq/kuroshiro) | MIT |
| Romaji typing → kana | [wanakana](https://github.com/WaniKani/WanaKana) | MIT |
| EN ⇄ JA (optional) | Self-hosted [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) | AGPLv3 |
| EN ⇄ JA fallback | Bundled 152-entry phrase dictionary | this repo |
| Speech-in | Web Speech API (`SpeechRecognition`, browser) | browser-builtin |
| Speech-out | Web Speech API (`speechSynthesis`, browser) | browser-builtin |

Nothing leaves the device unless you configure `LIBRETRANSLATE_URL`, and even then you're free to point it at your own self-hosted instance.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (Node 24 tested) and npm
- No API keys required

### 1. Install
```bash
git clone https://github.com/mh13159/learning-japanese.git
cd learning-japanese
npm install
```

### 2. EN ⇄ JA translation

**Vocabulary lookups** (1–3 word inputs) hit Jisho.org's public JMdict-backed API directly — no setup required, no key. You can type "good", "umbrella", "fish", etc. and get an accurate Japanese answer.

**Sentence translation** requires a self-hosted LibreTranslate (or compatible) endpoint. Without it, sentence input falls back to a note explaining how to enable it.

```bash
# Docker (recommended, what this repo's dev uses)
docker run -d --name libretranslate -p 5000:5000 \
  libretranslate/libretranslate --load-only en,ja

# OR Python
pip install libretranslate
libretranslate --host 127.0.0.1 --port 5000 --load-only en,ja
```

Then:
```bash
cp .env.local.example .env.local
# .env.local already has LIBRETRANSLATE_URL=http://localhost:5000
```

> **Translation quality note.** LibreTranslate uses the Argos Translate package, whose EN ⇄ JA model is ~100 MB. It's reliable on vocabulary but rough on natural sentence structure — "where is the airport" becomes "空港の場所" rather than the idiomatic "空港はどこですか". The UI flags sentence-level output with a lower confidence and an advisory note.
>
> **Recommended upgrade for higher-quality sentence translation:** NLLB-200 via the bundled FastAPI wrapper below. Argos handles vocabulary fine but mangles natural sentence structure (`where is the airport` → `空港の場所`, "the airport's place"). NLLB-200 produces idiomatic output (`空港はどこですか?`).

### 3. (Recommended) NLLB-200 translation server

The repo ships a small Python FastAPI service ([scripts/mt_server.py](./scripts/mt_server.py)) that wraps Meta's [NLLB-200-distilled-600M](https://huggingface.co/facebook/nllb-200-distilled-600M) and exposes a LibreTranslate-compatible `/translate` endpoint. Drop-in replacement for LibreTranslate — same JSON API, dramatically better sentence quality.

```bash
# One-time: install Python deps (Python 3.10+ required)
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install transformers ctranslate2 fastapi "uvicorn[standard]" sentencepiece sacremoses

# Run the server (binds 127.0.0.1:5001 by default)
npm run opus-mt
# or directly:
py scripts/mt_server.py --port 5001          # default beam_size=2 (recommended)
py scripts/mt_server.py --beam-size 1        # greedy decoding, slightly faster, marginal quality drop
```

First start downloads ~1.3 GB of NLLB-200 weights to `~/.cache/huggingface/` and **auto-converts** them to a CTranslate2 INT8 model at `~/.cache/nllb-200-ct2-int8/` (3-5 min, ~600 MB on disk). Subsequent starts load the CT2 model in ~5 seconds.

**Why CTranslate2 INT8?** ~8x faster CPU inference than raw `transformers` + PyTorch on the same model, with virtually identical quality. Measured on this app:

| Path | Mean latency per sentence |
|---|---|
| PyTorch FP32 (initial) | 7–10 s |
| **CTranslate2 INT8 (current)** | **0.9–2 s** |
| Cache hit (in-memory) | ~100 ms |

Point the app at it by editing `.env.local`:
```
LIBRETRANSLATE_URL=http://localhost:5001
```
Restart `npm run dev`.

**Quality comparison** (same input, three backends):

| Input | LibreTranslate (Argos) | FuguMT | NLLB-200 |
|---|---|---|---|
| where is the airport | 空港の場所 | この空港のどこに | **空港はどこですか?** |
| would you help me | お問い合わせ (!) | 私に手を差し出して | **助けてくれませんか?** |
| I would like to visit Mount Fuji next summer | 来夏の富士山を訪れたい | この夏の山にぜひ行きたい | **来年の夏にフジ山を訪れたい** |
| could you recommend a good restaurant | (n/a) | おすすめのよい店教えて | **良いレストランをお勧めできますか?** |

NLLB-200 is CC-BY-NC 4.0 (non-commercial). For commercial use, swap `MODEL_NAME` in `scripts/mt_server.py` to `staka/fugumt-en-ja` + `staka/fugumt-ja-en` (Apache 2.0, somewhat lower quality) or `Helsinki-NLP/opus-mt-*` (Apache 2.0, much lower quality).

### 3. Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

- [`app/`](./app/) — Next.js App Router. `app/api/translate/route.ts` is the only API route.
- [`components/translator.tsx`](./components/translator.tsx) — Client component, the entire UI.
- [`lib/translate.ts`](./lib/translate.ts) — Detection, Kuroshiro/wanakana wrappers, LibreTranslate client, in-memory cache.
- [`lib/seed-translations.ts`](./lib/seed-translations.ts) — Offline phrase dictionary fallback.
- [`docs/`](./docs/) — Design spec ([`japanese_4way_translator_handoff.md`](./docs/japanese_4way_translator_handoff.md)) and timestamped session handoffs.
- [`.claude/`](./.claude/) — Claude Code conventions and project-specific skills (token-saving, branching, docs workflow).

The [`.AI-Agents/`](./.AI-Agents/) directory contains earlier design notes about a multi-provider AI orchestrator. **That orchestrator is not part of this app** — the runtime is FOSS-only and uses no commercial LLM. The notes are kept as historical context.

## 💡 How It Works

1. **Input** — User types or speaks text/audio.
2. **Auto-detect** — Regex + heuristics classify the input as English, Romaji, or Japanese.
3. **Normalize** — `String.normalize("NFKC")` and trim.
4. **Convert** — Kuroshiro produces kana + romaji from any Japanese input; wanakana handles romaji → kana.
5. **EN ⇄ JA** — Optional LibreTranslate call, otherwise the seed dictionary.
6. **Cache** — In-memory LRU keyed on normalized input (max 500 entries, resets on server restart).
7. **Display** — Five outputs in four cards (English, Japanese, Kana, Romaji) plus a TTS playback row.

## 🔌 API

The app exposes one server route. You can use it independently of the UI.

```
POST /api/translate
Content-Type: application/json
{ "input": "<English | romaji | Japanese text>" }
```

Returns:
```ts
{
  english: string;
  japanese: string;
  kana: string;     // hiragana, no kanji
  romaji: string;   // Hepburn
  meta: {
    detected: "english" | "romaji" | "japanese";
    confidence: number;       // 0..1
    provider: string;         // e.g. "kuroshiro+libretranslate" or "kuroshiro+seed-dict(152)"
    cached: boolean;
    notes?: string[];
  };
}
```

`GET /api/translate` returns a small health JSON.

## 🧠 Browser audio support

- **Speech-in (mic button)** uses `window.SpeechRecognition` with `lang="ja-JP"`. Currently supported in Chrome and Edge; Firefox/Safari users see a clear "unsupported" message.
- **Speech-out (Play button)** uses `window.speechSynthesis.speak()` with `lang="ja-JP"`. Voice quality varies by OS — best on macOS (Kyoko) and recent Windows (Haruka / Nanami).

## 🔐 Environment & secrets

Runtime needs no secrets. The only optional variable is `LIBRETRANSLATE_URL` (see [`.env.local.example`](./.env.local.example)). The repo's `.gitignore` already excludes `.env.local` and `.credentials/`.

## 📁 Historical context

The [`.AI-Agents/`](./.AI-Agents/) directory contains notes from an earlier design pass that envisioned multi-provider AI orchestration (Claude, OpenAI, Gemini, NVIDIA). **That code does not exist in this app** and the runtime never calls any commercial LLM. The notes are preserved as historical record of design exploration; they are not load-bearing for the running product.

For the active spec, see [`docs/japanese_4way_translator_handoff.md`](./docs/japanese_4way_translator_handoff.md). For Claude Code conventions used during development, see [`CLAUDE.md`](./CLAUDE.md) and [`.claude/CLAUDE.md`](./.claude/CLAUDE.md).

## 🚀 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
