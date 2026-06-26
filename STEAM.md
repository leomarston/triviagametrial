# Shipping Trivia Quest to Steam

Trivia Quest is a self-contained HTML5 game wrapped in **Electron** so it runs
as a native desktop app (Windows / macOS / Linux). Steam distributes an
executable build, so the flow is: **build the Electron app → upload the build
folder to a Steam depot → set the launch executable.**

The game is fully offline: self-hosted fonts, local question bank, and
procedurally-generated audio. No network, accounts, or telemetry.

---

## 1. Run it locally (dev)
```bash
npm install
npm start            # launches the Electron app
```
Open `index.html` directly in a browser for a quick look without Electron.

## 2. Build a distributable
```bash
npm run pack         # unpacked app only  -> dist/<platform>-unpacked/
npm run dist         # installers + unpacked for the current OS
npm run dist:win     # Windows  (NSIS installer + dir)
npm run dist:mac     # macOS    (dmg + dir)
npm run dist:linux   # Linux    (AppImage + dir)
```
Outputs land in `dist/`. The app icon is generated from `build/icon.png`.

> Build each OS target **on that OS** (or in CI). electron-builder cannot
> reliably cross-compile signed Windows/macOS binaries from Linux. A GitHub
> Actions matrix (windows-latest / macos-latest / ubuntu-latest) is the easy
> path.

## 3. Upload to Steam (SteamPipe)
You need a **Steamworks partner account** and an **App ID** (Steam's $100
registration — only you can do this).

1. In Steamworks, create the App and a **Depot** (e.g. one per OS).
2. Install the **Steamworks SDK** → `tools/ContentBuilder`.
3. Point the depot's content root at the **unpacked** build, e.g.
   `dist/win-unpacked/` (the folder containing `Trivia Quest.exe` and
   `resources/`). Upload the folder contents, *not* the NSIS installer.
4. Use `steamcmd` / the ContentBuilder `run_build.bat` with your VDF scripts
   to push the build, then set it **Live** on a branch.
5. Set the **Launch Option** executable:
   - Windows: `Trivia Quest.exe`
   - macOS:   `Trivia Quest.app`
   - Linux:   `Trivia Quest` (or the AppImage)
6. Fill in store page, capsule art, age rating, and pricing, then submit for
   review.

## 4. Optional Steam features
- **Overlay / achievements / cloud saves** require the Steamworks SDK in-app.
  Add [`steamworks.js`](https://github.com/ceifa/steamworks.js) to
  `electron/main.js`, drop a `steam_appid.txt` next to the binary during dev,
  and call `init(<appid>)`. Map achievements to in-game events (e.g. first win,
  perfect round). Not required to ship.
- Settings already include **Fullscreen** (also `F11`); **Esc** pauses a match.

---

## Done ✓ vs. Your action ☐
**Done (in this repo):**
- ✓ Complete, QA-passed game (all modes / counts / difficulties / categories)
- ✓ Electron shell (`electron/`), single-instance, fullscreen, quit-to-desktop
- ✓ `package.json` + electron-builder config for win/mac/linux
- ✓ App icon (`build/icon.png`, `assets/icon.png`)
- ✓ Licensing: game `LICENSE.txt`, font `OFL-*.txt`, `CREDITS.md`
- ✓ Offline, no telemetry, scales to any resolution

**Your action (account-bound, cannot be automated here):**
- ☐ Register the Steamworks app + pay the fee, get the App ID
- ☐ Run `npm install && npm run dist:<os>` on each target OS (or CI)
- ☐ Create depots and upload the unpacked build via SteamPipe
- ☐ Store page assets, age rating, pricing, submit for review
- ☐ (Optional) wire `steamworks.js` for achievements/overlay
