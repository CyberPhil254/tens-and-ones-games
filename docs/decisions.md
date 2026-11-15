# Decisions and open questions

Newest first. The planning chat adds decisions here; Claude Code adds open questions.

## Decided

Rows marked "proposed" are recommendations from the planning chat that Philipp has not yet confirmed.

| Date | Decision | Why |
|---|---|---|
| 2026-11-15 | Strategy stays in the planning chat; Claude Code implements and builds | Keeps product decisions in one place |
| 2026-11-15 | First scope: the Number strand of Cambridge Primary Stages 1 and 2 | Confirmed by Philipp. Covers the first user's level and the foundations below it |
| 2026-11-15 | Phase 1 is a pilot for families (5 to 10), built so it can be sold later: accounts now, no payments yet | Confirmed by Philipp |
| 2026-11-15 | Stack: installable web app (PWA) in TypeScript with React and Vite; Supabase for accounts and data; Netlify hosting with deploy previews; Vitest and Playwright for tests | Philipp delegated the choice. React for the largest ecosystem and the easiest handover to other developers later |
| 2026-11-15 | Claude Code runs as a cloud session on the GitHub repo; results are reviewed through Netlify deploy previews | Philipp's choice, nothing installed locally |
| 2026-11-15 | Hugging Face free tier is not the base for images or animation | Free credits are close to zero and the app should not generate assets while a child plays; assets are made once and shipped |
| 2026-11-15 | Voice is pre-recorded, not browser speech | Browser voices sounded robotic and differ per device |
| 2026-11-15 | Current voice: Kokoro `af_heart` (American, warm) | Picked by Philipp from four samples |
| 2026-11-15 | Next voice step: rewrite the script in warmer, fuller sentences and record every sentence whole with a directable engine. Decided (Philipp delegated the call). Equation sentences are the exception until the clip count is known: see the open question on whole-sentence equations | Terse wording and stitching are what still sound robotic |
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
