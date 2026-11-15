# Decisions and open questions

Newest first. The planning chat adds decisions here; Claude Code adds open questions.

## Decided

Rows marked "proposed" are recommendations from the planning chat that Philipp has not yet confirmed.

| Date | Decision | Why |
|---|---|---|
| 2026-11-15 | No computer voice in the new app. If the voice pack fails to load, the app stays silent and shows a retry button | Philipp. All speech comes from recorded clips |
| 2026-11-15 | From High Five on, every game pull request must be playable on the deploy preview of the new site | Philipp reviews by playing |
| 2026-11-15 | Fonts: Fredoka and Andika ship with the app. No request to Google Fonts | Philipp. No third-party request from a child's device; works offline |
| 2026-11-15 | Voice v2 scope: instructions and feedback are recorded as whole sentences; equations stay stitched from number clips. Nothing is recorded now (closes question 9) | Philipp, after the count: 9,269 equation sentences against 702 clips today |
| 2026-11-15 | The source files under `app/` stay reachable on the family site at `/app/...` | Philipp. Harmless: source only |
| 2026-11-15 | Philipp creates the second Netlify site himself, with base directory `app` | |
| 2026-11-15 | Front-end stack confirmed: TypeScript, React, Vite, Vitest, Playwright. Not Svelte. Keep the bundle lean anyway | Philipp: ecosystem and handover matter more than bundle size here |
| 2026-11-15 | The rating sits above the bones rule. Bones pick the level inside a game, exactly as today; the rating decides mastery, unlocks and what gets repeated (answers question 8) | Philipp |
| 2026-11-15 | Whole-sentence equations: count them per game and report in `status.md`. Record nothing yet (answers question 9) | Philipp; the size decides the approach |
| 2026-11-15 | The new app deploys to a second Netlify site built from `app/`. The existing site and link stay untouched. The planning chat creates the site once the scaffold pull request exists (answers question 10) | Philipp; the family link must not break |
| 2026-11-15 | The first child's existing progress is imported into her profile. The second site is a different origin and cannot read the old localStorage, so Claude Code proposes a transfer mechanism at work package 5 (answers question 11) | Philipp |
| 2026-11-15 | Parent sign-in is by emailed link, no passwords. The Supabase region is decided at work package 5 (answers question 12) | Philipp |
| 2026-11-15 | Claude Code writes no curriculum content. It writes `docs/game-skills.md`: per game and level, the skill practised and the number range, in plain words. The planning chat builds the skill map from that (answers question 13) | Philipp |
| 2026-11-15 | The port keeps the 702 current clips behind sentence ids; the rewrite and re-recording swap in later (answers question 14) | Philipp |
| 2026-11-15 | Tests come first: a reference check of the generators in `index.html` before anything is ported | Philipp; the repository had no tests |
| 2026-11-15 | Build order: pull request 1 scaffold, pull request 2 reference check, then shared pieces, then the games in path order, one small pull request each | Philipp |
| 2026-11-15 | Strategy stays in the planning chat; Claude Code implements and builds | Keeps product decisions in one place |
| 2026-11-15 | First scope: the Number strand of Cambridge Primary Stages 1 and 2 | Confirmed by Philipp. Covers the first user's level and the foundations below it |
| 2026-11-15 | Phase 1 is a pilot for families (5 to 10), built so it can be sold later: accounts now, no payments yet | Confirmed by Philipp |
| 2026-11-15 | Stack: installable web app (PWA) in TypeScript with React and Vite; Supabase for accounts and data; Netlify hosting with deploy previews; Vitest and Playwright for tests | Philipp delegated the choice. React for the largest ecosystem and the easiest handover to other developers later |
| 2026-11-15 | Claude Code runs as a cloud session on the GitHub repo; results are reviewed through Netlify deploy previews | Philipp's choice, nothing installed locally |
| 2026-11-15 | Hugging Face free tier is not the base for images or animation | Free credits are close to zero and the app should not generate assets while a child plays; assets are made once and shipped |
| 2026-11-15 | Voice is pre-recorded, not browser speech | Browser voices sounded robotic and differ per device |
| 2026-11-15 | Current voice: Kokoro `af_heart` (American, warm) | Picked by Philipp from four samples |
| 2026-11-15 | Next voice step: rewrite the script in warmer, fuller sentences and record every sentence whole with a directable engine. Decided (Philipp delegated the call). Equation sentences are the exception until the clip count is known: see the open question on whole-sentence equations | Terse wording and stitching are what still sound robotic |
| 2026-11-15 | Hosting moves from Netlify to Cloudflare for both the live game and the new app | Netlify's free plan charges 15 credits per production deploy from a pool of 300 a month shared with Philipp's other sites; Cloudflare has no per-deploy cost and allows commercial use |
| 2026-11-15 | Skill map for Stages 1 and 2 Number drafted from the published framework: `docs/skill-map.md`. Fill the Ten and Break a Ten go beyond Stage 2 and stay as stretch games. Money starts with Kenyan shillings, as a setting | Philipp delegated the call |
| 2026-11-15 | "Do everything" is enforced by gates plus earned free play, not a full lock. Decided (Philipp delegated the call): the daily path must be finished before free play opens, and free play time is earned by it | Pure compulsion works against motivation |
| 2026-11-15 | Rewards grow with mastery, not with minutes played. Decided (Philipp delegated the call) | Avoids rewarding time on easy games |
| 2026-11-14 | Levelling: 5 or 6 bones of 6 moves up, a perfect round skips a level, 2 or fewer moves down, two good rounds at the last level finish a game, two misses in warm-ups bring it back | Judgement call, to be tuned with real use |
| 2026-11-14 | No visible timer; timed practice only after accuracy (Quick Paws unlocks late) | Research on fluency |
| 2026-11-14 | Code on GitHub (`CyberPhil254/tens-and-ones-games`), deployed by Netlify from `main` | |

## Open questions (need Philipp)

1. Monetisation is parked. Working idea, not decided: school licences first (per pupil per year, teacher dashboard), family subscription second, no ads and no selling to children.
2. Skill map for Stages 1 and 2 Number: the planning chat drafts it; Philipp supplies or confirms against the official framework document. Until it lands, port the existing games and do not invent curriculum content.
3. Voice engine for version 2 of the voice: choose from samples (OpenAI gpt-4o-mini-tts, ElevenLabs v3, Gemini TTS) or a human voice actor. Needs an account and API key from Philipp.
4. Mascot: keep the current puppy drawing, generate a new consistent character, or commission an illustrator. Should the puppy be named after and look like the family dog?
5. App name and positioning. Wording near "Cambridge" needs a legal check.
6. The repository is public. Should it be private if this becomes a product?
7. Budget and timeline for a pilot with 5 to 10 families.
Questions 8 to 14 were raised by Claude Code on 15 November 2026 and answered by Philipp the same day; the answers are rows in the table above. What is still open from them:

8. Answered: the rating sits above the bones rule.
9. Answered: record nothing. Equations stay stitched from number clips; only instructions and feedback become whole sentences in voice v2.
10. Answered: a second Netlify site built from `app/`.
11. Answered: import the existing progress. Open: the transfer mechanism between the two sites, to be proposed by Claude Code at work package 5.
12. Answered: emailed link. Open: the Supabase region, decided at work package 5.
13. Answered: Claude Code writes `docs/game-skills.md`, not curriculum content.
14. Answered: keep the 702 clips behind sentence ids.
