# Japanese 4-Way Translator — Handoff & Spec

> Refined consolidation of the original braindump in [v1japanese_4way_translator_handoff.md](v1japanese_4way_translator_handoff.md). That file is preserved unchanged as the historical ideation source. This file is the working spec.

## 1. Executive summary

A single-page app that accepts one of four inputs — **English**, **Romaji**, **Japanese (kana/kanji)**, or **audio** — and produces a unified set of representations: **English**, **Japanese (Hyōjungo / normalized)**, **kana**, **romaji**, and **audio playback**. The product is positioned not as a generic translator but as a **pronunciation and speech companion** for learners, travelers, anime fans, and shadowing practitioners.

Key outcomes:
- Accurate orthographic conversions (kanji ⇄ kana ⇄ romaji), Hepburn by default.
- Natural, standardized Japanese output (Hyōjungo, Tokyo-standard pronunciation).
- High-quality speech transcription in, TTS out.
- Lightweight, fast UI with copy and playback per output.

> **Why "4-way" if there are 5 outputs?** The "4" refers to the four **input** types. Outputs are always 5 (English + Japanese + kana + romaji + audio). Future product copy should make this distinction explicit.

---

## 2. Reality check — what exists today

Treat this section as load-bearing. The docs in this repo (README, CHANGELOG, `.AI-Agents/`) describe an agentic AI framework that **is not implemented**. Before extending the spec, the next contributor should know:

| Area | Current state | Gap to spec |
|---|---|---|
| UI shell | [components/translator.tsx](../components/translator.tsx) renders 4 output cards (English / Japanese / Romaji / Audio) with hardcoded strings | Missing the **kana** card; outputs are a mock |
| API routes | none — `app/` has only `layout.tsx`, `page.tsx`, `globals.css` | Need `POST /api/translate` per §5 |
| Provider clients | none; `package.json` previously had a bogus `@nvidia-ai/sdk: latest` placeholder, now removed | All transliteration, translation, speech work is unwritten |
| `.AI-Agents/` | markdown-only — orchestrator design notes, no code | Convert to real provider clients when wiring begins |
| Tests | none | See §11 |

The implementation path is codified in [`.claude/skills/wire-provider/SKILL.md`](../.claude/skills/wire-provider/SKILL.md).

---

## 3. Goals & non-goals (MVP)

### In scope (v0)
- Auto-detect input type (English / Romaji / Japanese / Audio).
- Produce the canonical 5-field JSON in §4.
- Deterministic, reversible orthographic conversion where practical.
- Browser TTS for audio output.
- Add the missing **kana** card to the UI; reorder so kana sits beside the Japanese card.

### Out of scope (defer)
- Offline speech transcription (whisper.cpp).
- Backend TTS providers (Polly / Azure).
- Pronunciation scoring, pitch-accent visualization, shadowing — all under §13.
- Multi-region scaling, auth, persistence.

---

## 4. Data contract

Canonical response from `/api/translate`:

```ts
type Translation = {
  english: string;              // English rendering
  japanese: string;             // Hyōjungo, kanji+kana mixed where natural
  kana: string;                 // hiragana/katakana ONLY — no kanji
  romaji: string;               // Hepburn by default
  audioUrl?: string;            // optional; absent when client-side TTS handles playback
  meta: {
    detected: "english" | "romaji" | "japanese" | "audio";
    confidence: number;         // 0..1; if < 0.7, UI shows "ambiguous — review"
    provider: string;           // e.g. "claude-opus-4-7", "deepl", "kuroshiro"
    cached: boolean;            // hit on Next.js unstable_cache
  };
};
```

Validation rules:
- `japanese` must be Hyōjungo (no slang unless requested via a future mode flag).
- `kana` must contain hiragana/katakana only — reject kanji.
- `romaji` Hepburn by default. Kunrei is a future opt-in (see §13).
- `meta.confidence < 0.7` → client must surface alternatives, not just the top result.

---

## 5. API surface (Next.js App Router)

```
POST /api/translate
  body: { input: string | null, audioBase64?: string, options?: { romajiStyle?: "hepburn"|"kunrei" } }
  returns: Translation  (see §4)

GET /api/health
  returns: { ok: true, version: string }
```

Implementation notes:
- Route handlers live in `app/api/<name>/route.ts`.
- Wrap the provider call in `unstable_cache` keyed on `(provider, model, normalizedInput, options)`. Default `revalidate: 60 * 60 * 24`.
- Normalize input via `.normalize("NFKC").trim()` before keying so full-width vs. half-width punctuation does not split the cache.
- For Claude calls, mark the static system prompt + glossary with `cache_control: { type: "ephemeral" }`. Keep the cached prefix byte-stable.

---

## 6. Detection & normalization

Detection priority (top match wins):
1. `audioBase64` present → audio path (transcribe with Whisper, restart pipeline on the transcript).
2. Any character in `぀-ヿ` (hiragana/katakana) or `一-鿿` (kanji) → Japanese.
3. ASCII-only + matches one of the romaji syllable patterns (`desu`, `ka`, `wa`, `tsu`, `shi`, `kyou`, `ryou`, long-vowel doubles `ou/aa/ee/ii`, sokuon `tt/kk/pp/ss`) → Romaji.
4. Otherwise → English.

Normalization:
- Trim, NFKC-normalize, collapse repeated whitespace.
- Convert full-width ASCII to half-width.
- For Japanese: tokenize with Kuromoji, then canonicalize readings with Kuroshiro.

Edge cases the v0 must handle:
- **Mixed-language inputs** (e.g. "I went to Shibuya 駅"): detect dominant script and return best-effort conversions; flag `meta.confidence` low.
- **Ambiguous Romaji** (e.g. `koukou` could be 高校 or 後攻): return top candidate, expose alternatives via a separate `candidates: string[]` field on the kana/japanese branches when confidence is low.

---

## 7. Pipeline

```
INPUT
  │
  ├─ if audioBase64 → Whisper → transcript
  │
  ▼
Normalize (NFKC, trim, fullwidth→halfwidth)
  │
  ▼
Detect input type ─────────► meta.detected
  │
  ▼
Generate canonical Japanese (translation engine if needed)
  │
  ▼
Derive english / kana / romaji  (Kuroshiro + Kuromoji)
  │
  ▼
TTS (browser speechSynthesis for v0, server-side later)
  │
  ▼
Cache (unstable_cache) → return Translation
```

---

## 8. Stack — pin to what's installed

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16.2.6 (App Router) + React 19.2** — already in [`package.json`](../package.json) | App Router is required; see [`AGENTS.md`](../AGENTS.md) for the breaking-change warning |
| Language | TypeScript 5 | Already configured |
| Styling | Tailwind v4 + `tw-animate-css` | Already installed |
| UI primitives | shadcn/ui (Radix-based) | Full kit already vendored under [`components/ui/`](../components/ui/) |
| Transliteration | **Kuroshiro** + **Kuromoji.js** | Best-in-class JS option for kana/romaji/furigana; no API cost |
| Translation | **Claude (Anthropic)** primary, **DeepL** fallback | Claude already in the env via `CLAUDE_API_KEY`; DeepL produces better Japanese than most general models for short phrases |
| Speech-to-text | OpenAI Whisper API | `OPENAI_API_KEY` already in env |
| Text-to-speech | `window.speechSynthesis` (v0) → Polly/Azure (v1+) | Zero backend work for v0 |

Do not introduce Redux/RTK Query — server-side `unstable_cache` covers deduplication, and a single-page form does not need a global store.

---

## 9. UI layout

Current UI is 4 cards; v0 spec is 5 cards. Target layout:

```
┌────────────────────────────────────────────────┐
│ Input area (textarea + mic button)              │
└────────────────────────────────────────────────┘
┌───────────┬───────────┬───────────┬───────────┐
│ English   │ Japanese  │ Kana      │ Romaji    │
│ EN        │ 日 (Hyo)  │ かな      │ Aa (Hep)  │
└───────────┴───────────┴───────────┴───────────┘
                  Audio playback row (single, full-width)
```

Mobile (sm and below): cards stack vertically; audio button sticks to bottom.

UI behaviors:
- Per-card copy button (already implemented for Japanese/Romaji — extend to kana).
- Loading skeleton on each card while the request is in flight; do not blank existing content.
- If `meta.confidence < 0.7`, render a yellow "ambiguous — review alternatives" pill on the affected card.
- Dark mode via `next-themes` (already installed).

---

## 10. Acceptance criteria (v0)

1. User pastes any one of {English, Romaji, Japanese, audio file ≤ 30s} → receives valid `Translation` JSON within 2.5s p95 on cache miss, <300ms on hit.
2. `kana` field is always present and contains zero kanji codepoints.
3. `romaji` follows Hepburn and round-trips: `romajiOf(kanaOf(romaji)) === romaji` for a fixture set of 200 syllables.
4. Browser TTS plays the Japanese output via a single "Play" button.
5. Reload preserves the last input via `localStorage` (so refreshes don't lose work).

---

## 11. Testing plan

| Layer | Tool | Coverage target |
|---|---|---|
| Unit | Vitest | Detection heuristics, NFKC normalization, Kuroshiro wrappers, romaji round-trip fixtures (≥ 200 cases) |
| Integration | Vitest + msw | `/api/translate` happy path for each input type, cache-hit vs. miss |
| E2E | Playwright | Real browser: type each input type, assert all four cards populate; mock audio upload |

Fixture data lives in `lib/__fixtures__/` (create when adding tests). Start the test corpus with the 50 most-common JLPT N5 phrases for repeatability.

---

## 12. Non-functional concerns

### Accessibility
- Keyboard access for all buttons (Tab → Mic → Cards → Play).
- `aria-live="polite"` on the output region so screen readers announce results.
- Color contrast on the "ambiguous" pill must pass WCAG AA.

### Performance
- Lazy-load Kuromoji (dictionary is ~12 MB) on first Japanese input, not on page load.
- Stream TTS where the platform supports it; otherwise short audio chunks.
- Avoid re-fetching on identical input — the `unstable_cache` key handles this, but also debounce the client by 300-500ms.

### Security & privacy
- Never store raw audio without explicit consent.
- API keys live in `japanese-translator/.env.local` (gitignored), copied from the workspace-root `.env.local` (see `[reference_env_local]` memory).
- Surface a one-line privacy notice when audio upload is used.

---

## 13. Future features (post-v0)

Single consolidated list — implementation order is the user's call, not a sequence dependency.

| # | Feature | Notes |
|---|---|---|
| 1 | Romaji auto-correction | `konichiwa` → `konnichiwa` → こんにちは |
| 2 | Casual ↔ Standard mode | `omae nani shiteru` → お前、何してる？ AND あなたは何をしていますか？ with politeness tags |
| 3 | Furigana overlays | 日本語 / にほんご / nihongo stacked |
| 4 | Accent-aware audio | Tokyo-standard pitch accent |
| 5 | Pitch-accent visualization | Inline pitch curves over kana |
| 6 | Shadowing practice | Loop, slow playback, A/B compare |
| 7 | Pronunciation scoring | Whisper-based phoneme matching |
| 8 | JLPT tagging | N5–N1 per vocabulary item |
| 9 | AI explanation layer | Grammar, nuance, politeness, gendered speech |
| 10 | Offline mode | whisper.cpp + local TTS + local translation |
| 11 | Kunrei romaji option | Toggle in settings; default stays Hepburn |

---

## 14. Open questions

1. **Romaji standard** — confirmed Hepburn for v0. Kunrei behind a setting (see #11).
2. **Kanji disambiguation** — v0 shows top candidate only, with `candidates` array on the response for the UI to surface alternatives when confidence is low. Full disambiguation UI is post-v0.
3. **Audio storage** — v0 generates audio client-side via `speechSynthesis`; nothing is uploaded or stored. Re-evaluate when backend TTS lands.
4. **Provider routing strategy** — single provider (Claude) for translation in v0. Multi-provider routing per `.AI-Agents/orchestrator.md` is post-v0; treat the markdown there as design notes, not contract.

---

## 15. Next concrete steps

In order — each step is one branch (`<type>/<topic>` per the repo convention):

1. **`feat/translate-api`** — Add `app/api/translate/route.ts` with Claude wired up; wrap in `unstable_cache`. See [`.claude/skills/wire-provider/SKILL.md`](../.claude/skills/wire-provider/SKILL.md).
2. **`feat/kana-card`** — Add the missing 5th output card to `components/translator.tsx`. Hardcode kana for now; comes from the API in step 4.
3. **`feat/transliteration`** — Install Kuroshiro + Kuromoji, write `lib/transliteration.ts` with `toKana`, `toRomaji`, `detectInputType`. Add unit tests.
4. **`feat/translator-client`** — Replace the hardcoded `translations` object in `translator.tsx` with a debounced fetch to `/api/translate`. Add loading skeletons.
5. **`feat/browser-tts`** — Wire the Audio card's Play button to `speechSynthesis.speak()` with the Japanese output.
6. **`feat/whisper-input`** — Activate the mic button. Capture audio, send to `/api/translate` with `audioBase64`.

Estimate: each step is 2-6 hours of focused work, ~3 days end-to-end for v0.

---

## 16. Positioning

Do **not** market this as a translator. The product names in current docs ("Japanese Translator") undersell it. Better framing:

- **Japanese speech mapper**
- **Japanese pronunciation bridge**
- **Romaji-to-real-Japanese assistant**
- **Japanese speech companion**

Move the README's `title` and `description` metadata to match. Currently `app/layout.tsx` still has `"Create Next App"` as the title — fix as part of step 1.

---

## 17. Closest existing apps

| App | What overlaps | What we'd do differently |
|---|---|---|
| Perapera | Furigana + reading helper | Add full bidirectional translation + audio |
| TabiTalk | Phrasebook-style audio | Generative coverage, not curated phrases |
| VoiceTra | Speech in/out | Show kana + romaji simultaneously (VoiceTra hides them) |
| Takoboto | Dictionary | We are sentence-level, not word-level |

The clean unified workflow over {English, Romaji, Japanese, Audio} remains an open niche.
