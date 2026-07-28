# Handoff — Find Fairy

## Where things stand

Live: **https://chanooooot.github.io/Find-the-Fairy/**
Repo: `chanooooot/Find-the-Fairy` (public, GitHub Pages from `main` / root)

M1 + M2 are **built and pushed, zero gameplay verified on a real phone.**
Gate 1, Gate 2, and Gate 3 (BUILD_PLAN.md) have not run. Do these first —
don't build M3 or anything else until they pass.

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

## First thing to do at home

**Gate 1** (BUILD_PLAN.md): open the live URL on iPhone, grant both
permissions, watch the debug overlay's `yaw`/`pitch` while turning 360°
slowly (~60s), see how far it's drifted from 0 when you return to start.
Repeat on Android. Check fps in the corner.

- Pass: drift < 15°, fps ≥ 30 both devices → continue
- Marginal (15–30°): bump `CONFIG.catchAngle` to 12, continue
- **Kill: drift > 30° or fps < 20 on either device.** Stop, don't
  work around it — this is a go/no-go per CLAUDE.md.

## Known open items — decide these on-device, not in code

1. **`CONFIG.invertYaw` / `invertPitch`** (both `false` right now). If the
   fairy runs away instead of centering when you turn toward it, flip the
   relevant one and push. iOS/Android sign conventions differ — can't
   predict from a desktop.
2. **Gate 2: pick a catch mode.** Play a full round with `?catch=dwell`,
   then `?catch=tap`. Whichever loses, delete it and the `?catch=` URL
   toggle entirely — both catch modes must not ship (CLAUDE.md).
3. **M2 calibration duration** — `CONFIG.calibrationSeconds` is 2s,
   copied from TUNING.md's starting guess. Now that calibration requires
   panning the room to get spread-out spawns, 2s may be too short to
   sweep a real room. Tune on device; don't guess from here.
4. **Gate 3** — test M2 in your living room (day), living room
   (night/lights off), and a second room. Check fairies actually land in
   the visibly darker bearings. If it doesn't hold up, M2 isn't a
   project-killer — fall back to M1's random spawn permanently and move
   on (BUILD_PLAN.md Gate 3 is fail-gracefully, not fail-kill).

## After Gates 1–3 pass

Per BUILD_PLAN.md sequencing: M3 (pinch-to-catch) is gated behind a
half-day Gate 4 spike, standalone, not integrated into the main game.
Don't start it before M1+M2 are both settled — see BUILD_PLAN.md and
SPEC.md §9/M3 for the exact pass bar (≥80% recognition in dim light,
≥18fps combined). If the spike misses the bar in half a day, delete it
and stop — dwell/tap stays permanent.

## Workflow reminder

Every change: edit `index.html`, `git add/commit/push` to `main` — GitHub
Pages redeploys automatically (usually live within ~30-60s). No build
step, no npm, nothing to install.
