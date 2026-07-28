# Handoff — Find Fairy

## Where things stand

Live: **https://chanooooot.github.io/Find-the-Fairy/**
Gate 4 spike: **https://chanooooot.github.io/Find-the-Fairy/gate4-pinch-spike.html**
Repo: `chanooooot/Find-the-Fairy` (public, GitHub Pages from `main` / root)

M1 + M2 built and pushed, zero gameplay verified on a real phone. The
Gate 4 pinch spike is also built and pushed (out of sequence — see
step 4 below). Gates 1–3 have not run at all.

## What's in `index.html` (single file, no build step)

- Two-step permission gate (motion, then camera), hard-stop error screen
- Camera feed backdrop + canvas overlay, procedural fairy (glow + orbiting particles)
- Relative yaw/pitch tracked off `deviceorientation`, zeroed at round start
- Opacity fade (30°→12°, smoothstep) + edge glow + audio shimmer, both
  driven by nearest uncaught fairy's angular distance
- Both catch modes, dev toggle via `?catch=dwell` or `?catch=tap` (default dwell)
- M2: 2s calibration screen ("Slowly look around your room…") samples an
  8×6 luminance grid off the live video each frame, tags each cell with
  the world bearing it was seen at, spawns fairies from the darkest 30%
  of samples. Falls back to random spawn if no samples collected.
- find-5, elapsed-time scoring, personal best in `localStorage`, end
  screen with share (Web Share API, clipboard fallback)
- Debug overlay (top-left, green monospace) — fps, yaw/pitch, angular
  distance, calibration sample count. Dev-only, not gated behind a flag.
- `CONFIG` object at top of `<script>` — every tunable lives there per
  CLAUDE.md/TUNING.md.

## `gate4-pinch-spike.html` — separate file, throwaway

Standalone MediaPipe Hands test (CDN-loaded), NOT wired into the main
game. Thumb-index pinch detection, Bright/Normal/Dim tally UI, fps
counter. Per CLAUDE.md: half a day, pass or delete — don't tune the
threshold trying to hit the bar. fps here is optimistic (no fairy
rendering/audio load like the real game); the number that matters is
dim-light recognition %.

## Step by step — what to do when you resume

### 1. Gate 1 — sensor feasibility
Open the live URL on iPhone, grant both permissions. Watch the debug
overlay's `yaw`/`pitch`. Face a direction, note position, turn 360°
slowly (~60s), back to start, check drift. Check fps in the corner.
Repeat on Android.

- Pass: drift < 15°, fps ≥ 30 both devices → continue to Gate 2
- Marginal (15–30°): bump `CONFIG.catchAngle` to 12, continue
- **Kill: drift > 30° or fps < 20 on either device.** Stop, report back
  — this is a go/no-go, not a tuning problem (CLAUDE.md).
- If the fairy runs *away* instead of centering when you turn toward
  it: flip `CONFIG.invertYaw` (or `invertPitch`) to `true`, push,
  retest. iOS/Android sign conventions differ — can't predict this
  from a desktop.

### 2. Gate 2 — feel test (only if Gate 1 passed)
Play a full round with `?catch=dwell`, then a full round with
`?catch=tap`. Decide the winner by feel. Play 3 more rounds back to
back, unprompted.

- Pass: you play 3 rounds in a row without forcing yourself to
- **Kill: boring with the camera on.** Stop, report back — no later
  feature fixes this (CLAUDE.md).
- Tell me which catch mode won — I delete the loser and the
  `?catch=` URL toggle entirely (both modes must not ship).

### 3. Gate 3 — dark-corner spawning (only if Gate 2 passed)
Play a round in: living room daytime, living room lights-off, a second
room with different lighting. Pan the phone during the "look around"
calibration screen each time. Check fairies land in the visibly darker
bearings.

- Pass: holds across all three conditions
- Fail (not a project kill): shelve M2, keep M1's random spawn
  permanently, move on.
- `CONFIG.calibrationSeconds` is 2s (TUNING.md's starting guess) — may
  be too short to pan a real room now that spread depends on it. Tune
  on device if needed.

### 4. Gate 4 — pinch spike (already built, order is your call)
BUILD_PLAN.md says don't attempt this before M1+M2 are settled — it's
built and live already because you asked to jump ahead. Whenever you
run it: hold phone up, reach toward rear camera, pinch, watch for
green "PINCH" text. Tally Recognized✓/Missed✗ per Bright/Normal/Dim
tab, 10 attempts each.

- Pass: dim-light ≥ 80% recognition, ≥ 18fps combined
- **Fail: delete `gate4-pinch-spike.html` and the MediaPipe dependency
  reference. dwell/tap stays the permanent catch mechanic.** Do not
  iterate trying to hit the bar (CLAUDE.md).

Report back after each gate with the actual numbers (drift°, fps,
catch mode picked, dim%) — that's what decides the next step.

## Workflow reminder

Every change: edit the file, `git add/commit/push` to `main` — GitHub
Pages redeploys automatically (usually live within ~30-60s). No build
step, no npm, nothing to install.
