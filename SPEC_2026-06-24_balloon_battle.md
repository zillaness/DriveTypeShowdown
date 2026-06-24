# BALLOON BATTLE — mode spec (2026-06-24)

**SPEC ONLY — not built.** Sam's design, captured from voice (the native transcript
mangled it twice; this is the cleaned-up version). It's a real activity Sam runs
**IRL in robotics class — the kids love it**, because it teaches *driving skill*
(not just field-centric square-driving) and motivates *3D printing* (they print
their own spikes). Bring it to the game as a mode.

---

## The concept (Mario-Kart-style)
Each robot carries **balloons on its rear**; you **pop the enemies' balloons** by
driving your **front spikes** into them with enough **force**. Lose all your
balloons → you're out. Last robot (or last alliance) with a balloon wins.

Runs **on top of any drive base** — arcade / tank / swerve / mecanum (the common
ones) — so it's a layer over the existing drive system, not a special chassis.
The whole point is it rewards *driving* (lining up your spikes on their rear
balloons while keeping your own rear away).

## Balloons
- **3 per robot, mounted on the REAR**: center, left, right.
- Lateral spread: a bit **wider than the 25% / 75% marks**, not all the way to the
  edge. **Tweakable** — Sam wasn't sure of the exact spacing; make it a constant.
- Each balloon is an individual poppable target attached at a fixed offset behind
  the chassis (rotates with the bot's heading).
- **Don't pop on mere contact** — a balloon only pops when hit with enough
  **inertia / force** (closing speed above a threshold). So a gentle bump is safe;
  a committed spike-charge pops it. → reuse the existing **impact-magnitude / "ORE"
  system** (`p2ImpactMag`, already used in RoboRumble & these modes for push
  tiebreakers / closing-speed-scaled damage). `pop if impactMag > balloonPopThreshold`.

## Spikes
- **Front spikes** — the popping tool; a front-arc zone that pops a balloon it
  contacts hard enough.
- **Optional "chariot spikes" on the wheels** (sides) — secondary pop zones.
- **Spikes have some HEALTH** — they can be worn/broken (so positioning + not
  over-committing matters; mirrors printed spikes breaking IRL). At 0 health a
  spike is gone (can't pop with it until... repaired? next life? TBD).
- **Eventually a spike EDITOR** — a screen where you place your spikes on the
  chassis (front / sides / wheels), like the map editor. Mirrors the IRL
  3D-print-your-own-spikes loop. (v1 can ship a fixed default spike layout; the
  editor is a follow-up.)

## Pushing / grip (Sam unsure — tabled sub-questions)
- Pushing battles are "equal," but the **impact-magnitude (ORE) system** already
  factors **how fast a bot was travelling before contact** to decide the
  push/tiebreaker — reuse it so a faster, committed driver wins the shove.
- A **grip system** (different drive bases = different grip/traction) — Sam wasn't
  sure if it exists or is wanted. NOTE: `bbDriveFamily` + `tankPush` already give a
  TANK-family drive a shove bonus; that's the closest existing "grip" lever. Decide
  later whether to expand into per-drive grip.

## Win condition
- **Elimination**: a bot with 0 balloons is OUT (like Mario Kart). Last bot / last
  alliance standing wins. (Could also support a timed "most balloons survive"
  variant later.)

## Build notes (when greenlit)
- New 2P mode (or a RoboRumble game-mode variant) — reuse the RoboRumble engine:
  drives (`withBot`/`getInp`), arena, contact pass, `p2ImpactMag`, team shades,
  result/series nav, the pause menu.
- **Balloons**: per-bot array of `{dx,dy,popped}` offsets behind the chassis;
  draw each as a colored balloon at `botPos + rotate(offset, b.h)`. On the bot-bot
  contact pass, when an attacker's **front-spike arc** overlaps a victim **balloon**
  AND `p2ImpactMag(attacker,victim) > popThreshold` → pop that balloon (sfx + a
  little burst FX). Owner can't pop their own.
- **Spikes**: front-arc (like the buzzsaw/piston front gate) + optional side arcs;
  a small `spikeHp` per spike, drained when it pops a balloon or takes a big hit.
- **Elimination**: when a bot's live-balloon count hits 0 → `bbKill`-style out
  (or just "deballooned, drive-only" then out). Reuse `bbCheckResult` (last side
  standing).
- **Drive-agnostic**: it's a layer — any of the existing drives works; that's the
  feature (encourages learning each drive).
- **Gating**: likely ship behind EXPERIMENTAL FEATURES first (a new mode is a big
  surface), then promote to a real mode tile once it plays well. Per the standing
  "when in doubt, gate" rule.

## Tuning constants (first guesses)
`balloonCount:3`, `balloonSpread:~0.30·halfWidth` (a bit wider than ¼/¾),
`balloonRearOffset`, `balloonPopThreshold` (impact-mag needed to pop),
`spikeHp`, `spikeArc` (front), `chariotArc` (sides).

## Open decisions for Sam
1. Exact balloon spread (start a touch wider than ¼/¾; tune in playtest).
2. Spike health: do broken spikes come back (next life? repair pad?) or stay gone?
3. Grip system: expand per-drive grip, or just reuse `tankPush`/impact-mag?
4. Standalone mode tile vs a RoboRumble game-mode? Gated-experimental first?
5. Spike editor now or after a fixed-layout v1?
