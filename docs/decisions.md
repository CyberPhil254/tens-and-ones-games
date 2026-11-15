# Decisions and open questions

Newest first. The planning chat adds decisions here; Claude Code adds open questions.

## Decided

Rows marked "proposed" are recommendations from the planning chat that Philipp has not yet confirmed.

| Date | Decision | Why |
|---|---|---|
| 2026-11-15 | Strategy stays in the planning chat; Claude Code implements and builds | Keeps product decisions in one place |
| 2026-11-15 | First scope for the real app: Cambridge Primary Stage 2, Number strand (proposed, Philipp to confirm) | It is where the first user is; one stage done well before widening |
| 2026-11-15 | Hugging Face free tier is not the base for images or animation | Free credits are close to zero and the app should not generate assets while a child plays; assets are made once and shipped |
| 2026-11-15 | Voice is pre-recorded, not browser speech | Browser voices sounded robotic and differ per device |
| 2026-11-15 | Current voice: Kokoro `af_heart` (American, warm) | Picked by Philipp from four samples |
| 2026-11-15 | Next voice step: rewrite the script in warmer, fuller sentences and record every sentence whole (no stitched numbers) with a directable engine (proposed, Philipp to confirm) | Terse wording and stitching are what still sound robotic |
| 2026-11-15 | "Do everything" is enforced by gates plus earned free play, not a full lock (proposed, Philipp to confirm) | Pure compulsion works against motivation |
| 2026-11-15 | Rewards grow with mastery, not with minutes played (proposed, Philipp to confirm) | Avoids rewarding time on easy games |
| 2026-11-14 | Levelling: 5 or 6 bones of 6 moves up, a perfect round skips a level, 2 or fewer moves down, two good rounds at the last level finish a game, two misses in warm-ups bring it back | Judgement call, to be tuned with real use |
| 2026-11-14 | No visible timer; timed practice only after accuracy (Quick Paws unlocks late) | Research on fluency |
| 2026-11-14 | Code on GitHub (`CyberPhil254/tens-and-ones-games`), deployed by Netlify from `main` | |

## Open questions (need Philipp)

1. Is this a product for sale, or a free tool for a few families? It changes accounts, payments, legal work and how much to spend on art and voice.
2. Tech stack for the new app. Proposed in `docs/phase-1-spec.md`; confirm or change before building.
3. Voice engine for version 2 of the voice: choose from samples (OpenAI gpt-4o-mini-tts, ElevenLabs v3, Gemini TTS) or a human voice actor. Needs an account and API key from Philipp.
4. Mascot: keep the current puppy drawing, generate a new consistent character, or commission an illustrator. Should the puppy be named after and look like the family dog?
5. App name and positioning. Wording near "Cambridge" needs a legal check.
6. The repository is public. Should it be private if this becomes a product?
7. Budget and timeline for a pilot with 5 to 10 families.
8. (Claude Code, 2026-11-15) Levelling and the new engine. The current game levels by bones per round (5 or 6 of 6 moves up, and so on). Phase 1 adds an Elo-style rating per skill. Does the rating replace the bones rule, or does the bones rule keep choosing the level inside a game while the rating decides mastery, review and what unlocks?
9. (Claude Code, 2026-11-15) Whole-sentence equations. "No stitched sentence" means one clip per equation that can be asked. Before recording, I will count the distinct sentences per game; if a game runs to several thousand, do we record them all or narrow the number ranges?
10. (Claude Code, 2026-11-15) Where the new app is deployed during the build. The Netlify site publishes the repo root. Options: a second Netlify site built from `app/` (the family link is untouched; Philipp creates the site), or the same site serving the new app under `/app/` (one site, but the build config that serves the family link changes). Recommended: a second site.
11. (Claude Code, 2026-11-15) Existing progress. The first child's progress is in localStorage on her device. Import it into her profile when the new app replaces the old one, or start fresh?
12. (Claude Code, 2026-11-15) Parent sign-in method: emailed link (no password to forget) or email and password? And the Supabase region, which the legal review of children's data may have a view on.
13. (Claude Code, 2026-11-15) Skill map source. The spec says Philipp supplies or confirms the Stage 2 Number mapping. Should I draft skills in our own words from the eleven games for him to map, or wait for his list?
14. (Claude Code, 2026-11-15) Voice v2 timing. The spec lists it last, but the port has to decide how speech is addressed (sentence ids in a data file). Proposed: the port keeps the 702 current clips behind a sentence-id interface, and the rewrite and re-recording swap in later without touching game code. Confirm.
