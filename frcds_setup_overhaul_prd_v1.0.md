---
file: frcds_setup_overhaul_prd_v1.0.md
version: 1.0
author: Samuel Cao
created: 2026-06-13
last_updated: 2026-06-13
description: PRD for the FRC Drive Showdown "one big build" — plow flatten + steal, unified Mario-Kart drive/controller/name setup screen, ball-count menu, alliance-count + sensitivity polish, and 3v3 mode last.
ai_update: Update last_updated and version. Rename file to match. Append changelog at bottom.
---

# FRC Drive Showdown — Setup Overhaul + Plow Steal + 3v3 (Big Build) PRD

## Problem
Six items have stacked up. They cluster on the H2H setup flow and the plow mechanic, so they ship as one build. Today the H2H flow is multi-step (pick mode -> pick drive -> match settings -> claim spots), drive and controller and name are assigned in separate places, plow stickiness varies by tier in a way that makes a CHAMPION nearly impossible to steal from, ball count is fixed, and robots are labelled only RED/BLUE.

## Current state (mapped)
- Flow: `p2modes -> p2drive (13-drive grid, per spot) -> p2settings -> p2claim (assign controller to RED/BLUE) -> match`.
- Drives: 4 classic + 6 holonomic + 3 steer = 13, in `DRIVES / HOLO_DRIVES / STEER_DRIVES`. Each has a name, color, and three control-hint/description lines.
- Per-drive physics already exist (`getDriveMobility`): push power, lateral maneuverability, grip — the raw material for stat bars.
- Settings rows include `CPU BOTS PER SIDE: 0 / 1 / 2` (alliance count already tunable), format, time, layout, contact.
- Name entry exists (high-score capture + mobile prompt fallback) and is reusable.
- Plow strip (v4.2): ball-hit strips at any tier; body-bump strips only on a loose low-tier plow (the thing being changed).

## Build order (your call: everything else first, 3v3 last)

### 1. Plow flatten — consistency across tiers
Drop the per-tier `grip` gate on body-bump strips. A bump to the bot body dislodges a ball at every tier, including CHAMPION. Ball-hit and hard-scatter unchanged. Capture reach is already consistent. Net: steal/strip behave identically at all levels.

### 2. Plow steal on overlap
When an opposing bot's plow overlaps a CPU carrier's held ball(s), the contacted ball transfers to the stealer instead of scattering away: it releases and is given velocity along the **stealer's** heading, so it ends up in front of the stealer under its push. Humans stay non-sticky (they push the stolen ball, they do not magnetically hold it).
- **Decision A (flag):** stealer scope. Recommend: any opposing main bot (human or CPU). Alliance bots already strip; this just redirects a ball-hit into a "take" rather than a "scatter."
- **Decision B (flag):** on a steal, send the ball to the stealer's heading-front (recommend) vs. just loose toward the stealer.

### 3. Unified setup screen (drive + controller + name) — the big one
Merge `p2drive` into `p2claim`. One screen with a card per spot. Each card shows: the rendered bot in its drive color, the drive name, three stat bars (Push / Maneuver / Grip), and a one-line description. Per spot you set: controller (human kb/gamepad/touch, or CPU + tier), drive, and a custom name.
- Drives grouped classic / holonomic / steer (13 is too many to flat-browse).
- **Decision C (flag):** group navigation — tabs (Classic | Holonomic | Steer) with arrows inside a group (recommend), vs. a single long scroll.
- **Decision D (flag):** custom name replaces RED/BLUE everywhere (HUD, results), with RED/BLUE kept only as the alliance color tag. Default name = drive name or "RED/BLUE" until renamed. Recommend: default to the drive name, editable.
- Removes the standalone p2drive step. Sensitivity (item 6) lives on this screen.

### 4. Tunable alliance count (extend existing)
Keep the `CPU BOTS PER SIDE` row; confirm range. **Decision E (flag):** keep 0/1/2, or extend (e.g., 0–3) — depends on how 3v3 defines a "side."

### 5. Ball-count menu
New settings row. **Decision F (flag):** values + scaling. Recommend an `AUTO` default that scales with total robots on the field (more bots -> more balls) plus manual overrides (e.g., 5 / 8 / 11 / 14). Balls spawn by cycling the existing symmetric start positions so the field stays fair from both ends.

### 6. 2P sensitivity slider
Replace the +/- sensitivity buttons with a draggable slider (reuse the single-player slider pattern), placed on the unified setup screen per human spot. Small.

### 7. 3v3 mode (LAST — structural)
Three main (drivable) bots per side, six spots total.
- **Decision G (flag):** humans max — 1 or 2 humans, rest CPU? Recommend: any spot can be human or CPU; practically 1–2 humans + CPUs.
- **Decision H (flag):** field/scoring — keep the current mirrored two-gap field (each side attacks the opponent gap, defends its own), just with more bots? Recommend yes (least invasive, scoring stays valid). The alternative (more gaps / wider field) is a much bigger change.
- Spawns: three start positions per side (derived from the existing two by adding a third lane).
- Claim screen scales to six cards (3 per side).
- This is the riskiest piece; built and tested on its own after 1–6 are green.

## Success criteria
- Setup is one screen: assign controller + drive + name per spot, with at-a-glance stats; no separate drive step.
- Plow steal feels like taking the ball; consistent across tiers; you can steal from a CHAMPION.
- Ball count is selectable and scales sensibly with player count.
- 3v3 plays without breaking scoring, own-goal safety, or the timer; the full existing battery stays green and new suites cover steal, ball-count, naming, and 3v3 spawns/scoring.
- Single self-contained HTML file; no assets; full battery green before ship.

## Constraints
- Single-file HTML, no build/assets/server. Exact-anchor patches with count==1 asserts; node --check after each; recovery copy before the version bump; full battery green before shipping.
- Ships as game v5.0 (major: setup-flow overhaul + new mode).
- Tier scoring balance stays as-is (you are happy with difficulty).

## Open decisions to confirm (A–H above)
A stealer scope · B steal target · C group nav · D naming default · E alliance range · F ball-count values/auto · G 3v3 humans · H 3v3 field/scoring.
My recommendation is noted on each; reply with any you want changed and "go" on the rest.

## CHANGELOG
- v1.0 (2026-06-13): Initial draft for sign-off.
