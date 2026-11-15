# Build status

Claude Code updates this file at the end of each working session. The planning chat reads it.

## Last session (2026-11-15)

Read the handover documents and the current game. No code written. Proposed how to start Phase 1 (below) and added open questions 8 to 14 to `decisions.md`.

Found while reading: the repository has no tests. The spec says the generators are "already tested by brute force", but that check is not in the repo, so the first work package recreates it.

## Proposed start (waiting for Philipp's go-ahead)

1. Pull request 1: scaffold `app/` (TypeScript, Vite, Svelte, Vitest, Playwright, lint, CI on pull requests). No backend yet.
2. Pull request 2: a brute-force check of the generators as they are in `index.html` today, as the reference the port must match.
3. Then port: shared pieces first (generators with a seedable random source, blocks and the other representations, audio player), then the eleven games in path order, one small pull request each.

Accounts, the skill map and the adaptive engine follow; they wait on questions 1, 8, 12 and 13.

## Half done

Nothing.

## Needs a decision

- Question 2 (stack) blocks everything. Only the front-end half is needed to start: TypeScript, Vite, Svelte.
- Question 10 (where the new app deploys) blocks deploy previews.
- Questions 8, 9, 11 to 14 block later work packages, not the start.
