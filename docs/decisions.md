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
| 2026-11-15 | Mascot: the caramel puppy with the green collar (`art/source/puppy-reference.png`), made with Nano Banana. All art, the prompts and the rules are in `art/`. The puppy is animated in code by swapping poses and simple movement; Rive only later if the pilot justifies it | Chosen by Philipp. Costs nothing and stays consistent through the reference image |
| 2026-11-15 | The full build is specified in `docs/build-spec.md`: all of Stages 1 and 2 Number as stage, unit, lesson and step; the adaptive engine; the garden path; rewards by mastery; parent notes on why each lesson works. It replaces `phase-1-spec.md` | Philipp asked for one full build; the planning chat researched and wrote it |
| 2026-11-15 | The child cannot skip. She is offered choices sometimes, but every option is something the engine has already chosen for her (order, which open lesson first, the story, the reward). Her choice is always honoured; there is no option that means less or easier work | Philipp: the feeling of choosing matters, the learning must not depend on it. Choice raises motivation most when it does not change the teaching (Patall et al. 2008) |
| 2026-11-15 | Accounts and sync are not part of the full build. Progress is stored on the device behind one interface, with a save and load code for moving it | Keeps the build free of outside services and of child data on a server until the legal check is done |
| 2026-11-15 | New and changed sentences are recorded with the existing Kokoro voice so nothing is silent. A better voice engine can replace all clips later from the same script | The voice engine choice needs an account and key from Philipp and should not hold up the build |
| 2026-11-15 | The app says "Oreo", not "the puppy", in writing and in speech | Answers Claude Code's question in `status.md` |
| 2026-11-15 | During the full build Claude Code decides open details itself, logs them, and merges its own pull requests under the conditions in `CLAUDE.md` | Philipp wants a long build that powers through |
| 2026-11-15 | The puppy is called Oreo and is introduced as the sister of Star, the first user's own dog. The introduction needs new recorded sentences, which belong in the voice script rewrite | Philipp's decision |
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
4. Mascot: look and name are decided (Oreo, see `art/`). Still open: how Oreo is introduced to children other than the first user, who do not know Star.
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

## Decided during the build, to confirm

Claude Code adds a line here for every detail it had to decide itself: the date, the decision, and why.

| Date | Decision | Why |
|---|---|---|
| 2026-11-15 | Oreo is "she" in every sentence ("She finds 3 more."), and two games are renamed: "Oreo's Walk" (was Puppy Walk) and "Oreo's Stories" (was Puppy Stories) | The spec says Oreo everywhere and that she is female; the old names said "puppy" |
| 2026-11-15 | Newly recorded clips are committed one file each in `app/voice/clips/`, named by a hash of their wording. Clips whose wording has not changed are still cut from the first recording in `audio/` at build time | The build on Cloudflare cannot record; the root `audio/` must not change; one file per clip keeps a re-recording to the sentences that changed |
| 2026-11-15 | The "one data file" for the script is `app/voice/script.json`, written from the typed sentence tables in `app/src/speech/` by a test. `docs/voice-script.md` is written from it the same way | Game code needs typed ids; a test keeps the data file, the readable script and the code from drifting apart |
| 2026-11-15 | A sentence with no recording fails the unit tests unless it is listed in `app/voice/missing.json` | "Nothing in the app is silent" should be checked by a machine, with one visible list of exceptions |
| 2026-11-15 | Voice packs are fetched the first time a sentence in them is needed. For now there are two, "core" and "stories"; packs per unit come with the units | The spec asks for the voice per unit; the units do not exist as data yet |
| 2026-11-15 | Before merging, each pull request's browser tests are also run against its Cloudflare preview (`E2E_BASE_URL`), at 400 px and laptop width | "Played on its preview" needs to be repeatable for dozens of pull requests |
| 2026-11-15 | Every ported game level belongs to exactly one lesson. Mystery Box is all in "Mystery numbers" (s2-inverse), Friends of Ten level 3 in s2-bonds, Break a Ten levels 1 and 2 in s2-calc. The stretch unit has three lessons: Fill the ten, Break a ten, Find it on the line | A level in two lessons would be practised and rated twice; the skill map names the main skill of each level |
| 2026-11-15 | Each kind of story is its own question source, so a story can be the last step of the lesson whose skill it uses ("wants 10" ends Friends of ten; the stories with tens end Tens and ones sums; the two that cross a ten end Fill the ten) | The spec makes stories the last step of their lesson, not a unit |
| 2026-11-15 | "See how many" (s1-see) ends on a ten frame shown briefly, not on bare numbers | Seeing an amount at a glance has no version without a picture |
| 2026-11-15 | Lesson titles for parents are ours ("Friends of ten", "Pack in tens", "The nearer ten"). Skill wording is taken from `skill-map.md`, which is already in our own words | Parents need names they can find; nothing is copied from the framework |
| 2026-11-15 | Engine numbers, all in `app/src/engine/config.ts`: rounds of 6 and warm-ups of 5; pass at 5, drop at 2 or fewer; mastery after the last step is passed on 2 different days; reviews after 1, 3, 7, 14, 30 days; reopened after 2 review misses in a row; an answer over 15 seconds from an accurate child counts as slow; guessing is 3 wrong taps in a row each within 1.2 seconds, and pauses the answers for 3 seconds | The spec gives the rules; these are the numbers it leaves open. To be tuned with real children |
| 2026-11-15 | A perfect round skips a step (the live game's rule) but never the last step, which must itself be passed on two days | "This is the live game's rule and stays", and every lesson has to end without the picture |
| 2026-11-15 | The rating is one number per lesson. A new child is expected to get three in four right at the first step; each later step is one unit harder. Speed lowers the score of a right answer only once the last six answers at her step include five right | The spec: accuracy first, speed only when accurate, about three in four right |
| 2026-11-15 | A review that is right but slow keeps its place in the schedule and comes back after half the usual wait. A review that is right moves the schedule only once a day and only when it was due | "Sooner if it was slow or shaky" |
| 2026-11-15 | A lesson reopened by review goes back to its last step, one good day from mastered | The live game's rule for a finished game missed twice in warm-ups |
| 2026-11-15 | A lesson opens when every lesson it needs has been passed once at its last step. A needed lesson that has nothing to play yet is looked through to what it needs itself | The spec's unlock rule; and the path must not be blocked by lessons still to be built |
| 2026-11-15 | The warm-up takes lessons due for review first and fills up with other mastered lessons. Those not yet due do not move their schedule when right, but a miss counts | Retrieval practice every day, without stretching the schedule |
| 2026-11-15 | "Stronger" is a round on a started, unfinished lesson other than today's new one if there is one (it counts like any round); otherwise on the mastered lesson she is weakest or slowest at (only the rating moves) | The spec asks for the weakest or slowest skill; an unfinished lesson is by definition the weaker |
| 2026-11-15 | When two lessons are open the child may choose between the first two on the path ("which stone?") | Two or three options at most, both wanted by the engine |
| 2026-11-15 | The storage interface is asynchronous although the device's storage is not | So that accounts and sync can replace it later without touching lessons or screens |
| 2026-11-15 | A nickname is typed by a parent in the parents' area and reduced to letters, digits and spaces, 16 at most. A child never types free text | The spec's data rules |
| 2026-11-15 | The code that moves a profile to another device leaves out the log of single answers; the progress, bones and rewards travel | It keeps the code short enough to copy; the engine's state is complete without the log |
| 2026-11-15 | Saved or pasted data is rebuilt field by field when read; anything unknown or out of range is dropped | A pasted code or old data must never break the app |
| 2026-11-15 | Until the garden path is built (step 3) the home screen shows the path as a list by unit: each lesson with its step, "First: …" for what it waits for, "Coming soon" for lessons not built yet | The engine has to be playable and testable before the look is done; the list is replaced, not kept |
| 2026-11-15 | Free play, Race to 100 and the number machine are closed until today's games are done; after that "Play again anyway" repeats today's plan | The spec: free play only after today's games |
| 2026-11-15 | Quick Paws opens when "Friends of ten" and "Tens and ones sums" are mastered (it was: when two games were finished) | Speed practice is only for facts she already has; these are the lessons its questions come from |
| 2026-11-15 | A round counts only when it is finished: leaving early saves nothing, neither bones nor answers | One rule a child can understand, and half rounds cannot pass or drop a step |
| 2026-11-15 | The first screen on a new device is a form "for a grown-up": nickname, one of nine animal pictures, stage. With one child on the device she is chosen automatically; with several, the last one who played, and the name chip on the home screen changes child | The parents' area comes in step 3; a child must be able to start before that |
| 2026-11-15 | A tester's door: `#try=<game>.<level>` plays one free round of a game level. Nothing links to it; without a profile nothing is saved | To look at one level, and for the browser tests, now that level buttons are gone |
| 2026-11-15 | Level buttons are gone: the app chooses the step | The spec: the engine decides; a child choosing "level 1" for easy bones defeats it |
| 2026-11-15 | One choice card a day, after the warm-up: "which stone?" when two lessons are open, otherwise "which first?" between the new lesson and the round to get stronger. The warm-up always comes first | The spec says once or twice a session; review first is what the research asks for, so the warm-up is not on a card |
| 2026-11-15 | "Which story?" and "which reward?" cards are not built yet: they come with the story lessons (step 4) and the rewards (step 3) | They need things that do not exist yet |
| 2026-11-15 | The starting check asks one question per lesson at its last step: the last playable lesson of each unit below her stage, the first of each unit of her own. Right first time marks the lesson and what it is built on as known; they still come back in review. Leaving the check counts for nothing; a grown-up may skip it | The spec's "about ten questions"; one question is thin, so review catches a lucky answer (two misses reopen the lesson) |
| 2026-11-15 | Guessing is three wrong taps in a row, each under 1.2 seconds after the one before. The answers pause for 3 seconds, Oreo says to look again, and a fresh question replaces the guessed one. Not in Quick Paws | The spec: those answers count neither way; numbers are in `engine/config.ts` |
| 2026-11-15 | The garden is one long walk down the page: a fence at the top, a signpost and a bush for each unit, stones left and right in turn, the kennel at the end. A stone shows its step number, a paw when mastered, the treasure on it, and Oreo standing at today's lesson | The spec: built in code from `art/props/`, one stone per lesson, one part of the garden per unit |
| 2026-11-15 | The scene picture `art/scenes/garden.jpg` is used only as the fence along the top; the lawn is a flat colour taken from it | One portrait picture cannot sit behind 41 stones; the path is as long as the curriculum |
| 2026-11-15 | Oreo sleeps on the home screen once today's games are done | `art/README.md` gives the sleeping pose that meaning; it tells a child "enough for today" without words |
| 2026-11-15 | A mastered lesson earns one of six treasures. She picks between two ("which reward?"): the two kinds Oreo has fewest of. It then sits on that lesson's stone. A lesson reopened and mastered again keeps its treasure and earns no second one | There are six treasure pictures and 41 lessons; a real choice between two wanted things, nothing random |
| 2026-11-15 | A unit earns a trick only when every lesson in it is built and mastered. The six tricks go round in path order; a seventh unit shows the first trick again | Six trick pictures, fourteen units. More tricks need more art |
| 2026-11-15 | Awards: the rosette for Stage 1, the trophy for Stage 2, the crown for the stretch lessons | Three of the seven award pictures; the rest are unused |
| 2026-11-15 | What the starting check marks as known gets its treasures and tricks without cards | Otherwise a Stage 2 child meets six reward cards in a row before her first lesson, for nothing she did today |
| 2026-11-15 | A reward not collected (the app was closed) is still owed and is shown first next time | It is worked out from saved progress, so it cannot be lost |
| 2026-11-15 | The adult check is one times-table fact from 6 × 6 upwards, typed as a number | The spec asks for a simple check. It keeps a six year old out by accident, not a determined ten year old; nothing behind it is secret |
| 2026-11-15 | Parent notes use five strength words, as `research.md` does: strong, promising, mixed, moderate, and "expert guidance, not a trial" | The spec names three; calling guidance "strong" or "promising" would overstate it |
| 2026-11-15 | Every lesson has a note now, also the ones not built yet; it is written for the lesson as the spec describes it | The notes are part of "Done means", and the parents' area lists the whole path |
| 2026-11-15 | The only sentence that names the curriculum is on the approach page: "for learners following the Cambridge Primary curriculum, Stages 1 and 2, the Number part". Nothing else, no logo | The wording `product-plan.md` allows; still needs the legal check in the open questions |
| 2026-11-15 | Time played is worked out from the answers: the time between one answer and the next, with gaps over two minutes left out | Nothing extra is recorded; a child who walks away does not count as playing |
| 2026-11-15 | "Weak" in the parents' area: at least one round played and less than an even chance of a right answer at her step. "Strong": mastered and at or above the 75 percent the engine aims for | So one bad answer does not label a lesson |
| 2026-11-15 | Changing the stage in settings changes only the profile and the starting check; lessons already done stay done | Progress is the child's, whatever stage a parent picks |
| 2026-11-15 | Currency setting has one entry, Kenyan shillings | The spec lists the setting; other currencies need their coins and notes drawn first |
| 2026-11-15 | When a child is removed and one is left, that one is playing | The same rule as on start |
| 2026-11-15 | Every button a child taps is at least 72 px both ways. Two exceptions: the squares of the hundred square (a hundred of them on a phone are about 31 px each) and the "Home" button, which is kept small on purpose | The hundred square is the maths itself and cannot be made bigger on a phone; leaving a round should not happen by accident |
| 2026-11-15 | Blue and red are only on things that are ones and tens: blocks, digits, and the buttons that add or take a ten or a one. Ordinary buttons are yellow or white, the focus ring is dark yellow | The spec: red and blue mean tens and ones and nothing else |
| 2026-11-15 | "Pack 10" is a yellow button, not a blue one | It turns ten ones into a ten; it is neither |
| 2026-11-15 | The squared paper background is on the home screen and the grown-ups' pages; every question, choice and reward screen is plain | The spec: a question screen has a plain background |
| 2026-11-15 | The voice packs are stored for offline use when the app is first opened (about 6.5 MB) | "Works offline once opened", voice included. The packs get smaller when they are split per unit in step 6 |
| 2026-11-15 | Where the device asks for less motion, every animation and transition is switched off, not only Oreo's hop | The spec: honour the reduced-motion setting |
| 2026-11-15 | "Sums to 20" is one game with twelve levels, used as the steps of four lessons: Adding (see, count on, in her head), Taking away (see, the difference, in her head), Doubles (see, in her head), Sums to 20 (through ten adding and taking away, in her head, a story) | The spec gives one lesson name for four skills; each skill needs its own mastery and its own stone |
| 2026-11-15 | Ported games stay in `PATH` and are still checked draw by draw against the live game; games made for the app are listed beside them (`NEW_GAMES`) | So the reference check keeps meaning what it meant |
| 2026-11-15 | Counters fill the first ten frame before the second, added ones in yellow, taken ones crossed out from the end. So "through ten" is in the picture itself; a wrong answer replays it one counter at a time, pausing at ten | The spec: "the frame shows the move through ten" |
| 2026-11-15 | Counters in ten frames are blue (they are ones) and the added ones yellow, as in Friends of Ten and Fill the Ten | One picture for one idea everywhere |
| 2026-11-15 | The number pad: digits, rub out, a tick; two digits at most. Used from the "in your head" step on. A wrong number is cleared and explained, she types again | The spec: recall teaches more than recognising; no guessing by tapping around |
| 2026-11-15 | Sums within 10 never have 0 as an answer or as a number added or taken | Zero is its own lesson (s1-zero), not built yet |
| 2026-11-15 | The difference ("how many more?") is shown as two rows, matched one to one, in Taking away step 2 | The skill names finding the difference; matching rows is its picture |
| 2026-11-15 | Stories in Sums to 20 use "Oreo has N bones. She finds / eats N." Nine new clips "She eats N of them." | Reuses the story voice; only eating 10 was recorded before |
| 2026-11-15 | The starting check for a Stage 2 child now asks a Sums to 20 story (the last lesson of that unit) instead of Friends of ten | The rule did not change: the last built lesson of each unit below her stage |
| 2026-11-15 | "Tens and ones sums" is now six steps: tens on and off on the hundred square; adding two numbers in blocks; the same as a sketch; taking tens, then tens and ones, away in blocks; in her head (hundred square jumps and adding on the number pad); stories. The two Jump in Tens levels share a step, and so do the two Break a Ten levels | Adding two two-digit numbers was missing. With one step per game level the lesson would have nine steps before mastery |
| 2026-11-15 | Adding two two-digit numbers: both have tens and ones, the ones together stay under ten, the sum stays under 100. A miss and the right answer both put the blocks together, the second number's ones in yellow, with "3 tens + 2 tens" and "4 ones + 5 ones" under them | The spec: tens and ones are added separately on screen |
| 2026-11-15 | The additions to existing games are built as small games of their own beside the ported ones ("Friends of 20 and 100" beside Friends of Ten), and joined to the same lesson | The ported games stay identical to the live game and checked against it |
| 2026-11-15 | Friends of 20 always shows two ten frames, also for numbers under 10; the missing ones arrive in yellow. Tens to 100 are rods, the missing tens arrive as yellow rods | The empty places are the answer, so they have to be there to count |
| 2026-11-15 | "Friends of 20 and 100" (the lesson) is four steps: next ten (47 + ? = 50), pairs to 20, tens to 100, both in her head on the number pad | The skill names both pairs; the next-ten level was already there |
| 2026-11-15 | "Ten and some more" (s1-teens) is three steps with blocks: read a ten and some ones (10 to 20); how many ones go with the ten; both in her head on the number pad | Pack Ten for numbers 0 to 20, as the spec asks, as a Stage 1 lesson of its own |
| 2026-11-15 | "Another way" joins "Build and split" (s2-regroup) as two more steps: 34 is 2 tens and how many ones, with the blocks, then in her head | The spec's "34 as 2 tens and 14 ones" |
| 2026-11-15 | "Pack in tens" now waits for "Ten and some more", as the skill map says. Until now that prerequisite was looked through because it was not built | The rule did not change; a lesson that exists is no longer skipped |
| 2026-11-15 | "Number names to 20" (s1-names) is two steps: read a word from zero to twenty and find the numeral; hear a number and type it. "Number names to 100" gets a third step: hear a number to 99 and type it, with thirteen/thirty pairs coming up often | The spec's additions to Number Names. Typing is the "write" in "say, read and write" |
| 2026-11-15 | In the hear-and-type steps nothing on screen gives the number away. A wrong number is told what it is ("41 is forty-one: 4 tens and 1 one. Try again.") and the blocks for the right number appear. If the voice did not load, the word is shown instead | Same explanation as Number Names in the live game; a child must never be stuck in silence |
| 2026-11-15 | Tests that named "the next lesson on the path" now check the rule (the first open lesson she has not started) instead of a lesson by name | The answer changes with every lesson that is built; the rule does not |
