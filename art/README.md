# Art

The puppy is called **Oreo**. She is introduced to the child as the sister of Star, the first user's own dog.

The mascot and all illustrations, made on 15 November 2026 with Google's Nano Banana image model. The prompts are in `prompts.md`. Nothing in this folder is shipped as it is: the app copies and shrinks what it uses.

## Rules for every picture

- No red and no blue. In the app those colours mean tens and ones.
- Anything the child counts (blocks, bones, stars, dots, fingers) is drawn in code, never as a picture, so the amount is always exact.
- The puppy reacts to answers. It does not move while the child is thinking.
- One puppy. Every new pose is generated with `source/puppy-reference.png` attached so the character stays the same.

## What is here

| Folder | What | Files |
|---|---|---|
| `source/` | The sheets exactly as they came from the image model, plus the reference puppy | 12 |
| `puppy/` | The puppy, one pose per file, transparent background | 29 |
| `props/` | Treasures and pieces for the path and stories | 9 |
| `awards/` | Medal, trophy, rosette, crown, badges | 7 |
| `friends/` | Animal heads for child profile pictures | 9 |
| `scenes/` | Home screen background (portrait) | 1 |

The cut-outs were made from the sheets with `tools/art/cut.py`. Each is about 300 pixels wide.

## The puppy poses

| File | Meant for | State |
|---|---|---|
| `standing` | Resting pose | Good |
| `happy` | Right answer | Good |
| `celebrating` | Round finished, level up | Good |
| `thinking` | While a question is open | Good |
| `not-yet` | After a wrong answer | Good (second version, sheet 10) |
| `listening` | While the voice speaks | Good (sheet 10) |
| `pointing` | Beside the explanation | Good |
| `encouraging` | Hint offered | Good |
| `proud` | End of a round | Good |
| `sleeping` | Offline, or done for today | Good |
| `head` | App icon, profile picture | Good |
| `hello`, `goodbye` | Start and end of a session | Good |
| `digging` | "Coming soon" | Good |
| `sniffing` | Loading | Good |
| `gift` | Something new unlocked | Good |
| `yawning` | "That's enough for today" | Good |
| `trick-beg`, `trick-high-five`, `trick-roll-over`, `trick-play-bow`, `trick-fetch` | Tricks earned by mastery | Usable. The eyes have a white ring the reference does not have |
| `trick-spin` | Trick | Good (second version, sheet 10) |
| `with-bandana`, `with-bed`, `with-kennel`, `with-rope-toy`, `with-ball` | The puppy with a treasure | Good |
| `with-bowl` | The puppy with a treasure | Good (second version, sheet 10, brown bowl) |

## Still to make

- **Sharper finals.** The cut-outs are soft when shown large on a good phone screen. Before launch, regenerate each pose the app really uses as a single image, with the same reference.
- **Kenyan coins and notes** for the money game. These must be drawn from the real ones, not invented by an image model.

## Thrown away

- The first "thinking" (sheet 01, fourth picture): the mouth turns down and it looks worried.
- The "listening" attempt (sheet 02, fourth picture): same problem.
- Two stray animal heads on the awards sheet (duplicates of the zebra and hippo).
- The first `not-yet`, `trick-spin` and `with-bowl` (sad eyes, no real spin, a coral bowl). They are still on sheets 02, 03 and 07.
