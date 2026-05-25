---
name: wire-provider
description: Replace the mock `translations` object in components/translator.tsx with a real AI-provider call routed through a Next.js API route. Use when the user asks to "wire up Claude/OpenAI/Gemini/NVIDIA", "make the translator actually translate", or "implement the orchestrator".
---

# Wire a real translation provider

The translator at [components/translator.tsx](../../../components/translator.tsx) currently returns three hardcoded strings. This skill replaces that with a real provider call routed through an App Router API route, with caching and the right token-saving primitives.

## Steps

1. **Pick the provider.** Read the user's intent. Defaults: Claude for nuanced translation, Gemini Flash for cheap/fast, NVIDIA for free-tier experiments. Confirm before installing an SDK.
2. **Install the SDK.** For Claude: `rtk npm install @anthropic-ai/sdk`. For OpenAI: `rtk npm install openai`. For Gemini: `rtk npm install @google/generative-ai`. The placeholder `@nvidia-ai/sdk: latest` in `package.json` is not a real package — remove or replace it before any install resolves.
3. **Create the API route.** Add `app/api/translate/route.ts` with a `POST` handler that takes `{ text: string }`. Read the provider key from `process.env.<PROVIDER>_API_KEY` — those names match the workspace-root `.env.local`. Copy the keys into `japanese-translator/.env.local` (a separate file inside the repo, gitignored) so Next.js can load them.
4. **Apply token-saving primitives.**
   - Wrap the provider call in `unstable_cache` keyed on `(provider, model, normalizedInput)`. Default `revalidate: 60 * 60 * 24`. Normalize input with `.normalize("NFKC").trim()` before keying.
   - For Claude: mark the system prompt + glossary block with `cache_control: { type: "ephemeral" }`. Keep that prefix byte-stable across requests.
   - Return both `english`, `japanese`, and `romaji` in one response so the UI only makes one call.
5. **Update the client.** In [components/translator.tsx](../../../components/translator.tsx), replace the hardcoded `translations` object with a `useState` that gets populated by a `fetch('/api/translate', { method: 'POST', body: JSON.stringify({ text: inputText }) })` triggered by a debounced effect on `inputText` (300-500ms). Show a loading state in the four cards while the request is in flight.
6. **Wire the mic and audio buttons** only if the user asks. Out of scope by default.
7. **Verify.** Run `rtk npm run dev`, open http://localhost:3000, type one English sentence and one Japanese sentence, confirm all three output cards populate. Run the `verify` skill if more thorough testing is needed.
8. **Update the README's "How It Works" section** so it reflects the real flow, not the agentic-framework aspirational version.

## Watch out for

- Don't claim multi-provider orchestration is built unless the user explicitly asks for it. Wire one provider first, refactor later.
- Don't commit `japanese-translator/.env.local` — `.gitignore` covers it but verify with `rtk git status` before committing.
- Don't add Redux/RTK Query unless the user asks. Server-side `unstable_cache` already handles deduplication; client-side state is overkill for a single-page form.
