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

- **Hosting is Cloudflare now.** `app/netlify.toml` is gone. Its settings live here: the fallback to the app for any address in `app/wrangler.jsonc`, the Node version in `app/.nvmrc` (22), and `wrangler` 4.162 as a dev dependency so preview links are posted. New: `app/public/_headers` lets phones keep the fingerprinted files for a year; the page, the service worker and the voice pack are still checked every time.
- **Preview builds needed two more settings.** The first Cloudflare builds of the pull requests failed after about 30 seconds. Cloudflare's log is only in its dashboard, which Claude Code cannot read, so the cause was found by trying: `app/wrangler.jsonc` lacked `"previews": {}` and `"preview_urls": true`. With both added, all three pull requests build.
- **Preview links.** Cloudflare posts the link as a comment about two minutes after the build, on a pull request that points at `main`: pull request 6 has it. Pull requests 7 and 8 point at the pull request before them and have no comment, although their previews were built. They should get one once they point at `main`. The addresses follow the branch name:
  - pictures: https://claude-pictures-tens-and-ones-app.philipp-79a.workers.dev (add `#pieces`)
  - session logic: https://claude-session-logic-tens-and-ones-app.philipp-79a.workers.dev
  - High Five: https://claude-high-five-tens-and-ones-app.philipp-79a.workers.dev
- **High Five was played on its preview**: a full round at 400 px, the voice loaded, no errors. The fingerprinted files are served with the one-year cache header, the page with "check every time".
- Unlike Netlify, Cloudflare builds a preview for every branch, so stacked pull requests get one too.
- The pull requests still get a comment from Netlify's `tens-and-ones-puppy` site, which builds the old game. That stops when the repository is disconnected from Netlify.
- The build of the new app reads the recording from `audio/` at the repository root, so Cloudflare must check out the whole repository (root directory `app` does that; a sparse checkout of `app/` only would break the build).

## Next

The games in path order, one pull request each against `main`: Pack Ten, Quick Look, Number Names, Puppy Walk, Friends of Ten, Jump in Tens, Fill the Ten, Break a Ten, Mystery Box, Puppy Stories. Then Race to 100 and Quick Paws.

## Half done

Nothing.

## Needs a decision

Nothing at the moment.
