# Full build: Number, Stages 1 and 2

Status: decided by Philipp and the planning chat on 15 November 2026. This replaces `phase-1-spec.md` as the thing to build. Where the two disagree, this file wins.

Read with it: `skill-map.md` (the skills and their prerequisites), `game-skills.md` (what the existing games ask), `research.md` (the evidence), `art/README.md` (the pictures).

## The six goals

1. **Structured like the curriculum.** Stage, unit, lesson, step: a parent can find what the class is doing this week.
2. **Built on learning research.** Every concept has a clear picture, and each lesson moves from the picture to the bare numbers.
3. **A game.** One journey through lessons that build on each other, with Oreo.
4. **Smart, and not skippable.** The app tracks what the child can do and decides what comes next. The child cannot avoid what she finds hard.
5. **Says why.** Each lesson tells the parent in two sentences why it is built this way, with the source.
6. **Calm and beautiful.** Friendly to a six year old, with nothing on screen that competes with the maths.

## Done means

- Every skill in `skill-map.md` for Stages 1 and 2 has a playable lesson with all its steps, a wrong-answer explanation for every question type, a parent note, and its sentences recorded.
- A simulated child who answers correctly can go from an empty profile to the end of Stage 2, and one who answers at about 60 percent is held back, given easier steps and review, and never gets stuck with nothing to do.
- All checks in "Checks for every lesson" pass.
- The live game at the repository root is untouched and still works.

## 1. Structure

**Stage** (school year) → **Unit** (a topic) → **Lesson** (one skill from the skill map) → **Step** (how abstract it is).

Unit names are ours. Do not use the framework's wording, its logo or the word "endorsed". The skill ids are those of `skill-map.md`.

### Stage 1: numbers to 20

| Unit | Lessons (skill ids) |
|---|---|
| 1. Counting | s1-count, s1-see, s1-zero, s1-estimate |
| 2. Numbers to 20 | s1-names, s1-teens, s1-compare, s1-ordinal |
| 3. Patterns and steps | s1-pattern, s1-skip, s1-oddeven |
| 4. Adding and taking away to 20 | s1-add, s1-sub, s1-ten, s1-doubles, s1-calc20 |
| 5. Halves | s1-half |
| 6. Money | s1-money |

### Stage 2: numbers to 100

| Unit | Lessons (skill ids) |
|---|---|
| 1. Tens and ones | s2-count, s2-place, s2-names, s2-regroup |
| 2. Numbers on the line | s2-see, s2-estimate, s2-compare, s2-ordinal, s2-round |
| 3. Counting in steps | s2-skip, s2-oddeven, s2-sequence |
| 4. Adding and taking away to 100 | s2-bonds, s2-inverse, s2-calc |
| 5. Equal groups | s2-times, s2-tables, s2-divide |
| 6. Quarters | s2-quarter |
| 7. Money | s2-money |
| Stretch: across a ten | Fill the Ten, Break a Ten level 3 and above, Puppy Walk level 3 |

Word problems (Puppy Stories) are not a unit. Each story belongs to the lesson whose skill it uses and is that lesson's last step.

### Steps inside every lesson

| Step | What the child sees | Answer by |
|---|---|---|
| 1. See it | The full picture (blocks, frames, line), always shown | Tapping the picture or one of a few choices |
| 2. Sketch it | A simpler drawing of the same picture | Choices |
| 3. In your head | Numbers only. The picture comes back as a hint | Number pad |
| 4. Use it | A short story or a mixed question | Number pad or choices |

Not every lesson needs all four, but every lesson ends without the picture. The same picture is used for the same idea everywhere: blocks for tens and ones, ten frames for numbers to 20, the number line for position and size, the hundred square for steps, the bar for whole and parts.

The number pad matters: recalling an answer teaches more than recognising it among choices, and it stops guessing. Use it from step 3 on.

## 2. The lessons

`skill-map.md` says which existing game covers which skill. The existing eleven games, Race to 100, Quick Paws and the number machine are ported first, with their behaviour unchanged, and become lessons or parts of lessons.

Additions to existing games:

- **High Five:** a level with arrangements the child has not seen (dots scattered, shown briefly) for s2-see.
- **Pack Ten:** numbers 0 to 20 as a Stage 1 range (s1-teens), and "another way" (34 as 2 tens and 14 ones) for s2-regroup.
- **Number Names:** 0 to 20 as a Stage 1 range, and a level where the child hears a number and types it.
- **Friends of Ten:** pairs that make 20, and pairs of tens that make 100.

New lessons. Each needs a design note in its pull request before the code:

| Name | Skills | Picture | What the child does | How a wrong answer is explained |
|---|---|---|---|---|
| Count and guess | s1-count, s1-zero, s1-estimate, s2-estimate | Loose things, then packed in tens | Taps each thing once to count; sees the same amount rearranged; guesses a heap, then checks by packing | The things are counted again one by one, or packed, with the number said |
| Sums to 20 | s1-add, s1-sub, s1-doubles, s1-calc20 | Two ten frames; for taking away through ten, a red ten and blue ones | Adds by filling the ten first (8 + 5: two go across, 10 and 3); takes away through ten step by step (17 − 9: the 7 ones go, 17 − 7 = 10; 2 more to take; the ten breaks, 10 − 2 = 8); doubles as two equal rows | The frame shows the move through ten; the blocks replay the taking away step by step, with both little sums left on the screen |
| Tens and ones sums | s2-calc (adding) | Two numbers in blocks | Adds tens to tens and ones to ones, no new ten (34 + 25) | Tens and ones are added separately on screen |
| Skip and spot | s1-pattern, s1-skip, s1-oddeven, s2-skip, s2-oddeven, s2-sequence | Hundred square and number line | Hops in twos, fives and tens from any number; says what comes next; pairs things up to see odd (one left over) and even | The hops are shown one at a time and counted |
| More or less | s1-compare, s1-ordinal, s2-compare, s2-ordinal, s2-round | Blocks side by side, then the number line | Says which is more, puts three in order, finds the nearer ten, finds "the third" in a queue | Both numbers are placed on the line; tens are compared first |
| Equal groups | s2-times, s2-tables | Plates of bones, then rows and columns | Builds equal groups, turns them into an array, reads it as repeated adding and as "times"; the 1, 2, 5 and 10 tables tied to the hops from Skip and spot | The groups are counted in steps |
| Fair shares | s2-divide | Bones and bowls | Deals bones out one at a time; then makes groups of a size; exact answers only, with 2, 5 and 10 | The dealing is replayed |
| Halves and quarters | s1-half, s2-quarter | Shapes, sets, and a bar from 0 to 1 | Picks the fair cut; finds half and a quarter of a set by sharing; places a quarter, a half, three quarters on the bar; sees two quarters cover a half | The parts are laid over each other, or the set is shared out |
| Money | s1-money, s2-money | Coins and notes drawn in code, labelled with their value | Names a coin's value, makes an amount, says which purse holds more | The coins are swapped for tens and ones blocks |

Money: Kenyan shillings first, behind a currency setting. Check the current coins and notes before building. Draw simple labelled discs and rectangles; do not copy real coin or note designs.

Everything the child counts is drawn in code so the amount is exact. Pictures from `art/` are never counted.

## 3. The engine

### What is recorded

For every answer: skill, step, right first time or not, hint used, response time, time of day. Stored on the device. Response time is never shown to the child and never used until the child is already accurate.

### Rating and mastery

- One rating per skill, updated after every answer from accuracy, and from speed only once accuracy at that step is high. Questions are chosen so the child gets about three in four right.
- A step is passed with 5 of 6 right first time. Two or fewer drops a step. This is the live game's rule and stays.
- A lesson is **mastered** when its last step is passed on two different days. One good session is not mastery.
- A mastered lesson that is failed twice in review is reopened.

### What comes next

- **The path is one fixed order of lessons** for each stage (`PATH_ORDER` in `app/src/engine/curriculum.ts`): Stage 1, then Stage 2, then the stretch lessons, one unit after another. Every lesson stands after the lessons it needs (the "Needs first" column).
- **At most two lessons are open for new learning at any time.** The first is the next stone: the first lesson on the path she has not yet passed at its last step. The second, where the order allows, is one alternative whose own needs are passed: the next such lesson in the same unit, or the first lesson of the unit after when nothing else in the unit is ahead. Everything further on is locked until she gets there.
- A lesson passed once at its last step is a passed stone, not an open one: the path moves on, and today's games bring it back first, on another day, to be mastered.
- **Review comes back on a schedule:** 1, 3, 7, 14 and 30 days after mastery, sooner if it was slow or shaky.
- **New skills are practised on their own first, then mixed.** Review rounds mix questions from different mastered lessons, so the child has to work out which idea is needed.

### Today's games

One session a day, about ten to fifteen minutes, built by the app:

1. **Warm-up:** five mixed questions from lessons due for review.
2. **New:** two rounds of the next lesson on the path.
3. **Stronger:** one round on the weakest or slowest skill.
4. **Finish:** Oreo's reward, then free play opens for the day.

After the session the child may play on, but the app suggests stopping. Short and daily beats long and rare.

### Not skippable, without force

- There is no skip button. Leaving a round counts for nothing.
- The path only moves forward by passing lessons. Free play opens only after today's games, and on the path only for lessons she has already passed at least once, never for a lesson still ahead (the next stone and its alternative included). Race to 100, the number machine and Quick Paws open then too.
- **The child gets to choose, but only between things the app has already decided she will do.** Every option on a choice card is something the engine wants today, so whatever she picks is right. Once or twice a session, not on every screen, and two or three options at most:
  - **Which first?** Two of today's parts, as two cards ("Oreo's bones" or "the number line"). Both get done; she only sets the order.
  - **Which stone?** When two lessons are open at once, she picks one. The other comes next.
  - **Which story?** The same questions dressed differently (bones, balls, stepping stones).
  - **Which reward?** The treasure Oreo gets: one of two, every time.
- There is never an option that means less work, an easier lesson than the engine chose, or no lesson. A choice she makes is always honoured: the app never shows one thing and gives another.
- If the child is struggling, the app lowers the step and gives the picture back. It never repeats the same failed question endlessly.
- Very fast wrong taps in a row are treated as guessing: Oreo says to take a moment, the answers pause briefly, and those answers do not count either way.

### Where to start

On first run the parent picks the stage, and **that stage is where new learning starts**.

- **A Stage 1 child** starts at the first stone. A short check, one question about the first lesson of each Stage 1 unit, marks what she already knows.
- **A Stage 2 child starts at the first Stage 2 lesson**, whatever the check finds, and also when a parent skips it. Every Stage 1 lesson counts as known and comes back in review like anything else that is known.
- **For her the check looks for gaps.** For each Stage 1 lesson that a Stage 2 lesson builds on directly (twelve of them), it asks two questions at the lesson's last step, in two passes so that the same lesson never comes twice running: 24 questions, three to four minutes. A lesson is a gap only if she misses most of what was asked about it, which with two questions means both. One wrong answer changes nothing.
- **A gap is "a quick step back", not a detour through Stage 1.** That one lesson is not marked as known. It stands on her path directly before the first Stage 2 lesson that needs it, and starts one step below its last step, not at step one. The steps below its start were never played and count for nothing.
- A known Stage 1 lesson that review reopens (missed twice) becomes a quick step back in the same way.
- In the garden a Stage 2 child sees the Stage 2 path. Stage 1 is one folded banner, "Year 1: known", that a parent can open.

## 4. The game around it

- **The path** is a garden walk: one stepping stone per lesson, one part of the garden per unit, built in code from `art/props/` so stones can change as lessons are mastered. It is a path, not a field of open stones:
  - The next stone is unmistakable: larger, gently lit, with Oreo standing on it. At most one more stone is open beside it.
  - A locked stone shows a padlock. Tapping it opens nothing: Oreo points at the stone that opens it and says "First finish this one."
  - A passed stone shows how far it has come: its steps as dots that fill, then a paw when the lesson is mastered. A lesson known from the starting check shows a tick and "Known, to be checked in a warm-up.", and after a review has confirmed it "Known, and checked in a warm-up."; the paw is for a lesson learnt here.
- **Oreo** is the guide. Poses and movement follow `art/README.md`: she reacts to answers and is still while the child thinks.
- **Rewards follow what she learns by playing, never minutes, and never more than one comes on one day.** The schedule is data (`app/src/engine/rewards.ts`):
  - The first time she finishes today's games: a welcome treasure, her choice of two.
  - **Paws:** one for every step she passes (each step of a lesson once, the last included) and one for every lesson she masters. Oreo gets a treasure, her choice of two, at every sixth paw for the first six treasures (the 6th, 12th, ... 36th paw), then at every eighth (the 44th, 52nd, ...): nineteen in all.
  - Oreo learns a trick at the 7th, 13th, 20th, 27th, 34th and 40th lesson mastered: one for each of the six tricks.
  - A unit finished (every lesson mastered, at least one of them learnt here): its badge. A stage finished (at least half of it learnt here): the rosette or the trophy; the stretch lessons: the crown.
  - **Only what she learns by playing counts.** A lesson the starting check marked as known counts for nothing: no paws, and not towards a trick, also after a review has confirmed it. If review reopens such a lesson, it counts from the step she plays it at.
  - **One reward a day, handed over when she has finished today's games.** Nothing is handed over in the middle of today's games. If she has earned more than one, the rest wait, and one is given on each of the next days she finishes today's games: a trick first, then a badge, then an award, then a treasure.
  - Nothing is random and nothing can be lost. Bones stay packed in tens.
  - The pace this gives the simulated child who is right three times in four: the welcome treasure on her first day, then a treasure about every 4 days of play in her first month and about every 7 after that, a trick about every three weeks, and 9 days as her longest wait for any reward. See `docs/status.md` for all the simulated children.
- **She sees what she is working towards.** "Oreo's things" on the home screen shows everything there is, earned or not: what is not hers yet is a grey shape, and each row has one plain line saying what earns the next one ("Master 2 more lessons and Oreo learns to spin."). After every round a small row of paws shows how far the next treasure is, with Oreo beside it, so that a day without a reward still shows what she won. When the row is full the line says when the treasure comes: "Finish today's games and Oreo gets a treasure.", or "Finish tomorrow's games ..." if she has had a reward today.
- **Every stone that changes is shown changing** at the end of the round that changed it: its steps fill in, or the paw of a lesson mastered appears, with Oreo's matching animation.
- **Praise names what the child did** ("You filled the ten first"), not what she is ("You are clever").
- No timers, countdowns, lives, leaderboards, streaks that can be lost, surprise prizes or anything bought.

## 5. Why it works

- Every lesson has a parent note: two sentences on why it is built this way, the source, and how strong the evidence is ("strong", "promising", "mixed"). Take them from `research.md`; do not overstate.
- A parents' area behind a simple adult check shows: progress by unit, strong, weak and slow skills, time played this week, the notes, how to help ("Ask: how did you know?"), and settings (sound, stage, currency, start again).
- One page explains the whole approach in plain words and lists the sources.

## 6. Look and feel

- One task per screen. A question screen has a plain background: the garden appears on the home screen and the path only.
- Instructions are spoken, with a button to hear them again. Text on a child's screen is a few words in Andika.
- Buttons a child taps are at least 72 px across (about 2 cm), with space between them. Tap only: anything that can be dragged can also be done by tapping.
- Red and blue mean tens and ones and nothing else. Tens and ones also differ in shape, so colour is not the only cue.
- Movement only as feedback to an answer, and honour the device's reduced-motion setting.
- Phone first, upright, 360 to 430 px wide. Also check a tablet and a laptop.
- Works offline once opened, and installs as an app.

## 7. Voice

- The puppy is **Oreo** everywhere, in writing and in speech. She is female. Record two introductions: a general one, and one that calls her "Star's sister" (Star is the first user's own dog). A switch in the parents' area, off by default, chooses the second.
- Rewrite the script as you go: warm, whole sentences a parent would say, no clipped commands. Instructions and feedback are recorded whole; equations stay stitched from number clips.
- Record every new or changed sentence with the existing pipeline in `tools/voice/` (Kokoro, voice `af_heart`), so nothing in the app is silent. If the model cannot be fetched in your session, build everything, list the missing clips in `status.md`, and carry on.
- Keep the full script in one data file and write `docs/voice-script.md` from it for Philipp to read.
- Load the voice per unit, not as one file.

## 8. Data

- Profiles on the device: a nickname, an animal picture from `art/friends/`, a stage, progress. Several children per device. No email, no free text from a child, no analytics, no third-party requests.
- All storage goes through one interface so accounts and sync can be added later without touching the lessons. Do not build accounts now.
- A parent can save a profile as a code or file and load it on another device.

## 9. Checks for every lesson

- Every question the generator can make has exactly one right answer, and its choices are unique.
- Every question type has an explanation for a wrong answer that shows or says why.
- Played in a browser test at every step with right and wrong answers, at 400 px and laptop width.
- Tagged with its skill id, has its parent note, and every sentence it speaks has a clip or is listed as missing.
- Nothing fetched from another site. No timer visible.

At the end: a test that plays the whole path with a simulated child at 100 percent, about 75 percent and about 60 percent, and checks that gating, review and mastery behave as written here.

## 10. Order of work

1. **Finish the port:** the nine remaining path games, Race to 100, Quick Paws, the number machine. Oreo's name in all text.
2. **Structure and engine:** units, lessons and steps as data from the skill map; rating, mastery, review, today's games, the starting check; profiles and storage.
3. **Path, rewards, parents' area, the notes.**
4. **Stage 2 gaps, foundations first:** Sums to 20, Tens and ones sums, the additions to existing games, More or less, Skip and spot, Equal groups, Fair shares, Halves and quarters, Money.
5. **Stage 1:** Count and guess, the Stage 1 ranges of every lesson, the Stage 1 parts of the shared lessons.
6. **Voice pass, whole-path test, speed and offline, final report.**

The first user is in Stage 2 and missing the foundations in "Sums to 20", which is why that order.
