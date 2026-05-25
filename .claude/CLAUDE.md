# Token-saving conventions for this repo

This file is loaded automatically by Claude Code via `@.claude/CLAUDE.md` at the top of [CLAUDE.md](../CLAUDE.md). It documents project-specific token-saving practices on top of the RTK CLI proxy reference.

## 1. RTK is required for shell commands

- Prefix every shell invocation with `rtk` — including commands inside `&&` / `||` chains.
- If RTK has no dedicated filter, it passes through unchanged. There is no downside to prefixing.
- After install, the global PreToolUse hook in `~/.claude/settings.json` rewrites Bash automatically. Project-local `.rtk/filters.toml` adds repo-specific filter rules — edit it instead of inlining filters in commands.
- Verify with `rtk gain` periodically to see actual savings; if it errors, see the name-collision note in the RTK section of `CLAUDE.md`.

## 2. Tool-call patterns that save tokens

- **Parallel tool calls.** When tool calls are independent (e.g. reading three unrelated files, or grepping two patterns), issue them in a single response. The harness runs them concurrently; sequential calls waste both wall time and per-turn overhead.
- **Targeted reads.** Use the `offset`/`limit` arguments on Read when you only need a section. Re-reading whole files after edits is unnecessary — Edit fails loudly if it didn't apply.
- **Grep / Glob over Bash.** Prefer the dedicated Grep and Glob tools. They are routed through ripgrep with sensible defaults and produce smaller, structured output than `find` / `grep` in a shell.
- **Delegate broad searches to the Explore agent.** When a question would take 4+ greps, spawn `Explore`. Its results come back as a summary, not raw matches, so the main context stays small.

## 3. AI-provider token savings (for when the translator is wired up)

When the orchestrator code in `.AI-Agents/` is replaced with real provider clients, apply these:

### Anthropic prompt caching
- Mark static portions of the system prompt (instruction prelude, glossary, few-shot examples) with `cache_control: { type: "ephemeral" }` breakpoints. Cached blocks cost ~10% of normal input tokens on subsequent calls and stay warm for ~5 minutes.
- Keep the cached prefix **byte-stable** across requests — any drift invalidates the cache. Put dynamic content (the user's Japanese sentence) at the end.
- For long-lived agents, refresh the cache by re-issuing a no-op request within the TTL window rather than paying the full prompt cost on the next user turn.

### Server-side response cache (Next.js)
- Wrap deterministic provider calls in `unstable_cache` keyed on `(provider, model, normalizedInput)`. Identical Japanese inputs should never re-hit a paid endpoint.
- Default `revalidate: 60 * 60 * 24` (24h) for translations; longer for romaji which never changes for a given kanji string.
- Strip whitespace and normalize Unicode (`String.prototype.normalize("NFKC")`) before keying — `カタカナ` vs. full-width spaces must not produce cache misses.

### Provider selection (cost-aware routing)
- Route by task class, not by alphabetical preference. Romaji-only requests should hit the cheapest provider that returns it correctly (NVIDIA / Gemini Flash); free-form translation with cultural nuance should go to Claude or GPT-class models.
- Track per-call cost in the orchestrator response metadata so the cache key can also store $/call — useful for the analytics dashboard the README hints at.

## 4. Conversation-level habits

- Avoid re-listing the directory tree multiple times per session. Once is enough; ask for what you need by name afterwards.
- When iterating on an Edit, don't read the whole file back to confirm — the diff is already shown.
- For multi-file refactors, batch independent Edits rather than running a Read → Edit → Read → Edit cycle per file.

## 5. Where to look

- RTK command reference: [CLAUDE.md](../CLAUDE.md) (the `<!-- rtk-instructions v2 -->` block).
- RTK project-local filters: [.rtk/filters.toml](../.rtk/filters.toml).
- RTK global hook: `~/.claude/settings.json` (managed by `rtk init -g`).
- Branching / push conventions: [CONTRIBUTING.md](../CONTRIBUTING.md) and the workspace-root `.env.local`.
