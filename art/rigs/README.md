# Rigs: pictures cut into moving parts

A rig is one pose of Oreo split into layers, so a part can move while the rest stays still. Made with `tools/art/rig.py` from the cut-out in `art/puppy/`.

## proud (tail wag)

| File | What |
|---|---|
| `proud/body.png` | Oreo without her tail. Drawn on top |
| `proud/tail.png` | The tail alone, same canvas size (318 by 373). Its base is extended to the right so no gap opens under the body. Drawn underneath |
| `proud/preview.gif` | How it looks |

To animate: stack both pictures at the same position, tail underneath, and rotate the tail around its base. The base is at x 60, y 306 of the 318 by 373 canvas, which is `transform-origin: 18.9% 82%`. Swing between about 9 degrees one way and 17 the other (in CSS terms: from `rotate(9deg)` to `rotate(-17deg)`), one full wag in about 0.7 seconds. The tail swings a little outside the picture's left edge, so do not clip it.

Use it only where nothing is being asked: reward screens and the end of a round. Stop after a few wags. With reduced motion, show the still picture.
