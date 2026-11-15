# Product plan

Status: draft, 15 November 2026. Owner: Philipp.

## Goal

Turn the Tens and Ones game into a maths app for primary school children following the Cambridge Primary curriculum. Start with the Number strand of Stages 1 and 2, pilot it with 5 to 10 families, then widen.

## What the app must do (six requirements)

### 1. A voice that sounds like a person talking to a child

The current voice still sounds robotic for three reasons: terse wording ("Do not count."), numbers stitched from separate clips, and the voice engine.

1. Rewrite the script in full, warm sentences a teacher would say.
2. Record every instruction and feedback sentence whole. Equations stay stitched from number clips: recording them whole would mean 9,269 sentences and about six and a half hours of audio, too heavy for phones on mobile data (decided 15 November 2026).
3. Use an engine that can be directed ("warm, playful, speaking to a six year old"): OpenAI gpt-4o-mini-tts, ElevenLabs v3 with audio tags, or Gemini TTS. Choose from samples.
4. Give the puppy a character voice and vary the praise.
5. Fallback: a human voice actor for the core lines.

Pick: 1, 2 and 3 together.

### 2. Better images and animation

Hugging Face's free tier cannot carry this (monthly credits near zero, about five GPU minutes a day), and the app should not generate images while a child plays.

1. One well designed mascot, kept consistent across poses (a tool with character reference and SVG export, such as Recraft, or an illustrator).
2. Animate with Rive: its state machines let the puppy react to right and wrong answers, and the runtime is free to ship.
3. Keep the maths visuals as code (blocks, number lines, ten frames). Precision beats polish there.
4. Commission an illustrator for the mascot and world if budget allows; AI for backgrounds and props.
5. A style guide first: palette, line weight, shapes.

### 3. Accounts

1. A parent account with child profiles. The child has no email or password and picks a picture.
2. Parental consent at sign-up. Kenya's Data Protection Act, section 33, requires a parent's or guardian's consent before a child's data is processed.
3. Collect almost nothing: nickname, stage, progress.
4. A hosted backend for login, sync across devices and backups.
5. Teacher and class codes later.

A short legal review against the Kenyan regulator's guidance note on children's data is needed before a public launch.

### 4. Structure that follows the curriculum

1. Mirror the framework: six stages, three strands (Number; Geometry and Measure; Statistics and Probability), with Thinking and Working Mathematically running through them.
2. A skill map: each learning objective is a node with prerequisites and one or more games.
3. Number in Stages 1 and 2 first, then Stage 3, then the other strands.
4. Parents see the map by stage, strand and objective, and can select the topic the school is on.
5. Naming: say "for learners following the Cambridge Primary curriculum". No logo, no "endorsed" (Cambridge's endorsement scheme excludes digital tools and question banks). Objectives in our own words.

### 5. Explaining why it works

1. A short "why this works" note per game with its source.
2. A parent guide to the method.
3. Honest evidence labels: strong, promising, mixed.
4. Tips for helping at home next to each skill.
5. Our own pilot results, once we have them.

### 6. Smart: a path, tracking and motivation

1. A guided path with gates: the next lesson unlocks when its prerequisites are mastered.
2. Free play is earned: today's required work first, then choice.
3. Track accuracy and response time per skill. Time is never shown to the child. Model: an Elo-style rating as used by Math Garden, aiming for about 75 percent success.
4. Automatic spaced review: weak and slow skills return, strong ones fade out.
5. A puppy that grows with mastery (learns tricks, gets things) rather than with minutes played. Add a parent dashboard showing strong, weak and slow skills.

## Phases

| Phase | What | Rough effort |
|---|---|---|
| 0 | Decide scope, name, stack, voice and art budget; legal check | 1 to 2 weeks |
| 1 | Real app: installable web app, accounts, skill map for Stages 1 and 2 Number, adaptive engine, existing games ported, new voice | 4 to 6 weeks |
| 2 | Mascot and animation, puppy progression, parent dashboard, pilot with 5 to 10 families | 4 to 6 weeks |
| 3 | More stages and strands, teacher mode, payments | ongoing |

Effort figures are rough estimates.

## Risks

- Scope: six stages and three strands is years of content. One stage first.
- Voice and art quality cannot be judged by the builder; Philipp reviews samples.
- Legal: children's data and the Cambridge name.
- The first user is one child. Pilot with more families before trusting any threshold or design choice.
