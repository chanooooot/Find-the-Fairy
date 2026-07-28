# Find Fairy — SPEC.md

## 1. Concept

A gyro-controlled AR game. Fairies are hidden around the player in 3D space —
full sphere, not just a horizontal ring. The player holds their phone up,
sees their real room through the camera, and physically turns and tilts
their body to find fairies glowing faintly out of view. Find and catch 5,
score is elapsed time.

No markers, no SLAM, no plane detection. The camera provides the visual
backdrop and (in M2) a live brightness signal; the gyroscope provides the
pointing/aiming input. This is screen-space AR — objects are painted around
the player at fixed compass/tilt bearings, not anchored to physical surfaces.

**One sentence pitch:** point your phone into the dark corners of your room
and catch the fairies hiding there.

## 2. Non-goals (explicitly out of scope for v1)

- No SLAM / world tracking / plane detection (not free on iOS)
- No image marker tracking
- No multiplayer, no server, no accounts
- No global leaderboard
- No difficulty progression / escalating rounds
- No hand tracking / pinch-to-catch (see M3, gated)
- No native app, no app store distribution
- No fallback mode without camera or without gyro (hard stop instead)

## 3. Platform & cost constraints

- (fact) Zero cost: static HTML/JS/CSS, hosted on GitHub Pages
- (fact) No backend, no database, no API keys
- (fact) No build step — single HTML file, or HTML + 1-2 JS files max
- (fact) No npm dependencies beyond CDN-loaded libraries (none currently
  required — Canvas 2D, Web Audio, DeviceOrientation, getUserMedia are all
  native browser APIs)
- Target: iOS Safari (16+) and Android Chrome (recent), portrait orientation,
  phones only (not tablets/desktop — see permission flow)

## 4. Core mechanics

### 4.1 Spatial model
- Fairies exist at a `(yaw, pitch)` bearing in a **relative** coordinate
  system, zeroed to wherever the player is facing when a round starts (no
  compass permission needed, no absolute north)
- Full sphere: yaw ∈ [0°, 360°), pitch ∈ roughly [-80°, 80°] (avoid straight
  up/down where gyro math degenerates)
- Pitch comes from the accelerometer (gravity-corrected, no drift)
- Yaw comes from the gyroscope integration (drifts over time — this is
  expected and mitigated via hit-zone generosity, not corrected)

### 4.2 Visibility (opacity fade)
- A fairy's opacity is a continuous function of angular distance from the
  camera's current facing direction (great-circle-ish angle combining yaw +
  pitch delta)
- Invisible beyond 30°, fully solid within 12°, smooth interpolation between
  (see TUNING.md for the exact curve)
- No hard visibility cutoff — this was explicitly tested and rejected (a
  hard cutoff either does nothing, because it lands outside camera FOV, or
  makes fairies pop into existence with no transition)

### 4.3 Guidance system
- **Edge glow (primary):** a soft glow bleeds in from the screen edge
  nearest the fairy's direction, intensity scales with angular proximity
- **Audio shimmer (secondary):** a rising pitch/tempo shimmer as the player
  faces closer to the fairy. Must never be the *only* signal — iOS silent
  switch mutes Web Audio, so edge glow must work with sound off
- Both driven by the same angular-distance calculation, one function, two
  output channels
- Re-evaluate on device once the opacity fade is tuned: if the fade alone
  gives enough guidance, edge glow intensity can be dialed down (do not
  remove without testing — note this in TUNING.md, don't just cut it)

### 4.4 Catch mechanic — BUILD BOTH, DECIDE ON DEVICE
Two catch modes behind a dev-only toggle (e.g. URL query param `?catch=dwell`
or `?catch=tap`, default dwell). Test both on a real phone, delete the loser
before M2. This toggle must not ship to players.

- **Dwell:** hold the fairy within the ~12° solid-visibility zone for a
  continuous duration (see TUNING.md for exact seconds). A ring/arc fills
  around the reticle as progress accumulates. Breaking the hold (fairy
  leaves the zone) resets progress — decide during tuning whether reset is
  instant or decays gradually.
- **Tap:** tap anywhere on screen while a fairy is within the ~12° zone.
  Catches the nearest fairy to center, not literally where the finger
  tapped (avoids thumb-precision problems on a raised phone).

### 4.5 Movement
- **M1: fairies are static.** Fixed bearing for the whole round. This
  isolates sensor feel from motion — if something feels wrong on-device
  during Gate 1/Gate 2 testing, it must be traceable to the gyro, not
  confounded by fairy motion.
- **Drift (post-M1 tuning knob, not a new milestone):** optionally add slow
  bearing drift (a few degrees/second) once the static feel is validated.
  One-line change: `bearing += driftRate * dt`. Do not build this until M1
  feel is confirmed good.
- **Fleeing fairies are NOT a global mechanic** — see BACKLOG.md, this
  becomes a trait of a specific rare fairy species in the v1.1 collection
  system, not a v1 behavior.

### 4.6 Session shape
- One round = find and catch 5 fairies
- Score = elapsed time from round start to 5th catch
- No fail state, no timer counting down, no penalty for missing a catch
  attempt
- Personal best stored in `localStorage`, shown on the end screen

### 4.7 End screen
- Elapsed time
- Personal best (update if beaten)
- "Play again" button
- Share button using `navigator.share()` (Web Share API) — pre-filled text
  along the lines of "I found 5 fairies in Xs — [link]". Feature-detect;
  if `navigator.share` is unavailable, fall back to a "copy link" button,
  do not show a broken share button.

## 5. Rendering approach

- **Canvas 2D**, layered over a `<video>` element showing the live rear
  camera feed (`facingMode: 'environment'`)
- Video element is the visual backdrop; canvas on top (transparent
  background) draws fairies, glow, particles, reticle, UI
- **Fairies are drawn procedurally — no image assets.**
  - Core: radial gradient glow
  - 6-10 small particles orbiting the core (angle + radius animated per
    frame)
  - Composite mode `globalCompositeOperation = 'lighter'` (additive) so the
    glow visually adds light onto the live camera feed rather than sitting
    as an opaque sprite on top of it
  - Per-fairy visual identity driven by a small params object: hue, particle
    count, orbit radius, orbit speed, core size, pulse rate — this exact
    params object is what BACKLOG.md's collection book will scale into
    multiple species later, so keep it as a clean struct/object even though
    v1 only uses one fairy "type"
- Reticle: simple crosshair or ring at screen center, visually indicates
  dwell progress if dwell mode is active

## 6. Coordinate math (reference for implementer)

- On `deviceorientation` events, capture `alpha` (yaw-ish, compass), `beta`
  (front-back tilt), `gamma` (left-right tilt). Cross-platform behavior of
  these values differs between iOS and Android — verify empirically at
  Gate 1, do not assume textbook definitions match real device output.
- Zero the reference frame at round start: store initial alpha/beta as
  offsets, all subsequent bearings are relative to that.
- Fairy screen position: not a full 3D perspective projection. Approximate
  as `screenX = centerX + (fairyYaw - currentYaw) * pixelsPerDegree`,
  `screenY = centerY + (fairyPitch - currentPitch) * pixelsPerDegree`,
  where `pixelsPerDegree` is derived from the assumed/measured camera
  horizontal field of view (~50-55° typical rear camera in portrait —
  verify at Gate 1). Wrap yaw delta to [-180, 180].
- This is a screen-space approximation, not a true 3D camera matrix. That's
  intentional — full perspective projection is unnecessary complexity for
  small angular offsets near center, which is where all visible content
  lives (nothing is rendered/relevant beyond the 30° fade boundary).

## 7. Permission flow

Two-step gate, each step a full-screen tap-through, no combined single tap
(chaining permission requests across an `await` can break the user-gesture
context needed for the second request on some iOS Safari versions).

1. **Screen 1 — motion:** "Fairies hide in your room — let's find them."
   Tap → `DeviceOrientationEvent.requestPermission()` (iOS 13+ only; Android
   doesn't gate this, skip the prompt there and proceed automatically)
2. **Screen 2 — camera:** "Open your eyes." Tap →
   `getUserMedia({video: {facingMode: 'environment'}})`

**On denial (either permission): hard stop.** No fallback gameplay mode.
Show a clear message naming which permission is missing and a "try again"
button, plus a one-line platform-appropriate hint (iOS: Settings > Safari,
Android: site settings > Permissions).

**Desktop / no-gyro detection:** before showing screen 1, check for
`window.DeviceOrientationEvent` support and (best-effort) whether the device
looks like a phone (or just rely on absence of orientation events firing
within a short timeout after screen 1's permission is granted). If gyro
data never arrives, show "Find Fairy needs a phone with motion sensors —
open this link on your phone" and stop. Keep this check simple; it's a
guard rail, not a robust device-detection system.

## 8. Milestones

### M1 — Core loop (feasibility gate)
Gyro + camera + procedural fairy rendering + opacity fade + edge glow +
audio shimmer + both catch modes (dev toggle) + find-5-score-time loop +
end screen with share. Fairies spawn at **random** bearings.

### M2 — Dark-corner spawning
Replace random spawn with brightness-driven spawn. Sample average luminance
of a grid of regions from the video feed (draw current frame to an offscreen
canvas, read pixel data, downsample/average). Calibrate against the current
room's actual brightness range at round start (2-second sampling window),
not an absolute threshold — the same room reads very differently at noon vs
at night. Spawn fairies in the darkest available regions/bearings.

Single function swap: `pickSpawnBearing()` goes from `Math.random()`-based
to `darkestRegion()`-based. Everything downstream (rendering, catching,
scoring) is unaware of the change.

### M3 — Pinch-to-catch (GATED — do not build without passing the spike)
See Gate 4 in BUILD_PLAN.md. Half-day spike first. If it passes, add
MediaPipe Hands as a third catch mode using the rear camera feed already
being captured. If it fails, delete the spike and M3 does not happen.

## 9. Config / tunables

All numeric constants (dwell duration, fade angles, hit-zone radius, drift
rate, luminance threshold, pixelsPerDegree, edge glow curve) must live in a
single `CONFIG` object at the top of the main file, not scattered as magic
numbers through the code. See TUNING.md for defaults and rationale.

## 10. Success criteria

- v1 ships as a working link
- 5 friends receive the link cold (no verbal explanation)
- **4 of 5 complete a full round (catch all 5 fairies) without asking how
  to play**
- Below that bar, the fix is onboarding/tutorial clarity, not new features
