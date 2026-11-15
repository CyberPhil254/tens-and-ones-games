# Build status

Claude Code updates this file at the end of each working session. The planning chat reads it.

## Last session (2026-11-15, fourth session)

Pull requests 1 to 5 are merged. Three more are open, each built on the one before; merge them in order.

**Pull request 6, the other pictures.** Ten frame, hands, hundred square, number line, bar model, the puppy (still, happy, thinking; no idle movement), bone, paw and the missing-number box, as components with the live game's look.

**Pull request 7, round and session logic.** The live game's rules as pure functions: bones and paws, levelling, the warm-up mix, today's games, Quick Paws rules, the bone store, saving on the device. Every answered question is also recorded silently (game, level, right first time, wrong taps, help used, response time) for the rating in work package 4. Free play is not gated yet: the spec puts that in work package 4.

**Pull request 8, the game screen and High Five.** The first playable game.

- Home screen: today's games, sound on and off, the bone store, the list of games, the number machine, the notes for grown-ups. Games not yet ported are listed as "coming soon" and cannot be opened.
- Game screen: question with speaker button, bones and paws, the puppy with an explanation after every answer, Next and Finish, the end of a round with levelling, level buttons.
- High Five at its three levels, with the live game's wording and behaviour.
- Today's games use only the games that exist here, so for now today is two rounds of High Five.
- If the voice pack does not load, the app is silent, hides the speaker button and shows "The voice did not load. Try again".
- The shared pieces moved to their own page: add `#pieces` to the address.

Played in a browser at 400 px and at laptop width, as automated tests: today's games from a new child to "all done for today", every level with right and wrong answers, moving up and down levels, progress kept after a reload, the missing voice pack. Looked at the screens at 400 px next to the live game.

The root game, `audio/` and the root `netlify.toml` are untouched.

### Differences from the live game in pull request 8

- The speaker button sits in the corner of the card instead of beside the question.
- "Coming soon" games on the home screen, and one extra line in the notes for grown-ups saying so.
- The grown-up notes leave out the lines about games that are not here yet.

## For the planning chat

- **The second Netlify site does not exist yet.** The Netlify account has only `tens-and-ones-puppy`, and only that site comments on pull requests. Until the new site is there, nothing can be played on a deploy preview of it. Settings: same repository, base directory `app`, deploy previews on; the rest is in `app/netlify.toml`.
- **Deploy previews and stacked pull requests.** Netlify builds a preview only for a pull request that points at `main`. Pull requests 7 and 8 point at the one before, so they get a preview only after the earlier ones are merged and I have pointed them at `main`. From now on I will open one game pull request at a time against `main`, so each has its preview.
- The preview of the old site (`deploy-preview-N--tens-and-ones-puppy`) shows the old game, not the new app.

## Next

The games in path order, one pull request each against `main`: Pack Ten, Quick Look, Number Names, Puppy Walk, Friends of Ten, Jump in Tens, Fill the Ten, Break a Ten, Mystery Box, Puppy Stories. Then Race to 100 and Quick Paws.

## Half done

Nothing.

## Needs a decision

Nothing at the moment.
