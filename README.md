# Trivia Quest

A polished, self-contained HTML5 party-trivia game with a hand-built vector
art kit. Pure static site — no build step, no dependencies, no server code.
Just open `index.html` and play.

## Play
Open `index.html` in any modern browser, or serve the folder:

```bash
npx serve .        # then visit the printed URL
```

**Flow:** Menu → *Play* → Set-up (category · question count · difficulty ·
mode · players) → Game → Results.

- **Solo vs Bots** — you answer every question while AI opponents race you.
- **Pass & Play** — 2–4 players take turns on one device.

A leaderboard appears between questions. **Esc** pauses a match (Resume / Quit
to Menu). Settings (sound FX, music, question timer, seconds-per-question,
fullscreen) persist in `localStorage`.

## Deploy
It's a static site — copy the folder to any static host (GitHub Pages, Netlify,
an S3 bucket, a sub-folder of an existing site) and open `index.html`. All
asset/script/style paths are **relative**, so it runs from any sub-path; opening
the file directly (`file://`) works too. To regenerate the question bank after
editing `assets/data/questions_source.json`, run `node tools/build_questions.js`
and commit the updated `scripts/questions.js` (the dev tools in `tools/` are
optional and never loaded by the game).

## What's inside
```
index.html              single-page shell, all five screens
styles/                 base tokens + per-screen CSS
scripts/
  questions.js          generated bank (300 Qs · 6 categories · easy/normal/hard)
  ../assets/data/questions_source.json   source of truth for the bank
  audio.js              procedural WebAudio sound (no audio files)
  app.js                state machine, screens, game loop, scoring
assets/
  art/                  the vector art kit — every asset hand-built as SVG
    bg/ brand/ characters/ avatars/ ui/ results/
  fonts/                self-hosted Baloo 2 + Nunito (latin subset)
tools/                  dev-only Playwright renderers for art QA
STYLE.md                the art-direction bible
```

## Art kit
Every visual is a deliberately-crafted SVG following a single art direction
(`STYLE.md`): a deep-purple "quiz arena", chunky rounded forms, a consistent
chibi character recipe (six category mascots, eight player avatars, the
lightbulb brand mascot), tactile gradient UI, and a full results set
(trophy, medals, crown, confetti). No emoji, icon-fonts, or CSS-gradient
stand-ins — drawn shapes only.

The fixed 1280×720 stage scales to fit any viewport, keeping proportions exact.
