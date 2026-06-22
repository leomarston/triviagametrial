# Trivia Quest — Art Direction

A single, strict visual language so every hand-built asset reads as one
purchased vector kit. Every asset is its own crafted `.svg` in `assets/art/`.
No emoji, no icon fonts, no CSS-gradient fakery — real drawn shapes only.

## The world
Deep-purple "quiz arena" with concentric sound-wave ripples and softly floating
geometric confetti. Friendly, chunky, modern mobile party-game. Reference:
the supplied game-screen mockup is the source of truth for the game screen.

## Palette
| Role | Stops |
|------|-------|
| Arena bg | `#4A3D72` → `#5C4E91` (radial, lighter centre) |
| Arena bg deep | `#3A2F5C` |
| Ink (definition, used sparingly) | `#2C2350` |
| White / off-white | `#FFFFFF` / `#F4F1FB` |
| Lavender text | `#C9BEE8` |
| Gold (featured/active) | `#F8D45B` → `#E3A52A` |
| Magenta (points/accent) | `#F0428A` → `#C9286A` |
| Highlight green (names) | `#74D17A` |
| Answer A — Orange | `#FCCB80` → `#F18E55` |
| Answer B — Cyan | `#5BDAD2` → `#1E9CC8` |
| Answer C — Pink | `#F58CBE` → `#E5428C` |
| Answer D — Violet | `#BEA6F0` → `#8E6FD6` |

### Category hues (Trivia-Crack family)
Science `#39C16C` · Entertainment `#EC4B57` · Arts `#A45BD6` ·
Geography `#2E9BD6` · Sports `#F3973F` · History `#F4C63E`.

## Shading recipe (apply to EVERY form)
1. Base fill = 2-stop gradient (light top-left → darker bottom-right).
2. Soft top sheen: white shape at 14–22% opacity on the upper third.
3. Inner-bottom shade: darker tone at ~18% opacity hugging the lower edge.
4. Contact shadow: blurred ellipse beneath, `#1E1838` at 22–30%.
5. Outlines only where forms must separate, ink colour, 0 strokes elsewhere.

## Forms
- Corner-radius family: chips 12, buttons 22, cards 26, big panels 32.
- Characters are chibi: head ≈ 48% of height, simple curved-bean bodies,
  two dot eyes each with a single white catch-light, soft cheek blush,
  tiny mitten hands. Same eye + blush recipe on all characters.
- Decor: rounded triangle, circle, plus, 4-point sparkle, squiggle — all at
  8–16% opacity, never sharp-cornered.

## Type
Display/headings/buttons: **Baloo 2** (700/800). UI labels/body: **Nunito**
(600/700/800). Numbers use Baloo 2. Letter-spacing on small-caps labels: 0.12em.

## Don'ts
No drop-shadow soup, no neon glow everywhere, no thin hairline strokes, no
default emoji/icons, no perfectly-centered symmetric "logo in a circle" clichés.
Each character has personality and a slight asymmetric tilt.
