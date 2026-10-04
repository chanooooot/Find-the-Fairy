# STATUS

**Goal:** A static phone game where 4 of 5 cold players catch all five fairies without help.

**Now:** Review fixes applied. Synthetic checks pass; no physical-phone gate has been verified.

**Next:** Run `?gate1` on one iPhone and one Android. Record 60-second drift and FPS below.

**Blocked:** Physical-phone measurements. Freeze feature work and later gate testing until Gate 1 passes.

| Gate 1 measurement | iPhone | Android |
| --- | --- | --- |
| Phone / OS / browser | Pending | Pending |
| Drift after 60 seconds | Pending | Pending |
| FPS | Pending | Pending |
| Result | Unverified | Unverified |

Pass: drift under 15° and at least 30 FPS on both phones. Marginal drift of
15–30° requires `CONFIG.catchAngle: 12`. Kill: drift over 30° or FPS under
20 on either phone. Results outside those bands need a decision; do not
mark them as passed.

Gate 2 catch-mode choice, Gate 3 lighting checks, Gate 4 combined-load
measurements, and the 4-of-5 cold-player test are all pending. Existing M2
and pinch code remain experimental; their presence is not gate approval.

_Updated: 2026-10-04_
