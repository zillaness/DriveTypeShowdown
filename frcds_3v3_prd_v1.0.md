---
file: frcds_3v3_prd_v1.0.md
version: 1.0
author: Sam Cao
created: 2026-06-13
last_updated: 2026-06-13
description: PRD for FRC Drive Showdown Phase 7 — 3v3 head-to-head (ships as game v5.1), built on the locked interview model.
ai_update: Update last_updated and version. Rename file to match. Append changelog at bottom.
---

# FRC Drive Showdown — Phase 7: 3v3 Head-to-Head (PRD, ships as v5.1)

## Problem
Extend H2H from two main bots plus role-only alliance bots to up to three robots per side, each independently human or CPU, on the existing mirrored two-gap field, while keeping the match mirror-fair and never breaking own-goal safety.

## Current state (mapped)
- Two claimable main spots: `b2.bots[0]` (RED), `b2.bots[1]` (BLUE). `b2.cpus` = 0–2 alliance role bots per side (guard/disrupt/player support; they do NOT carry or run the scoring cycle).
- The engine hard-assumes two mains: foe lists are `[b2.bots[1-p]]` + opposing cpus; bot identity resolves as `ro===b2.bots[0]?0:b2.bots[1]?1:ro.al`; sticky-carry and the scoring cycle run for main CPU spots only; pin penalty is main-vs-main; input routing and `cpuH2H` are length 2.
- Setup screen (v5.0) renders two large cards.
- CPU tuning in 2P is tier-only (ROOKIE..CHAMPION) per spot. The granular SP `cpuSettings` sliders/presets are not exposed in 2P.

## Locked model (from the user-input-protocol interview)
- The field is always three per side (six robots).
- Each slot is independently human or CPU; mixed teams expected (e.g. 2H+1 vs 1H+2).
- Mirror-fair fill: let `competitors = clamp(max(humans on RED, humans on BLUE), 1, 3)`. Each side fields `competitors` competitor slots (humans first, remaining filled by full scoring CPUs) plus `3 − competitors` support alliance bots, equal on both sides.
  - 2H vs 2H → 2 humans + 1 alliance each.
  - 2H vs 0 → 2 humans + 1 alliance  vs  2 full CPUs + 1 alliance.
  - 1H vs 0 → 1 human + 2 alliance  vs  1 full CPU + 2 alliance (this is today's behavior).
- Competitor CPU slots are drive- and tier-configurable and nameable. Support alliance bots auto-fill with a default look and are not individually configured.

## Design

### Bot model
- Unify into one robot list. Each robot carries `{al, role:'main'|'alliance', spot, drive, name, ctrl}`. Competitor mains (role 'main', human or full CPU) carry + run the scoring cycle (CPU) or take human input; alliance bots (role 'alliance') run the existing support brain and do not carry.
- Rewrite the two-main assumptions to iterate the list by alliance and role: foe lists (all opposing robots), identity/attribution, sticky carriers, the scoring cycle, pin (main-vs-main across any mains), input routing, and `cpuH2H` (now keyed per main spot, variable count).
- Spawn lanes: three per side derived from the current two (add a center/offset lane). Competitor mains take inner lanes; alliance bots fill the outer lane.

### Setup screen (six spots)
- Three tighter cards per side; one card editable-at-a-time per side (tap to expand its drive picker, stats, controller, name, sensitivity; the others show a compact summary). My latitude per the interview.
- `m2.claim / drive / name / sens` become per-side arrays (length 3 each) or a 6-length flat array.
- Live fill readout per side, e.g. "RED: 2 humans + 1 alliance", "BLUE: 2 CPU + 1 alliance", computed from the mirror-fair rule.
- Start is allowed once at least one competitor exists; empty competitor slots resolve to full CPUs per the rule, remaining slots to alliance bots.

### CPU granularity (DECISION I — flag)
- Recommend: tier-only per CPU spot (ROOKIE..CHAMPION), as today. Per-bot sliders for up to six bots would clutter the screen.
- Alternative: also let a CPU spot select one of the saved SP presets (`cpuPresets`). Optional, separate from core 3v3.

### Scoring / fairness
- Mirrored two-gap field unchanged. Score stays `[red, blue]` by alliance. Own-goal safety preserved (the gap crossed determines the scorer, independent of bot count).
- The competitor-count balancing keeps both sides mirror-fair.

## Success criteria
- Up to three per side, any human/CPU mix, mirror-fair fill matches the interview examples.
- 1v1 and 2v2 still work (the model degrades to fewer competitors + more alliance).
- Own goals stay 0 at every tier; CPU mains still score; no NaN/stuck states across a full match with six bots.
- Full existing battery stays green; new suites cover the fill rule, spawn lanes, multi-main foe/scoring/strip, input routing, and own-goal safety with three mains per side.
- Single self-contained HTML file.

## Constraints
- Single-file, exact-anchor patches with count==1 asserts, `node --check` after each, recovery copy before the bump, full battery green before ship.
- Ships as game v5.1. Built and tested in isolation (riskiest piece).

## Open decision
- Decision I: CPU granularity in 3v3 — tier-only (rec) vs add saved-preset selection.

## CHANGELOG
- v1.0 (2026-06-13): Initial draft for sign-off, built on the locked interview model.
