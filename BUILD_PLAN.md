# Find Fairy — BUILD_PLAN.md

Phased build with hard verify gates. Do not proceed past a failed gate —
stop, report status, wait for a decision. Each gate must be tested on a
real physical phone (iPhone + one Android minimum), not a desktop browser
simulator. DeviceOrientation and getUserMedia behavior on desktop is not
representative.

---

## Gate 1 — Sensor feasibility (≈4 hours)

**Build:** Bare-minimum page. Permission flow (both steps). Camera feed
rendering as background. One single fairy, procedurally drawn, placed at a
fixed relative bearing. No catch mechanic yet, no scoring, no guidance UI —
just: does the fairy appear to stay roughly in place as you turn away and
back?

**Test protocol:**
1. Open on iPhone, grant both permissions
2. Face an arbitrary direction, note fairy position on screen (or that it's
   correctly off-screen / faded)
3. Turn 360° slowly back to start, ~60 seconds
4. Measure apparent drift: how far off is the fairy from its original
   screen position when you return to start?
5. Repeat on Android device
6. Note frame rate (rough visual judgment or `performance.now()` delta
   logging is fine, no need for a full profiler)

**Pass:** drift under 15° after 60s of normal handling; ≥30fps on both
devices

**Marginal (15-30° drift):** widen the catch hit-zone radius in CONFIG to
12° (from whatever smaller default was tried) and continue — do not treat
this as a blocker, just a tuning response

**KILL: drift over 30°, or frame rate under 20fps on either device.** This
means gyro cannot reliably carry the aiming mechanic. Stop the project.
Report back rather than attempting workarounds — this is a go/no-go
decision, not a tuning problem.

---

## Gate 2 — Does it feel good (end of M1)

**Build:** Full M1 scope — both catch modes behind dev toggle, opacity
fade, edge glow, audio shimmer, find-5-score-time loop, end screen with
personal best and share button. Random spawn (M2 not started yet).

**Test protocol:**
1. Play through a full round on each device using dwell mode
2. Play through a full round on each device using tap mode
3. Decide which catch mode wins on feel — delete the other, remove the dev
   toggle
4. Play three more rounds back to back, unprompted

**Pass:** you play three rounds in a row without being told to / without
forcing yourself to for testing's sake

**KILL: it's boring with the camera on.** If the core loop doesn't hold
attention with the actual room visible behind it, no later feature (M2's
dark corners, M3's pinch) will fix that — the camera-driven premise itself
isn't landing. Stop and report rather than proceeding to M2.

---

## Gate 3 — Brightness calibration (M2)

**Build:** `pickSpawnBearing()` swapped from random to darkest-region
detection. 2-second per-round calibration sampling.

**Test protocol:**
1. Play a round in your living room, daytime
2. Play a round in your living room, nighttime / lights off in one area
3. Play a round in a second room with different lighting character
4. In each, check: do fairies spawn in bearings that look/feel like the
   actually darker parts of that room?

**Pass:** sensible dark-region spawning holds across all three conditions

**Fail (not a project kill):** ship M1 behavior as the final version —
random spawn stays permanent, M2 code is either fixed with more tuning time
budgeted, or shelved. M2 was always upside on top of a complete M1, not a
required feature. Report which outcome and why.

---

## Gate 4 — Pinch spike (½ day, only before any M3 work)

**Build:** Standalone bare test page, NOT integrated into the main game.
Rear camera feed + MediaPipe Hands, hand held at arm's length (simulating
actual play posture — one hand holding phone, one hand reaching toward rear
camera).

**Test protocol:**
1. Test pinch gesture recognition in bright room
2. Test in normal indoor lighting
3. Test in a dim/shadowed area (this is the condition M2 actively creates —
   fairies live in dark corners, so this is not an edge case, it's close to
   the primary use case)
4. Record recognition success rate (rough count: X of 10 attempts
   recognized) and frame rate for each condition, combined with gyro+camera
   already running

**Pass:** ≥80% pinch recognition in the dim-light condition specifically
(bright/normal are necessary but not sufficient), ≥18fps combined load

**KILL (fail): dwell/tap stays as the permanent catch mechanic. Delete the
spike code. Do not iterate on the spike trying to hit the bar** — if it
doesn't clear the bar in a half day, the rear-camera-hand-tracking-in-
shadow combination isn't reliable enough on current phone hardware in
general, and more tuning time on the spike won't change that fundamentally.

---

## Sequencing summary

```
Gate 1 (sensor feasibility, ~4hrs)
   ↓ pass
M1 full build (catch modes, guidance, loop, end screen)
   ↓
Gate 2 (feel test, decide catch mode)
   ↓ pass
M2 build (brightness spawn)
   ↓
Gate 3 (calibration test across rooms/lighting)
   ↓ pass or fail-gracefully-to-M1-final
[optional] Gate 4 spike (pinch, ½ day)
   ↓ pass only
M3 build (pinch catch mode)
```

Do not skip ahead. Do not build M2 before Gate 2 passes. Do not attempt
Gate 4 before M1+M2 are both settled — pinch is the highest-risk, lowest-
priority piece of this project by design.
