# Find Fairy — TUNING.md

Every number in this file is a **starting guess**, not a settled value.
They exist so the implementer has somewhere sensible to start and — more
importantly — so they all live in **one `CONFIG` object at the top of the
main file** rather than scattered as magic numbers through the code.

The single most important rule in this document: **do not hardcode these
values inline.** Tuning happens on a real phone, iteratively, by editing
one object. If dwell duration is buried in three places in the render loop,
tuning becomes miserable and it will not get done properly.

---

## The CONFIG object

```js
const CONFIG = {
  // --- Session ---
  fairyCount: 5,

  // --- Visibility / opacity fade (degrees of angular distance) ---
  fadeStartAngle: 30,      // beyond this: fully invisible
  fadeEndAngle: 12,        // within this: fully solid

  // --- Catch ---
  catchAngle: 8,           // must be within this angle to be catchable
  dwellDuration: 1.2,      // seconds of continuous hold to catch
  dwellDecayOnBreak: true, // true = decay gradually, false = instant reset

  // --- Projection ---
  cameraFovDegrees: 52,    // assumed horizontal FOV, portrait rear camera

  // --- Movement (post-M1 only, leave at 0 for M1) ---
  driftRate: 0,            // degrees/second of fairy bearing drift

  // --- Guidance ---
  edgeGlowMaxOpacity: 0.35,
  audioShimmerEnabled: true,

  // --- M2: brightness spawning ---
  calibrationSeconds: 2,
  luminanceGridCols: 8,
  luminanceGridRows: 6,
  darkRegionPercentile: 30,  // spawn in the darkest 30% of sampled regions

  // --- Dev only — MUST be removed before shipping ---
  catchMode: 'dwell',      // 'dwell' | 'tap'
};
```

---

## Rationale per value

### `fairyCount: 5`
Locked by design, not really a tunable. Five gives a ~60-90 second session.
Do not add difficulty scaling by increasing this across rounds — v1 has no
progression by explicit design decision (the only progression is the
player's own best time).

### `fadeStartAngle: 30` / `fadeEndAngle: 12`
The fade must *straddle* the camera FOV boundary to work. With a ~52°
horizontal FOV in portrait, roughly 26° of angular distance is the screen
edge. So:
- 30° start = fairy begins faintly materializing just before it would
  enter frame
- 12° end = fully solid well inside the screen, near center

If fade start is set below ~26° the fairy pops into existence mid-screen,
which reads as a rendering bug rather than a magical reveal. **Do not set
`fadeStartAngle` below `cameraFovDegrees / 2`.** This was an explicit design
finding, not an accident.

Interpolation: use smoothstep, not linear — linear fade has a visible hard
"start" moment at the boundary.

### `catchAngle: 8`
Deliberately generous. (fact) Yaw drift of 5-20° over a session is expected
and is not corrected. A generous hit zone means drift reads as the fairy
"floating" slightly, which for a magical creature is invisible — it's the
one bug that's free to have. A tight catch angle would turn drift into a
frustrating aiming bug.

Raise to 12° if Gate 1 measures drift in the marginal 15-30° band.

### `dwellDuration: 1.2`
Long enough that it feels like *focusing on something shy*, short enough
that it doesn't become a chore ×5 per round. Test 0.8 / 1.2 / 1.6 on
device. If dwell loses to tap at Gate 2, this whole block gets deleted.

### `dwellDecayOnBreak`
Untested design question. Instant reset is more punishing and makes shaky
hands very frustrating; gradual decay is more forgiving. Start with decay,
try instant, pick by feel.

### `cameraFovDegrees: 52`
(fact) Typical phone rear camera horizontal FOV in portrait is ~50-55°.
This drives `pixelsPerDegree` for screen projection. **Verify empirically
at Gate 1** — if fairies feel like they move across the screen faster or
slower than your actual head/body turn, this number is wrong, and it's the
first thing to correct. A mismatch here makes the whole thing feel subtly
"off" in a way that's hard to diagnose if you're looking anywhere else.

### `driftRate: 0`
**Must stay 0 for M1.** Static fairies isolate sensor feel from motion
during Gate 1 and Gate 2 testing. If something feels wrong on device, it
must be traceable to the gyro, not confounded by fairy motion. After Gate 2
passes, try 2-5 deg/sec — a perfectly motionless fairy tends to read as a
sticker rather than a creature.

### `edgeGlowMaxOpacity: 0.35`
Subtle by intent. Edge glow is a hint, not a HUD arrow. If it's strong
enough to be read as a UI element, it's too strong.

**Open question for on-device tuning:** the opacity fade may already provide
enough directional information on its own, making edge glow redundant. Two
guidance systems doing the same job is exactly the sort of redundancy worth
cutting. Test with `edgeGlowMaxOpacity: 0` before deciding. Do not remove
the code without running that test.

### `audioShimmerEnabled: true`
(fact) The iOS physical silent switch mutes Web Audio in Safari. A
meaningful share of players will never hear this. It is therefore a bonus
channel only — **the game must be fully playable and fully guidable with
sound off.** Never move guidance-critical information into audio.

### M2 brightness values
`calibrationSeconds: 2` — sample the room's actual luminance range at round
start. **Thresholds must be relative to the current room's measured range,
never absolute.** The same room at noon and at midnight produces completely
different absolute values; an absolute threshold breaks the game for half
your players.

`luminanceGridCols/Rows: 8×6` — coarse is fine and cheap. You're finding
"which direction is dark," not doing computer vision.

`darkRegionPercentile: 30` — spawn among the darkest 30% of sampled
regions. Too low (e.g. 5%) and all fairies cluster in one corner; too high
(e.g. 60%) and the dark-corner premise stops being noticeable.

---

## Tuning session checklist

Do this on a real phone, with the game running, editing only `CONFIG`:

1. `cameraFovDegrees` — does fairy screen movement match your body turn?
2. `catchAngle` — can you catch without frustration, but not by accident?
3. `dwellDuration` — focused, not tedious?
4. `fadeStartAngle`/`fadeEndAngle` — does it materialize, or pop?
5. `edgeGlowMaxOpacity` — test at 0 first; is it needed at all?
6. `driftRate` — only after everything above is settled
