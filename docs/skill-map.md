# Skill map: Number, Stages 1 and 2

Status: draft 1 from the planning chat, 15 November 2026.

Source: the published Cambridge Primary Mathematics curriculum framework (0096, first teaching 2021), read online. The skills below are written in our own words. The codes are kept only as an internal cross-reference; do not show them or any framework wording to children or parents, and do not claim endorsement.

How to read it:

- **Game** is the existing game that practises the skill. "Part" means the game touches it but does not cover it fully. "None" means a new game is needed.
- The level-by-level mapping is filled in from `docs/game-skills.md` once Claude Code has written it. Until then the mapping is at game level and may be off by a level or a number range.
- Skills with no game are shown in the app as "coming soon".

## Stage 1 (numbers to 20)

| Id | Ref | Skill, in our words | Game | Needs first |
|---|---|---|---|---|
| s1-count | 1Nc.01 | Count up to 20 things, one number per thing; the count stays the same when they are moved | None | |
| s1-see | 1Nc.02 | See how many (up to 10) in a known pattern without counting | High Five | |
| s1-estimate | 1Nc.03 | Guess how many (up to 20), then check | None | s1-count |
| s1-skip | 1Nc.04 | Count on and back in ones, twos and tens within 20, from any number | None | s1-count |
| s1-oddeven | 1Nc.05 | Odd and even as every other number, to 20 | None | s1-skip |
| s1-pattern | 1Nc.06 | Say what comes next in a pattern of things | None | |
| s1-names | 1Ni.01 | Say, read and write numbers 0 to 20 | Number Names (part) | s1-count |
| s1-add | 1Ni.02 | Adding as putting together and as counting on | Part (Mystery Box, Puppy Stories) | s1-count |
| s1-sub | 1Ni.03 | Subtracting as taking away, counting back and finding the difference | Part (Mystery Box, Puppy Stories) | s1-add |
| s1-ten | 1Ni.04 | Pairs that make 10 | Friends of Ten | s1-see |
| s1-calc20 | 1Ni.05 | Add and subtract with answers to 20 | None | s1-add, s1-sub, s1-ten |
| s1-doubles | 1Ni.06 | Doubles up to double 10 | None | s1-add |
| s1-money | 1Nm.01 | Recognise the coins and notes of the local currency | None | s1-names |
| s1-zero | 1Np.01 | Zero means none | None | s1-count |
| s1-teens | 1Np.02 | Numbers 10 to 20 as one ten and some ones | Pack Ten (part) | s1-count |
| s1-compare | 1Np.03 | Compare and order numbers to 20 | None | s1-names |
| s1-ordinal | 1Np.04 | First to tenth | None | s1-count |
| s1-half | 1Nf.01 to 1Nf.04 | Halves: equal and unequal parts, half of a shape, half of a set, two halves make a whole | None | s1-doubles |

## Stage 2 (numbers to 100)

| Id | Ref | Skill, in our words | Game | Needs first |
|---|---|---|---|---|
| s2-count | 2Nc.01 | Count up to 100 things by grouping them in tens | Pack Ten | s1-teens |
| s2-see | 2Nc.02 | See how many (up to 10) in a new pattern without counting | High Five (part) | s1-see |
| s2-estimate | 2Nc.03 | Guess how many, up to 100 | Puppy Walk (part: positions on the line) | s2-count |
| s2-skip | 2Nc.04 | Count on and back in ones, twos, fives and tens within 100, from any number | Jump in Tens (tens only) | s1-skip, s2-place |
| s2-oddeven | 2Nc.05 | Tell odd from even to 100 | None | s1-oddeven |
| s2-sequence | 2Nc.06 | Continue and describe number patterns to 100 | None | s2-skip |
| s2-names | 2Ni.01 | Say, read and write numbers to 100 | Number Names | s1-names |
| s2-inverse | 2Ni.02 | Adding and subtracting undo each other | Mystery Box | s1-add, s1-sub |
| s2-bonds | 2Ni.03 | Pairs that make 20; pairs of tens that make 100 | Friends of Ten (part: gap to the next ten) | s1-ten |
| s2-calc | 2Ni.04 | Add and subtract two-digit numbers where no ten has to be made or broken | Jump in Tens (part: adding and taking tens) | s2-place, s1-calc20 |
| s2-times | 2Ni.05 | Multiplying as equal groups, repeated adding and rows and columns | None | s2-skip |
| s2-divide | 2Ni.06 | Dividing as sharing equally and as making groups | None | s2-times |
| s2-tables | 2Ni.07 | The 1, 2, 5 and 10 times tables | None | s2-times |
| s2-money | 2Nm.01, 2Nm.02 | Read amounts of money; compare sets of coins and notes | None | s1-money, s2-calc |
| s2-place | 2Np.01 | The place of a digit gives its value; zero holds a place | Quick Look, Number Names | s2-count |
| s2-regroup | 2Np.02 | Build, split and regroup two-digit numbers in tens and ones | Pack Ten | s2-count |
| s2-compare | 2Np.03 | Compare and order two-digit numbers | Puppy Walk (part) | s2-place |
| s2-ordinal | 2Np.04 | Ordinal numbers beyond tenth | None | s1-ordinal |
| s2-round | 2Np.05 | Round to the nearest ten | None | s2-compare |
| s2-quarter | 2Nf.01 to 2Nf.06 | Quarters and three quarters: of a shape, of a set, as sharing; two quarters are a half; halves and quarters put together | None | s1-half, s2-divide |

## Beyond Stage 2 (keep, mark as stretch)

Two existing games go further than the Stage 2 framework, which stops at two-digit adding and subtracting without making or breaking a ten:

- **Fill the Ten**: adding across a ten.
- **Break a Ten**: subtracting across a ten (for example 62 take away 37).

They stay in the app, placed after the Stage 2 skills, because the first user's school already tests this.

**Puppy Stories** (word problems) is not one skill: each story is tagged with the skill it uses.

## What is covered

- Covered or mostly covered by the eleven games: seeing amounts, tens and ones, number names, pairs to 10, adding and taking tens, missing numbers. That is about a third of the two stages.
- Not covered: counting and estimating to 20, skip counting in twos and fives, odd and even, comparing and ordering, ordinals, rounding, adding and subtracting within 20, doubles, two-digit sums without regrouping, multiplying, dividing, times tables, money, halves and quarters.

## New games, in build order

Order follows prerequisites and what helps the first user soonest. Each is a Phase 2 item; none is part of the port.

1. **Sums to 20**: s1-add, s1-sub, s1-calc20, s1-doubles, s2-bonds. The base everything else in Stage 2 stands on.
2. **Tens and ones sums**: s2-calc (two-digit, no regrouping), leading into Fill the Ten and Break a Ten.
3. **Skip and spot**: s1-skip, s2-skip (twos and fives), odd and even, number patterns.
4. **More or less**: comparing, ordering, ordinals, rounding, on the number line that Puppy Walk already uses.
5. **Count and guess**: s1-count, s1-estimate, s1-zero, s2-estimate. The entry point for a Stage 1 child.
6. **Equal groups**: s2-times, s2-tables, with arrays built from the same blocks.
7. **Fair shares**: s2-divide.
8. **Halves and quarters**: s1-half, s2-quarter.
9. **Money**: s1-money, s2-money. Starts with Kenyan shillings for the pilot; the currency must be a setting, not hard-coded.

## For the engine

- Each row is one skill with its own rating. "Needs first" are the prerequisite edges for unlocking.
- A Stage 2 child starts with a short check of the Stage 1 skills that have games, so gaps below are found rather than assumed away.
