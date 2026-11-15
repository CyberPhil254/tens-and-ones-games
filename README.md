# Tens and Ones Games

Maths practice for a 6 year old: seeing numbers as tens and ones, and using that to add and subtract up to 100 without counting one by one.

Live: https://tens-and-ones-puppy.netlify.app

## How it is meant to be used

The main button is **Play today's games**: a short warm-up that mixes games the child has already finished, then two rounds of the next game on the learning path. It takes about ten minutes. Short and daily works better than long and weekly.

The game levels itself:

- five or six bones in a round moves up a level, and a perfect round skips one
- two or fewer bones moves down a level
- a game is finished after two good rounds at its last level
- a finished game comes back if it is missed twice in later warm-ups

A bone means right first time. A paw means right after a hint or with the help picture.

## Games on the learning path

1. **High Five**: see five and some more (fingers, two-tone tower, ten frame)
2. **Pack Ten**: pack loose ones into tens, build a number from tens and ones
3. **Quick Look**: read a number from its tens and ones at a glance
4. **Number Names**: match spoken and written number names to numerals (sixteen or sixty, 17 or 71), find the number with a given count of tens
5. **Puppy Walk**: a 0 to 100 number line with tens and ones laid end to end; read, build and estimate positions
6. **Friends of Ten**: pairs that make 10 on fingers and a ten frame, then the gap to the next ten
7. **Jump in Tens**: add and subtract tens on a hundred square
8. **Fill the Ten**: add by filling up to the next ten first
9. **Break a Ten**: subtract, breaking a ten into ones when needed
10. **Mystery Box**: missing numbers with a whole and parts bar
11. **Puppy Stories**: short word problems

Games 7 to 9 end with an "in your head" level where the picture is hidden unless asked for.

Also: **Race to 100** (a board game for two, counting on from where you stand), **Quick Paws** (ten fast questions against your own best time, unlocked only after Friends of Ten and Jump in Tens are finished) and a free-play **number machine**.

## Design principles and the research behind them

- **Personalised path with explanatory feedback.** Maths apps helped most when they combined levelling with feedback that explains why an answer is right or wrong (Outhwaite et al. 2023).
- **Ten as a unit, laid out in a line.** Building two-digit numbers from exact tens and ones along a line improved first graders' sense of number size (Zhang & Okamoto 2017). Number lines are a recommended core tool (IES practice guide 2021).
- **Count on from where you are.** In number board games, counting on from the current square taught far more than restarting from 1 (Laski & Siegler 2014).
- **Number names and counts of units.** Counting in tens, "which number has N tens" and reading number names were the strongest early predictors of later multi-digit calculation (Mix et al. 2023).
- **Fingers as patterns, not counters.** Finger-based training improved first graders' written addition and subtraction (Frey et al. 2024); the evidence is promising but mixed.
- **Concreteness fading.** Blocks first, then a sketch, then digits only (Fyfe, McNeil & Borjas 2015).
- **Accuracy before speed, with spaced retrieval.** Timed practice only after high accuracy; mixed warm-ups for retrieval (McNeil et al. 2025).
- **Play together and talk.** Joint parent and child use of a maths app raised achievement (Berkowitz et al. 2015). The game prompts the adult to ask "How did you know?".
- **No decoration that competes with the maths.** The puppy appears only as feedback, and the rewards are themselves packed in boxes of ten.

Everywhere, tens are red and stand in groups of five; ones are blue, with the first five dark and the rest light.

## Technical

One `index.html` (HTML, CSS and JavaScript, no build step) plus the recorded voice in `audio/`. Fonts load from Google Fonts. Progress is stored in the browser's localStorage, per device.

### The voice

Everything the game says is a pre-recorded clip, so it sounds the same on every device. The 702 clips (whole sentences, joining words such as "plus" and "is", and the numbers 0 to 100 in two intonations) are packed into `audio/voice.mp3`, with byte offsets in `audio/voice.json`. Sentences with free numbers, such as "47 plus 10 is 57", are stitched from pieces at play time.

The clips were generated with the open-source Kokoro text-to-speech model (voice `af_heart`). The script lives in the game code: `speechCatalogue()` in `index.html` lists every clip. To re-record after changing the script, export that list to `catalogue.json`, then run `tools/voice/record.py` and `tools/voice/pack.py` (they need `kokoro-onnx`, the Kokoro model files and `ffmpeg`). If the audio files cannot be loaded, the game falls back to the browser's own speech synthesis.

Every push to `main` is deployed automatically by Netlify (project `tens-and-ones-puppy`, publish folder set in `netlify.toml`).
