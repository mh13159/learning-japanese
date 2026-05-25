---
name: new-task-branch
description: Create a fresh feature branch from main for a new task, following this repo's "new branch per task" convention. Use whenever the user starts work that isn't a tiny one-line fix — before the first edit, not after.
---

# New task branch

This repo's convention is **one branch per task**, branched from latest `main`, named `<type>/<kebab-description>`. Apply before any code edit.

## Steps

1. **Confirm clean tree.** Run `rtk git status --short`. If anything is uncommitted, stop and ask the user whether to commit, stash, or discard. Do not silently move work to another branch.
2. **Sync main.** Run `rtk git checkout main && rtk git pull --ff-only origin main`. Refuse to proceed if `--ff-only` fails — that means main has diverged locally and the user needs to resolve it.
3. **Pick a branch name.** Format: `<type>/<short-kebab>` where type is one of `feat`, `fix`, `docs`, `chore`, `refactor`, `test`. Examples: `feat/translator-api`, `fix/mic-recording`, `docs/readme-cleanup`. Default to `feat` when ambiguous (matches `GIT_BRANCH_PREFIX_DEFAULT` in the workspace `.env.local`).
4. **Create + switch.** Run `rtk git checkout -b <branch-name>`.
5. **Confirm.** Run `rtk git branch --show-current` and tell the user the new branch name plus the next concrete action.

## When NOT to use

- Tiny fixes already in-flight on the current branch — don't reflexively branch mid-edit.
- The user explicitly said "commit on this branch."
- Hotfix workflows where main is broken and the convention is suspended.

## Auth reminder

Push credential is the `GITHUB_TOKEN` fine-grained PAT in the workspace-root `.env.local`. It needs **Contents: write** on `mh13159/learning-japanese` — if a push 403s, that permission is the first thing to check.
