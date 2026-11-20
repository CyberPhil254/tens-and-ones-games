# Build status: final report

The full build of `docs/build-spec.md` is finished: every line of its "Done means" list is true, with the limits written down below. This file is the report for the planning chat, and still the memory for any further work (after a break: read `CLAUDE.md`, `docs/build-spec.md` and this file).

The new app: https://tens-and-ones-app.philipp-79a.workers.dev. The live game at the repository root was not touched.

## After the first test on a phone (2026-11-16, pull request 48)

Five fixes from Philipp's first test. Nothing is half done and no clips are waiting to be recorded.

1. **Rewards only for what she did herself.** A lesson the starting check marks as known gives no treasure, and does not count towards a trick or an award, until a due review of it is answered right first time. The starting check no longer hands anything out. Profiles that already held rewards from the check lose exactly those when they are next opened; lessons, bones and progress stay. Tests: `app/src/engine/rewards.test.ts` (the check gives nothing; a unit with a known lesson earns its trick only after that lesson is confirmed; old profiles are cleaned, and what was played is kept) and `app/e2e/phone-fixes.spec.ts`.
2. **Tricks have names and do something.** Each trick on the shelf shows its name. Tapped, Oreo says it ("Oreo can beg!") and makes one move that fits, then is still. Six new sentences, recorded with `tools/voice/`. Reduced motion: no move.
3. **Trick pictures fit their frames** at every width (tested from 320 to 1280 px).
4. **The parents' lock explains itself**: "This part is for parents. Answer to open it." above the question, as a plain form without Oreo.
5. **"For parents: why this works"** under every lesson in the garden opens that lesson's note and leads on to the approach page, without the lock.

To confirm (all in `docs/decisions.md`, dated 2026-11-16): what counts as "confirmed in review" (the first due review answered right first time, slow or not); the six trick sentences; the link under every lesson, closed ones too.

Not done, because it was not asked: the home button still says "For grown-ups" while the lock now says "parents".

## Two problems from Philipp's testing (2026-11-20)

Two pull requests: A a Stage 2 child starts in Stage 2 (56), B rewards come too thick (57). This section is updated as each is merged.

### A. A Stage 2 child starts in Stage 2 (pull request 56)

Nothing is half done, and no new sentences.

1. **The stage the parent picks is where new learning starts.** A Stage 2 child's next stone is the first Stage 2 lesson, whatever the check finds and also when it is skipped.
2. **The check looks for gaps properly**: two questions about each of the twelve Stage 1 lessons a Stage 2 lesson builds on, 24 questions. A lesson is a gap only if she misses both. One wrong answer changes nothing.
3. **A gap is a quick step back**: that one lesson stands on her path directly before the Stage 2 lesson that needs it, tagged "A quick step back", and starts one step below its last step.
4. **The garden**: a Stage 2 child sees the Stage 2 path; Stage 1 is one folded banner, "Year 1: known", that a parent can open.
5. **Tests** (`app/src/engine/apply.test.ts`, `app/e2e/path.spec.ts`): everything right starts at the first Stage 2 lesson; a single miss, in any of the twelve lessons or one in each, still starts in Stage 2 with nothing of Stage 1 on her path; a child who misses both questions about "Sums to 20" gets exactly that lesson directly before "Tens and ones sums".
6. **Existing profiles** are placed again by these rules when they are opened; what she earned by playing, her bones and her rewards are untouched.

Found on the way and fixed: a step back handed out a treasure by itself, because the steps it starts above were counted as passed.

To confirm (in `docs/decisions.md`, dated 2026-11-20): the check is 24 questions, which is nearer four minutes than three for a slow child; a step back for a two-step lesson starts at its first step; a Stage 2 child has a warm-up from day one.

## Problems from the test with Philipp's daughter (2026-11-16)

Four pull requests, in this order: A "Start again" (52), B the garden as a path, C rewards early and often, D change name or picture. This section is updated as each is merged.

### A. "Start again" did not reset the profile (pull request 52)

**I could not reproduce it the way it was described.** On one screen, the reset works. What I tried, all as browser tests in `app/e2e/reset.spec.ts`, at 400 px and laptop width:

1. Exactly the described path, played for real: a child is added, the whole starting check is answered, a whole part of today's games is played and bones are earned, then Start again and confirm. Without a reload the starting check is offered again, what is saved is a new profile (same nickname, picture and stage; no lessons, no answers, bones 0, no treasures, tricks or awards), the home screen shows 0 bones, no shelf, today's games not done and a fresh path, today's games start from the first step, and it is still so after a reload. **Passes.**
2. A Stage 2 child far along, with treasures, a trick and today's games finished. **Passes.**
3. Remove, after the same real play: nothing of the child is left on the device, and a child added with the same name is new. **Passes.**
4. Add a child, after the same real play: the new child is new, the first child's saved data is identical before and after, also after the second child is removed. **Passes.**
5. **The app open in a second window on the same device while Start again is pressed in the first. This failed**, and is the only way I found to make the old progress come back: the second window kept the old progress in memory, went on showing it, and its next save (the end of a round, a reward) wrote all of it back over the reset.

**Cause of 5, and the fix.** Each window reads the child's data once and afterwards saves the whole of it from memory. Nothing told a window that the saved data had been changed by another one. Now a window reads what is saved again whenever another window changes it and whenever it comes back into view; if it differs, the window takes it over and returns to the home screen (`app/src/app/useData.ts`).

**What I cannot tell** is whether this is what happened on Philipp's phone. It fits if the app was open twice, for example as the installed app and in a browser tab, or in two tabs. Two things would help: whether the app is installed on the home screen as well as opened in the browser, and whether it is an iPhone. On an iPhone the installed app and Safari keep separate saved data, so a reset in one never reaches the other; that cannot be changed from inside the app, and if it is the cause, the reset has to be done in the one she plays in.

### B. The garden is a path (pull request 53)

Nothing is half done. One new sentence, recorded: "First finish this one."

1. **One fixed order** per stage, as data (`PATH_ORDER`), respecting every prerequisite, units one after another. It is the order the garden already had; a test now holds it.
2. **At most two lessons open for new learning**: the next stone and, where the order allows, one alternative. A new child sees two open stones and 39 padlocks, where she saw a dozen open stones before.
3. **A locked stone** shows a padlock. Tapped, it opens nothing: Oreo points at the stone that opens it and says "First finish this one.", and that stone comes into view.
4. **The next stone** is larger, softly lit, with Oreo on it. **Passed stones** show their steps as dots that fill, then a paw when mastered.
5. **Free play** after today's games is only for stones she has passed at least once.
6. **After the starting check**, what lies before her starting point shows a tick and "Known, to be checked in a warm-up."
- **Test with the simulated children**: after every round of 200 days, for all four children, at most two lessons are open for new learning, and two do stand open at times.

The whole-path results did not change: the engine already gave her the first lessons in path order; what changed is what is open, what is shown and what can be tapped.

To confirm (in `docs/decisions.md`, dated 2026-11-16): the rule for the alternative stone; that a lesson begun earlier and lying further on than the path has got is locked until she reaches it (its progress is kept); that Oreo stands on the next stone also after today's games are done.

### C. Rewards early and often (pull request 54)

Nothing is half done. Three sentences recorded (two new, one changed).

**What she gets now**
- The first time she finishes today's games: a welcome treasure, her choice of two.
- A **paw** for every step she passes and every lesson she masters. A treasure at the 1st, 3rd and 6th paw, then at every third.
- A trick at the 2nd, 5th, 9th, 14th, 20th and 27th lesson mastered.
- A badge for every unit finished, the rosette or trophy for a stage, the crown for the stretch lessons.
- Lessons known from the starting check count only once a review has confirmed them, as before.

**What she sees**
- "Oreo's things" on the home screen shows everything, earned or not; what is not hers yet is a grey shape, and each row has a line saying what earns the next one.
- After every round: a row of paws filling up towards the next treasure, with Oreo beside it.
- The stone that changed is shown changing at the end of the round, with Oreo's matching animation.

**The whole-path test, for the child who is right 3 times in 4** (`app/src/engine/path.test.ts`; days are days of play)

| | As asked (treasures at the 1st, 3rd, 6th, 10th, 15th, 21st lesson passed) | As built (treasures by paws) |
|---|---|---|
| First treasure | day 1 (the welcome treasure) | day 1 |
| First trick | day 4 | day 4 |
| Longest gap between two rewards | 14 days | **6 days** |
| Gaps longer than 5 days | 8 | 2 |
| Rewards on the whole path | 30 | 73 |

**The gap is not 5 or less, and I could not make it so with a schedule.** I changed the schedule as asked, and this is how far it goes:
- Treasures are now counted in paws instead of lessons passed. That is the change I chose.
- I ran the same child ten times with different luck. As asked: the longest gap was 13 to 21 days. As built: 5 to 10, usually 6; in four runs of ten no gap was longer than 5.
- Even a reward for every single step, every lesson passed and every lesson mastered (145 rewards) leaves a gap of 6 in three runs of ten. The cause is not the schedule: this child has stretches of up to 9 days in which she passes nothing new.
- Two things would close it, and both are yours to decide: a reward for something that grows every day whatever she achieves (which rewards minutes, and the spec rules that out), or a change to the engine so that a child at 3 in 4 is not stuck on one step for a week.

The other simulated children: always right, longest gap 2 days; the child who starts at 85 percent and fades with every step, 14 days and seven gaps longer than 5 (she is stuck for longer); the child at 60 percent keeps no lesson mastered and gets 11 rewards in 200 days, four of them in her first week. For her the rewards do not come often, because she achieves little; that is the engine holding her back, as it should, and the reward schedule cannot and should not hide it.

To confirm (in `docs/decisions.md`, dated 2026-11-16): paws instead of lessons passed for treasures; about fifty treasures, several of a kind; one line per row in "Oreo's things" instead of one per grey shape; the unit badge is the paw badge from `art/awards/`.

### D. Change name or picture (pull request 55)

Nothing is half done, and no new sentences.

- In the parents' area, under the child's name: "Change name or picture". The nickname follows the same rules as when a child is added; the picture is one of the same nine.
- Saving changes only those two things. Progress, bones, treasures, tricks, awards and the review schedule stay exactly as they were. The stage is not changed here.
- The new name and picture show at once in the parents' area, on the home screen and in the profile chooser.
- Browser test (`app/e2e/edit-profile.spec.ts`): a child plays a round and earns bones and a treasure, a second child is added, both name and picture are changed, and every other part of the saved profile is compared and is identical before and after; the other child is untouched; Cancel changes nothing; an empty name cannot be saved.

## Oreo's animations (2026-11-16, pull request 51)

Nothing is half done. No new sentences: the tricks use the six recorded in pull request 48.

10. The ten animations in `art/rigs/animations.json` are built in the app with the Web Animations API (`app/src/ui/animate.ts`), from the data. The GIFs are not shipped.
    - **Tail wags**: `wag-happy` after a right answer; `wag-proud` at the end of a round, on the treasure card and beside an award.
    - **The hop** (`hop-celebrating`): at the end of a round with at most one miss, which covers every round that masters a lesson.
    - **The hello rock** (`wave-hello`): once when the app is opened, and where a child first meets Oreo.
    - **Each trick's own animation**, on the trick shelf and on the trick reward, with its spoken name.
    - Each plays once and ends as the still picture. With reduced motion she is the still picture.
    - **Never while a question is open**: a browser test walks all 111 game levels, taps wrong answers, and fails if anything on any picture of Oreo is moving.

To confirm (in `docs/decisions.md`, dated 2026-11-16): the wagging Oreo replaces the "Oreo with a present" picture on the treasure card; the hop is tied to "at most one miss" and not to mastery separately; `wag-happy` is not also used as a home screen greeting.

Not done: the waving paw, which `art/rigs/README.md` says needs a second drawing.

## More from the phone test (2026-11-16, pull request 49)

Nothing is half done and no clips are waiting to be recorded. One thing needs Philipp: the pull request that adds rule 9 to `CLAUDE.md` is open for him to merge, because that file is at the repository root.

6. **Under "For grown-ups" on the home screen**: "Progress, settings, and why the app teaches this way."
7. **The lock** (replaces fix 4): "For grown-ups", then "To open this area, solve this sum. It keeps children out of the settings.", then the sum. After a wrong answer: "That is not it. Try this one." Still a plain form without Oreo.
8. **The estimating steps of Count and guess** (Guess, then check; Guess a heap):
   - One "Peek again" per heap, then the button goes.
   - After every answer the same bones move into tens and ones, each full ten in a red frame, and Oreo says the number and why: "12. That is 1 ten and 2 more, so 10 is nearest." (50 sentences, one per heap size).
   - The instruction is "Look at the whole heap. Is it a little, or a lot? Now pick the number that is closest."
   - The first time, Oreo shows how: a heap of 11, "Hmm, that looks like about ten.", she picks 10, the bones pack into a ten and one more.
   - Every heap the maker can show is tested: exactly one choice is nearest, and any other is at least twice as far away.
9. **Say what to do, never only what not to do.** A test fails if any spoken sentence or on-screen text in the games begins with "Don't", "Do not" or "No ".

### Sentences changed for rule 9 (all recorded again)

| Before | Now |
|---|---|
| How many can you see? You do not need to count. Look for the five. | How many can you see? Look for the five, then see how many more there are. |
| You do not need to count them all. The top row is 5. How many more are there? | The top row is 5. How many more are there? |
| You do not need to count them all. The dark blue ones are 5. How many more are there? | The dark blue ones are 5. How many more are there? |
| You do not need to count every block. Count the red tens in tens: 10, 20, 30. Then add the blue ones. | Count the red tens in tens: 10, 20, 30. Then add the blue ones. |
| You do not need to count them all. Look for small groups you know. | Look for small groups you know, and put them together. |
| Guess how many there are. You do not need to count. | Look at the whole heap. Is it a little, or a lot? Now pick the number that is closest. |
| No ones left! Break a ten into 10 ones. | The ones are all gone! Break a ten into 10 ones. |
| You have enough ones. No need to break a ten. | You have enough ones. Take away a one. |
| Not enough left for a ten. They stay ones. | Fewer than ten are left, so they stay ones. |
| That is not far enough yet. | Walk a little further. |

New: "Watch Oreo first.", "Hmm, that looks like about ten.", "Now it is your turn.", and the 50 "… so … is nearest." sentences. Removed, because nothing says them now: "Let's check.", "Let's check. Count them and see which number is nearest.", "Let's check. Pack them in tens and see which number is nearest."

To confirm (in `docs/decisions.md`, dated 2026-11-16): the wording of the "nearest" sentences, especially "nearly 2 tens"; that the demonstration also comes before a child's first heap to 100; that the other quick-look games keep their unlimited peek; the four sentences with "not" that were left alone.

I cannot listen to the recordings: the 59 new clips are checked for existing and for length only.

## "Done means", line by line

| The spec says | State |
|---|---|
| Every skill of Stages 1 and 2 has a playable lesson with all its steps | **Yes.** 41 lessons in 14 units, 25 games, 108 levels. Table below |
| A wrong-answer explanation for every question type | **Yes.** Each lesson's pull request lists them; the browser tests play a wrong answer at every level and read the explanation |
| A parent note for every lesson | **Yes.** 41 notes with source and strength, from `docs/research.md` in its own words; a test fails if one overstates |
| Its sentences recorded | **Yes.** 935 clips, none missing; a test fails if a clip has no recording |
| A child who answers correctly goes from an empty profile to the end of Stage 2 | **Yes.** All 41 lessons, the last on day 59 |
| A child at about 60 percent is held back, given easier steps and review, and never has nothing to do | **Yes, with a warning.** She is held back and never has an empty day, but she keeps nothing mastered. See the whole-path test below |
| All checks in "Checks for every lesson" pass | **Yes.** 487 unit tests, 375 browser tests at 400 px and laptop width, on every pull request and on its Cloudflare preview |
| The live game is untouched and still works | **Yes.** No commit of this build touches `index.html`, `audio/`, `wrangler.jsonc` or `netlify.toml`. The reference test still reads the live game and compares the eleven ported games with it, draw by draw |

## What was built, by unit

| Unit | Lesson (skill) | Steps | Played with |
|---|---|---|---|
| Stage 1: Counting | Count to 20 (s1-count) | 3: see, see, sketch | Count and guess |
| Stage 1: Counting | See how many (s1-see) | 3: see, see, sketch | High Five |
| Stage 1: Counting | Zero (s1-zero) | 2: see, head | Count and guess |
| Stage 1: Counting | Guess, then check (s1-estimate) | 1: see | Count and guess |
| Stage 1: Numbers to 20 | Number names to 20 (s1-names) | 2: see, head | Hear and type |
| Stage 1: Numbers to 20 | Ten and some more (s1-teens) | 3: see, see, head | Ten and some more |
| Stage 1: Numbers to 20 | More or less, to 20 (s1-compare) | 2: see, head | More or less |
| Stage 1: Numbers to 20 | First to tenth (s1-ordinal) | 1: see | More or less |
| Stage 1: Patterns and steps | What comes next (s1-pattern) | 1: see | Skip and spot |
| Stage 1: Patterns and steps | Steps of one, two and ten (s1-skip) | 2: see, head | Skip and spot |
| Stage 1: Patterns and steps | Odd and even to 20 (s1-oddeven) | 2: see, head | Skip and spot |
| Stage 1: Adding and taking away to 20 | Adding (s1-add) | 3: see, sketch, head | Sums to 20 |
| Stage 1: Adding and taking away to 20 | Taking away (s1-sub) | 3: see, sketch, head | Sums to 20 |
| Stage 1: Adding and taking away to 20 | Friends of ten (s1-ten) | 3: see, head, use | Friends of Ten, Oreo's Stories |
| Stage 1: Adding and taking away to 20 | Doubles (s1-doubles) | 2: see, head | Sums to 20 |
| Stage 1: Adding and taking away to 20 | Sums to 20 (s1-calc20) | 3: see, head, use | Sums to 20 |
| Stage 1: Halves | Halves (s1-half) | 3: see, see, head | Halves and quarters |
| Stage 1: Money | Coins and notes (s1-money) | 2: see, head | Money |
| Stage 2: Tens and ones | Pack in tens (s2-count) | 2: see, see | Pack Ten |
| Stage 2: Tens and ones | Tens and ones (s2-place) | 5: see, see, sketch, see, head | Quick Look, Oreo's Walk, Number Names |
| Stage 2: Tens and ones | Number names to 100 (s2-names) | 3: see, head, head | Number Names, Hear and type |
| Stage 2: Tens and ones | Build and split (s2-regroup) | 4: see, see, see, head | Pack Ten, Oreo's Walk, Another way |
| Stage 2: Numbers on the line | See how many, new patterns (s2-see) | 2: see, sketch | New patterns |
| Stage 2: Numbers on the line | Guess a heap (s2-estimate) | 1: see | Count and guess |
| Stage 2: Numbers on the line | More or less, to 100 (s2-compare) | 2: see, head | More or less |
| Stage 2: Numbers on the line | Eleventh and beyond (s2-ordinal) | 1: see | More or less |
| Stage 2: Numbers on the line | The nearer ten (s2-round) | 2: see, head | More or less |
| Stage 2: Counting in steps | Steps of two, five and ten (s2-skip) | 3: see, see, head | Jump in Tens, Skip and spot |
| Stage 2: Counting in steps | Odd and even to 100 (s2-oddeven) | 1: head | Skip and spot |
| Stage 2: Counting in steps | Number patterns (s2-sequence) | 1: head | Skip and spot |
| Stage 2: Adding and taking away to 100 | Friends of 20 and 100 (s2-bonds) | 4: see, see, see, head | Friends of Ten, Friends of 20 and 100 |
| Stage 2: Adding and taking away to 100 | Mystery numbers (s2-inverse) | 3: see, see, head | Mystery Box |
| Stage 2: Adding and taking away to 100 | Tens and ones sums (s2-calc) | 6: see, see, sketch, see, head, use | Jump in Tens, Tens and ones sums, Break a Ten, Oreo's Stories |
| Stage 2: Equal groups | Equal groups (s2-times) | 3: see, sketch, head | Equal groups |
| Stage 2: Equal groups | Times tables (s2-tables) | 2: see, head | Equal groups |
| Stage 2: Equal groups | Fair shares (s2-divide) | 3: see, sketch, head | Fair shares |
| Stage 2: Quarters | Quarters (s2-quarter) | 4: see, see, sketch, head | Halves and quarters |
| Stage 2: Money | Amounts of money (s2-money) | 3: see, sketch, head | Money |
| Stretch: Across a ten | Fill the ten (x-fill) | 5: see, see, sketch, head, use | Fill the Ten, Oreo's Stories |
| Stretch: Across a ten | Break a ten (x-break) | 2: see, head | Break a Ten |
| Stretch: Across a ten | Find it on the line (x-line) | 1: see | Oreo's Walk |

"see, sketch, head, use" are the spec's four steps: the full picture, a simpler drawing, numbers only, a story or mixed question. From the "head" step on, answers are typed on the number pad.

Around the lessons:
- **The engine** (`app/src/engine/`): a rating per lesson; a step passed with 5 of 6, dropped at 2 or fewer; mastery on two different days; review after 1, 3, 7, 14 and 30 days; reopening after two misses; today's games (warm-up, two new rounds, one to get stronger); the starting check; the choice card; the pause when she is guessing.
- **The garden path** as the home screen, built from `art/props/`; Oreo with eleven poses from `art/puppy/`.
- **Rewards that follow mastery**: a treasure per lesson (she picks one of two), a trick per unit, an award per stage.
- **Profiles** on the device: nickname, animal picture, stage, progress; several children; a profile as a code or file for another device. All storage behind one interface.
- **The parents' area** behind an adult check: time this week, strong / weak / slow, progress by unit, the notes, how to help, settings. One page on how the app teaches, with the sources.
- **Race to 100, Quick Paws and the number machine**, ported; open after today's games.
- **Offline and installable**; buttons of at least 72 px; red and blue only for tens and ones; plain question screens; nothing moves when the device asks for no motion.

## Where the spec was not met, or was bent

1. **"Which story?" is not built** (the same questions dressed as bones, balls or stepping stones). Every story sentence is a recording about bones; two more dressings would be about four hundred more clips. The other three choice cards exist: which first, which stone, which treasure.
2. **Ten lessons end with their picture**, although the spec says every lesson ends without it: Count to 20, See how many, Guess then check, First to tenth, What comes next, Pack in tens, See how many (new patterns), Guess a heap, Eleventh and beyond, Find it on the line. In eight of them the picture is the task: there is nothing to count, see, guess or point at without it. "Pack in tens" and "Find it on the line" are the two that could get a step in her head and do not have one yet.
3. **Two places are under 72 px**: the squares of the hundred square (about 31 px on a phone) and the places of the queue of ten (64 px wide, 72 px high).
4. **The voice is cut by lesson family, not strictly by unit**: twelve packs, the one needed everywhere 0.4 MB (the single file was 7 MB).
5. **Tricks repeat**: the art has six, the path has fourteen units. Four of the seven award pictures are unused.
6. **The currency setting has one entry**, Kenyan shillings.
7. **Not checked on a real phone or tablet, and not with a real child.** Everything was played by browser tests at 400 px and 1280 px. This is the biggest gap in the whole build.

## Decisions

All 178 are in `docs/decisions.md` under "Decided during the build, to confirm", each with its reason. The ones I would look at first, because they change what a child meets:

1. **The starting check** marks a whole Stage 1 unit as known when a Stage 2 child answers its one question right, and each unit is asked about through one lesson I chose (Count to 20, Ten and some more, Steps of one two and ten, Sums to 20). One right tap carries a lot.
2. **One game level is one lesson step**, and where a lesson would have had nine steps, levels share a step ("Tens and ones sums" has six).
3. **The spec's one lesson name per row became several lessons**, one per skill (for example "More or less" is five lessons), so that each skill has its own stone and its own mastery.
4. **A guess is answered by choosing the nearest of three numbers set well apart**, not by naming the count.
5. **The adult check** is one times-table fact. It keeps a six year old out by accident, not on purpose.
6. **The parent notes use five strength words** (strong, promising, mixed, moderate, expert guidance), not the spec's three, so that guidance is not called evidence.
7. **The only sentence naming the curriculum** is on the approach page: "for learners following the Cambridge Primary curriculum, Stages 1 and 2, the Number part". The legal check in the open questions still stands.
8. **Oreo is "she"**, and two games were renamed (Oreo's Walk, Oreo's Stories).

## Clips

- 935 clips (`app/voice/script.json`; readable as `docs/voice-script.md`): 541 keep their recording from the live game, 394 were recorded for the app with `tools/voice/` (Kokoro, voice `af_heart`).
- Missing: none (`app/voice/missing.json` is empty).
- Nobody has listened to the 338 new ones. They are machine voice of the same kind as the live game's; a few will have odd stress and want recording again by ear. The stitched sentences ("8, plus, 5. How many altogether?") are the most likely to sound wrong.

## The whole-path test (200 days, `app/src/engine/path.test.ts`)

| Child | Mastered | Steps up (jumped) | Steps down | Reopened by review | Tricks |
|---|---|---|---|---|---|
| Always right | 41 of 41, the last on day 59 | 40 (23) | 0 | 0 | 14 |
| Right 3 times in 4 | 41 of 41, the last on day 122 | 62 (8) | 7 | 46 | 14 |
| Right 3 times in 5, at every step | 0 of 41 at the end | 69 (8) | 73 | 58 | 1 |
| 85 percent at the first step, 7 points less each step | 38 of 41 | 92 (14) | 46 | 52 | 14 |

For all four: never a lesson that was not open, never a day with nothing to do, never more than four rounds a day, no lesson mastered on the day its last step was first passed, reviews at 1, 3, 7, 14 and 30 days, each reward once and only for mastery.

What it shows, honestly:
- **A child who is right only three times in five at every step keeps nothing.** She masters lessons and loses them again in review (two misses in a row reopen a lesson), and is given a step back 73 times. The app holds her back as the spec says, but it does not help her forward, and nothing tells her parent. A real child is not equally weak at every step, so this is the worst case; still, a "stuck" sign in the parents' area is the first thing I would add.
- **Reopening is frequent even for a good child**: 46 times in 200 days at 75 percent. Each costs only one good day to win back, but it may feel like going backwards. Worth trying "two misses on two different days" instead of two in a row.
- A child who is always right needs about two months at one session a day for all 41 lessons.

## What to improve next

In the order I would do it:

1. **Put it in front of the first child, on her own phone, and watch.** Nothing below matters as much. Things to watch for: whether the number pad needs an introduction; whether the choice cards mean anything to a child who cannot read the lesson titles (they have no pictures yet); whether "in her head" screens with the picture back are too tall; whether the hundred square can be hit.
2. **A "stuck" sign in the parents' area**, when a lesson has been dropped or reopened several times: the app currently holds such a child back without telling anyone.
3. **Soften reopening**: two misses on two different days, instead of two in a row.
4. **Listen to the new recordings** and record again what sounds wrong.
5. **Pictures on the choice cards** (the lesson's own picture, small).
6. **More than one question per lesson in the starting check**, or a second question when the first is right, before a whole unit is marked as known.
7. **A last step in her head for "Pack in tens" and "Find it on the line".**
8. **"Which story?"**: decide whether it is worth four hundred clips, or whether the stories can be dressed in pictures only.
9. **More tricks and awards** in `art/`, so that no trick repeats.
10. The remaining open questions in `docs/decisions.md` (name and positioning near "Cambridge", the legal check on children's data) are untouched by this build and still open.

## How each pull request is done

1. Branch from `main`, one lesson or engine piece. A new lesson gets a design note in the pull request before the code.
2. `npm run check` in `app/` (lint, types, unit tests, build, browser tests at 400 px and laptop width).
3. Push, open the pull request, wait for CI and the Cloudflare build to be green.
4. Play it on the preview: `E2E_BASE_URL=https://<branch>-tens-and-ones-app.philipp-79a.workers.dev npm run e2e` (branch name with `/` as `-`).
5. Merge, then start the next from the new `main`. This file is updated in every pull request.

New or changed sentences: `npm run voice:todo`, record with `tools/voice/record.py` (see `app/README.md`), commit `app/voice/clips/`. The Kokoro model can be fetched from GitHub releases (`kokoro-onnx`, model-files-v1.0).

## Done

| # | What |
|---|---|
| 1 to 8 | Scaffold, reference check of the live game, question makers, blocks, voice player, pictures, round and session rules, home and game screens, High Five |
| 9, 10 | Oreo's poses and icon; Pack Ten |
| 25 | Profiles and storage (`app/src/data/`): several children per device, one storage interface, a profile as a code for another device, saved data checked when read |
| 26 | The app runs on the engine and on profiles: first-run form for a grown-up, who is playing, today's games from the engine (warm-up, two new rounds, one stronger), steps instead of levels, free play only after today, a round counts only when finished. Old `session/` code removed. Browser tests rewritten (116) |
| 27 | The starting check (one question per lesson, a grown-up may skip), the choice card (which stone, which first), the pause when she is guessing |
| 28 | The path as a garden walk on the home screen, built from `art/props/`: a stone per lesson, a signpost per unit, treasures on mastered stones, Oreo at today's lesson |
| 29 | Rewards that follow mastery: a treasure per lesson (she picks one of two), a trick per finished unit, an award per stage; the tricks on the home screen |
| 30 | The parents' area behind an adult check: time this week, strong / weak / slow, progress by unit, a note with source and strength for every lesson, how to help, settings (sound, stage, currency, Star's sister, start again), children on the device, moving a profile as a code or file. One page on how the app teaches, with the sources |
| 31 | Look and feel: buttons at least 72 px, red and blue only for tens and ones, plain question screens, no motion when the device asks for none, offline with the voice, installable |
| 32 | **Sums to 20**: four lessons on ten frames (Adding, Taking away, Doubles, Sums to 20), twelve levels, the number pad from "in your head" on. 17 of 41 lessons are playable |
| 33 | **Tens and ones sums, adding**: two two-digit numbers in blocks, as a sketch, in her head (34 + 25, no new ten). Part of the lesson s2-calc, which now has six steps |
| 34 | **Friends of 20 and 100**: pairs that make 20 on two ten frames, tens that make 100 as rods, both in her head |
| 35 | **Ten and some more** (numbers 10 to 20 as a ten and ones, a new Stage 1 lesson) and **another way** to make a number (34 as 2 tens and 14 ones, two more steps of Build and split). 18 of 41 lessons are playable |
| 36 | **Number names to 20** (read the word, hear and type: a new Stage 1 lesson) and **hear and type to 99** (a third step of Number names to 100). 19 of 41 lessons are playable |
| 37 | **See how many, new patterns** (dots in dice patterns and in two loose groups, shown for a moment). 20 of 41 lessons are playable. The additions to the existing games are complete |
| 38 | **More or less**: five lessons (More or less to 20 and to 100, The nearer ten, First to tenth, Eleventh and beyond), eight levels. 25 of 41 lessons are playable |
| 39 | **Skip and spot**: six lessons (What comes next, Steps of one two and ten, Odd and even to 20, Steps of two five and ten, Odd and even to 100, Number patterns), nine levels. 30 of 41 lessons are playable |
| 40 | **Equal groups**: two lessons (Equal groups, Times tables), five levels. 32 of 41 lessons are playable |
| 41 | **Fair shares**: dealing bones into bowls, making groups, dividing in her head. 33 of 41 lessons are playable |
| 42 | **Halves and quarters**: two lessons (Halves, Quarters), seven levels. 35 of 41 lessons are playable |
| 43 | **Money**: two lessons (Coins and notes, Amounts of money), five levels, Kenyan shillings drawn in code. 37 of 41 lessons are playable |
| 44 | **Count and guess**: four lessons (Count to 20, Zero, Guess then check, Guess a heap), seven levels. **All 41 lessons are playable.** The starting check now marks a whole Stage 1 unit as known for a Stage 2 child |
| 45 | The whole-path test: four simulated children play 200 days through the app's own rules; gating, mastery, review and rewards are checked for each |
| 46 | The voice pass: twelve packs by lesson family (the first is 0.4 MB, not 7 MB), 15 clipped commands rewritten as whole sentences, Oreo's two introductions with the "Star's sister" switch, unused sentences and recordings removed |
| 47 | The final report (this file) |
| 48 | After the first phone test: rewards only for what she did herself (and taken back from existing profiles), named tricks that speak and move, trick pictures that fit, a parents' lock that explains itself, "why this works" under every lesson |
| 49 | More from the phone test: a line under "For grown-ups", the lock says what to do, estimating reworked (one peek, the same bones pack into tens and ones, Oreo says why and shows how the first time), and the rule "say what to do" with its test and ten rewritten sentences |
| 50 | `CLAUDE.md`: the rule "say what to do, never only what not to do" (merged by Philipp) |
| 51 | Oreo's ten animations from `art/rigs/`, played from the data: tail wags, the hop, the hello rock, each trick's own; never while a question is open |
| 52 | "Start again", "Remove" and "Add a child" tested by real play; a second open window no longer brings old progress back |
| 53 | The garden is a path: one order as data, at most two stones open, padlocks, a lit next stone, steps and paws on passed stones, free play only for passed stones |
| 54 | Rewards early and often: the welcome treasure, treasures by paws, tricks by lessons mastered, unit badges; "Oreo's things" shows everything; paws and the changing stone after every round |
| 55 | "Change name or picture" in the parents' area: only those two change |
| 56 | A Stage 2 child starts in Stage 2: the check looks for gaps (two questions a lesson), a gap is a quick step back, Stage 1 is a folded banner, existing profiles placed again |
| 24 | The engine's rules as pure functions (`app/src/engine/`): rating, steps, mastery on two days, review after 1, 3, 7, 14, 30 days, reopening, what is open, the starting-check marking, guessing, today's parts. Tested with three simulated children |
| 23 | The curriculum as data: 2 stages, 14 units, 41 lessons (38 skills and 3 stretch lessons), steps pointing at game levels. Tests hold it to `skill-map.md` and the unit tables of the spec |
| 22 | Quick Paws. The port is complete: eleven path games, Race to 100, Quick Paws, the number machine |
| 21 | Race to 100, for two, against a grown-up or Oreo |
| 20 | Oreo's Stories, three levels. All eleven path games are ported |
| 19 | Mystery Box, three levels |
| 18 | Break a Ten, four levels |
| 17 | Fill the Ten, four levels |
| 16 | Jump in Tens, four levels |
| 15 | Friends of Ten, three levels |
| 14 | Oreo's Walk, three levels |
| 13 | Number Names, three levels |
| 12 | Quick Look, three levels |
| 11 | Voice pipeline for new clips and packs; the puppy is "Oreo" and "she" in writing and speech; 138 sentences re-recorded; browser tests can run against a preview |


## Other notes

- Two sources in `research.md` have no address (Fyfe et al. 2015; Deci et al. 1999); the approach page lists them without a link.
- The starting check asks ten questions at most. A Stage 2 child gets six about Stage 1 and the first lessons of four Stage 2 units; the last three Stage 2 units (Equal groups, Quarters, Money) are not asked about.
- Money: the sentences say "shillings"; a second currency needs its coins and notes as data and its own recordings.
- The Kokoro model for recording is fetched from GitHub releases (`kokoro-onnx`, model-files-v1.0); see `app/README.md`.
