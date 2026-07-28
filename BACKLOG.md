# Find Fairy — BACKLOG.md

**Nothing in this file is part of v1. Do not build any of it.**

This document exists to keep good ideas *out* of the v1 build, not to seed
them into it. Each item was raised during design, judged worth keeping, and
deliberately deferred. If an idea comes up during the build that isn't
here, add it here rather than building it.

---

## High priority (v1.1 candidates)

### Photo capture
Composite the canvas over the current video frame and export via
`toDataURL()` — a real photo of a fairy in the player's actual living room.

- **Why it matters:** the most shareable artifact this game could possibly
  produce. Strictly better than sharing a time.
- **Why deferred:** real work despite sounding simple — capture timing
  (catch the frame at the right moment), aspect ratio handling, and saving
  images on iOS Safari is awkward (no straightforward download; likely
  needs long-press-to-save with an instruction, or Web Share with a file).
- **Depends on:** nothing. Can be built any time after M1.

### Collection book
Each fairy is a distinct species. Caught ones persist in a grid across
sessions via `localStorage`. Fill the book over time.

- **Why it matters:** this is the actual retention mechanic. A 90-second
  game with a personal best has a short life; a collection gives a reason
  to open it again next week.
- **Why cheap:** the v1 rendering approach was chosen specifically to
  enable this. Species = a row in a params table (hue, particle count,
  orbit radius, orbit speed, core size, pulse rate). 15 species is an
  afternoon of parameter tweaking, not 15 commissioned art assets.
- **Depends on:** the per-fairy params object staying a clean struct in v1,
  even though v1 only uses one entry.

### Fairy species variety
Prerequisite for the collection book, but valuable on its own — visual
variety within a single round.

Includes the **fleeing fairy**: a rare species that bolts when centered.
This was considered as a global v1 mechanic and rejected, because it
directly contradicts dwell (which requires the fairy to stay centered). As
a rare *species* it's much better — most fairies are calm, one type is
skittish, and the contrast is the point.

---

## Medium priority

### Fairy drift
Slow bearing drift, a few degrees/second. Technically a one-line change
(`bearing += driftRate * dt`) and `CONFIG.driftRate` already exists for it.

Listed here rather than as a feature because it's a **post-Gate-2 tuning
decision**, not a build task. A perfectly static fairy tends to read as a
sticker rather than a creature, so this will probably end up enabled — but
only after static feel is validated.

### Sound design pass
The audio shimmer in v1 is functional guidance, not designed sound. A real
pass would add: catch confirmation, ambient room tone, per-species audio
signatures.

- **Constraint that never goes away (fact):** the iOS silent switch mutes
  Web Audio in Safari. No matter how good the audio gets, the game must
  remain fully playable and fully guidable with sound off.

### Difficulty options
Deliberately excluded from v1 — a 90-second game with no fail state doesn't
need a difficulty ramp, and adding one is complexity without payoff.

If it's ever revisited, the levers are: fairy count, `catchAngle`,
`dwellDuration`, `driftRate`. All already in `CONFIG`.

---

## Low priority / probably never

### Global leaderboard
Needs Supabase — a table, RLS policies, and anti-cheat that won't get
built. Breaks the single-file, no-backend property.

Matters at 100 players. This game is being built for personal use and
sharing with friends. Cut unless that changes.

### Multiplayer
Same round, same fairy bearings, two phones, race to 5. Needs real-time
sync infrastructure and shared spatial reference (which relative-bearing
zeroing explicitly doesn't provide — both players would have to zero
facing the same direction). Large scope, small payoff.

### Marker-based AR version
Considered and rejected during design. Genuinely better "wow" — objects
truly anchored to a physical card — but requires the player to have a
printed card or a second screen, which kills the send-a-link-and-play
property that defines this project.

Only revisit if the use case changes to an in-person event where cards can
be handed out.

### Outdoor / large-space mode
The whole design assumes a room. Untested outdoors, and M2's dark-corner
premise doesn't apply. No plan, noted only for completeness.

---

## Explicitly rejected (do not revive without new information)

- **Hard visibility cutoff** — either does nothing (falls outside camera
  FOV, ~26° in portrait) or makes fairies pop into existence mid-screen.
  The continuous fade replaced it.
- **No-camera fallback mode** — without the camera it isn't this game, it's
  a worse different game. Hard stop on denial instead.
- **Shipping both catch modes** — two catch modes means two tutorials, two
  difficulty curves, and no clear answer to how the game feels. Build both,
  test on device, delete the loser.
- **Absolute compass heading** — unnecessary. Relative zeroing at round
  start avoids a permission and a class of cross-platform bugs.
- **Three.js / WebGL** — ~600KB for five 2D sprites with no lighting or
  geometry. Canvas 2D is correct here.
