# Oreo's animations

Ten short movements for Oreo, made from the still pictures in `art/puppy/`. Built by `tools/art/anim/build.py`, which also checks every frame: nothing may be cut off, and no gap may open at a joint.

| File | What |
|---|---|
| `animations.json` | Every animation as data: the pose, its length, and the movement over time |
| `previews/*.gif` | How each one looks, at half size |
| `proud/`, `happy/` | These two poses cut into `body.png` and `tail.png`, so the tail can wag |

## The animations

| Name | Pose | What moves | Where to use it |
|---|---|---|---|
| `wag-proud` | proud | The tail wags four times, after a small hop | Reward screen, end of a round |
| `wag-happy` | happy | The tail wags four times, after a small hop | Right answer at the end of a question (once), home screen greeting |
| `hop-celebrating` | celebrating | Two jumps with squash and stretch | A lesson mastered, a perfect round |
| `wave-hello` | hello | The whole body rocks from side to side | Start of a session |
| `trick-high-five` | trick-high-five | Leans forward twice | Trick shelf and trick reward |
| `trick-beg` | trick-beg | Three small bounces | Trick shelf and trick reward |
| `trick-spin` | trick-spin | Turns round twice | Trick shelf and trick reward |
| `trick-roll-over` | trick-roll-over | Rocks from side to side on her back | Trick shelf and trick reward |
| `trick-play-bow` | trick-play-bow | Dips into the bow twice | Trick shelf and trick reward |
| `trick-fetch` | trick-fetch | Trots on the spot | Trick shelf and trick reward |

## How to build them in the app

Use CSS keyframes or the Web Animations API, driven by `animations.json`. Do not ship the GIFs.

- Times in each track run from 0 to 1 over `ms` milliseconds. Ease in and out between the points.
- `rot` and `tail` are degrees, clockwise positive, as in CSS. `y` is percent of the picture's height, negative is up. `sx` and `sy` are scale; a negative `sx` shows her mirrored (the turn in `trick-spin`).
- Whole-picture movements turn and scale around the bottom centre of the picture, except where `origin` is `center`.
- The two tail wags: stack `body.png` over `tail.png` at the same position and size, and rotate only the tail around `tailOrigin`. The body picture keeps a copy of the tail's base, which is what hides the seam, so the tail must be underneath.
- Leave room around the picture and do not clip it: tails and jumps go outside the picture's own box.
- Each animation plays once and ends in the still picture. Never loop without end.
- Never while a question is open. With the reduced-motion setting, show the still picture.

## What is not here

A waving paw for `hello` and `trick-high-five` was tried by cutting the arm loose and failed the inspection: the arm overlaps the body and head, and seams showed. It needs a second drawing of the same pose with the paw lower, to switch between.
