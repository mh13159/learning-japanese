---
name: docs
description: Keep project documentation in sync after code or workflow changes. Use when the user asks to "update the docs", "write a changelog entry", or after a meaningful change has landed (new feature, new tool installed, new convention). Skips repo state derivable from `git log` — focuses on README, CHANGELOG, CLAUDE.md, .claude/CLAUDE.md, and AGENTS.md.
---

# Project documentation sweep

Update the human-facing docs so they match reality. The repo has several doc files with overlapping purposes — this skill knows which one to touch for which kind of change.

## Where each kind of update belongs

| Change | File |
|--------|------|
| User-facing setup, run, or deploy step | [README.md](../../../README.md) — "Quick Start" or "How It Works" |
| Release notes / what shipped | [CHANGELOG.md](../../../CHANGELOG.md) under a new dated heading |
| How Claude Code should behave in this repo (any session) | [CLAUDE.md](../../../CLAUDE.md) (project root) |
| Project-specific Claude conventions, token-saving, prompt-cache notes | [.claude/CLAUDE.md](../../CLAUDE.md) |
| Framework-version warnings or breaking-change notes | [AGENTS.md](../../../AGENTS.md) |
| Contributor / branching / commit rules | [CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| Security policy, API key handling | [SECURITY.md](../../../SECURITY.md) |
| AI agent orchestration design notes | [.AI-Agents/](../../../.AI-Agents/) — pick the right provider subfolder |

## Steps

1. **Identify the change.** Read the most recent commit messages (`rtk git log --oneline -10`) and the current diff. If the change is purely internal refactor with no behavior change, often *no* docs update is needed — stop and say so.
2. **Pick the file(s).** Use the table above. A single change usually touches 1-2 files, rarely more.
3. **Write the why, not the what.** The diff already shows what changed; the doc explains the motivation, the user impact, and any new commands or env vars.
4. **Update CHANGELOG with an absolute date.** Use today's date in `YYYY-MM-DD` format under a new heading. Don't say "recent" or "above" — the next change will displace it.
5. **Don't duplicate.** If README already covers something, link to it from CHANGELOG instead of restating.
6. **Cross-check pointers.** If you added a new convention to `.claude/CLAUDE.md`, make sure the top-of-file `@.claude/CLAUDE.md` import is still present in the project root `CLAUDE.md`. Same for `@AGENTS.md`.
7. **Verify rendering.** README and CHANGELOG render on GitHub — confirm code blocks, tables, and relative links resolve. Don't link to `e:\...` Windows paths.

## Don't

- Don't create new `.md` files unless the user asks. Prefer editing existing ones.
- Don't write release notes for unreleased / unmerged work — wait until it's on `main`.
- Don't restate the `.AI-Agents/` README claims about multi-provider orchestration in user-facing docs until that code actually exists (currently all four provider folders are markdown-only).
- Don't add emojis unless the existing file uses them.
