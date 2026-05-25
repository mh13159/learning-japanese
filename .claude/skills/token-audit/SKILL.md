---
name: token-audit
description: Inspect RTK token-savings so far and suggest filter improvements. Use when the user asks "how much have we saved", "show token stats", "audit my rtk usage", or after a long session to confirm the proxy is actually compressing output.
---

# Token audit

Run RTK's introspection commands and surface opportunities the user has missed.

## Steps

1. **Show cumulative savings.** Run `rtk gain` to print the savings summary. Capture the total reduction percentage and the top 5 commands by tokens saved.
2. **Show command history with savings.** Run `rtk gain --history` and look for any command that scored < 30% reduction. Those are candidates for a custom filter rule in [`.rtk/filters.toml`](../../../.rtk/filters.toml).
3. **Discover missed opportunities.** Run `rtk discover` — it scans recent Claude Code transcripts for raw commands that should have been `rtk`-prefixed. Report each one with the suggested rewrite.
4. **Sanity-check the hook.** If `rtk gain` shows nothing for the current session, the global hook may be inactive. Confirm `~/.claude/settings.json` contains the PreToolUse entry installed by `rtk init -g` and that Claude Code was restarted after install.
5. **Summarize.** End with one line: total tokens saved, top filter wins, and a concrete next step (e.g. "add a filter for `mysql` queries — currently passing through raw").

## Don't

- Don't run `rtk init --uninstall` as part of this audit. That removes the hook.
- Don't claim savings as your own work — `rtk gain`'s numbers are the source of truth; just relay them.
