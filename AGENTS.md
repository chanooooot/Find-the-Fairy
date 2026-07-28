# AGENTS.md — Find Fairy

## What this is

A gyro-controlled AR browser game. Camera feed as backdrop, gyroscope for
aiming, fairies hidden at bearings around the player on a full sphere. Find
and catch 5, score is elapsed time.

Read `SPEC.md` first. Then `BUILD_PLAN.md`. Then `TUNING.md`.
`BACKLOG.md` is deferred work — **do not build anything in it.**

## Hard constraints

- **Zero cost, zero infrastructure.** Static files on GitHub Pages. No
  backend, no database, no API keys, no accounts, no paid services.
- **No build step.** Single HTML file preferred; HTML + 1-2 JS files is the
  absolute maximum. No bundler, no npm install, no framework.
- **No dependencies** unless genuinely required. Everything in M1 and M2 is
  native browser API: Canvas 2D, Web Audio, DeviceOrientation, getUserMedia.
  The only dependency that may ever be justified is MediaPipe Hands, and
  only in M3, and only after Gate 4 passes.
- **Phone only.** iOS Safari 16+ and Android Chrome, portrait. Desktop gets
  a "open this on your phone" message, not a fallback mode.

## Working style

Follow the Karpathy guidelines:

**Think before coding.** State assumptions explicitly. If multiple
interpretations exist, present them rather than silently picking one. If a
simpler approach exists than what the spec describes, say so — the spec is
a considered design, but it isn't sacred, and pushback is welcome.

**Simplicity first.** Minimum code that solves the problem. No speculative
abstractions. No configurability that wasn't asked for. No error handling
for impossible scenarios. This is a single-file game — a class hierarchy, a
state machine library, or a plugin system would all be wrong. If you write
200 lines where 50 would do, rewrite it.

**Surgical changes.** When editing, touch only what the task requires.
Don't refactor working code. Don't "improve" adjacent formatting. Every
changed line should trace to a specific requirement.

**Goal-driven.** Each milestone has a gate in `BUILD_PLAN.md` with concrete
pass/fail numbers. Build toward the gate, then stop and report.

## The gates are real

`BUILD_PLAN.md` defines four gates with hard numeric kill criteria. These
are decisions, not suggestions:

- **Do not proceed past a failed gate.** Stop and report status.
- **Do not attempt workarounds on a kill condition.** Gate 1 failing means
  gyro can't carry the mechanic — that's a go/no-go, not a tuning problem.
- **Do not iterate on the Gate 4 spike** trying to hit the bar. Half a day,
  pass or delete.
- Every gate must be verified on a **real physical phone**, both iOS and
  Android. Desktop browser behavior for DeviceOrientation and getUserMedia
  is not representative.

## Config discipline

Every tunable number lives in **one `CONFIG` object at the top of the main
file.** See `TUNING.md` for the values and why each one is what it is.

Do not hardcode these inline. Tuning happens iteratively on a phone by
editing one object — if `dwellDuration` appears in three places in the
render loop, tuning becomes miserable and won't happen properly.

## Things that are already decided — don't relitigate

These were worked through in detail during design. If you think one is
wrong, say so explicitly rather than quietly building something else:

- **No SLAM / plane detection / marker tracking.** Not free on iOS. This is
  screen-space AR by necessity and by choice.
- **Relative bearings, no compass.** Zero the reference frame at round
  start. No absolute north, no extra permission.
- **Fairies are static in M1.** `driftRate: 0`. This isolates sensor feel
  from motion during gate testing. Drift comes later as a tuning knob.
- **Procedural fairies, no image assets.** Additive-composited radial glow
  plus orbiting particles. This is what makes them look like they
  illuminate the real room, and it's what makes the backlog's collection
  book cheap later.
- **No hard visibility cutoff.** Continuous opacity fade, 30°→12°. A hard
  cutoff either does nothing (falls outside camera FOV) or makes fairies
  pop into existence.
- **Two-step permission gate, hard stop on denial.** No no-camera fallback
  mode — without the camera it isn't this game.
- **Both catch modes get built** behind a dev toggle, tested on device at
  Gate 2, and **the loser is deleted.** Two catch modes must not ship.
- **No leaderboard, no difficulty progression, no multiplayer in v1.**

## Scope discipline

The backlog exists to keep good ideas out of v1, not to seed them into it.
If you find yourself thinking "while I'm here, I could also add..." —
that's the signal to stop and put it in `BACKLOG.md` instead.

## Ask, don't assume

When the spec is ambiguous or a decision seems load-bearing and unspecified,
ask rather than picking silently. Specific things likely to need a decision
during build: exact easing curves, sprite particle behavior details, copy
for the permission and error screens, share text wording.
