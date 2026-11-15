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
