---
file: frcds_tournament_v2_prd_v1.0.md
version: 1.0
author: Sam Cao
created: 2026-06-16
last_updated: 2026-06-16
description: Capture/plan PRD for TOURNAMENT v2 — the double-elim bracket is "super outdated": built before 3v3 and RoboRumble, registers per-PLAYER, and has overlapping-input / typing bugs. v2 = alliance-based 3v3 brackets, all current modes, and a registration UI fix.
ai_update: Update last_updated and version. Rename file to match. Append changelog at bottom.
---

# Tournament v2 (capture + plan)

Status: **capture + plan**, NOT started. From a live playtest: the existing tournament is "SUPER outdated."

## What's wrong today (playtest notes)
- **Outdated mode list.** The bracket only offers the original four modes (normal / shooter ball, tank fight, obstacle race). It's **missing the current modes** — ROBORUMBLE especially, and it predates 3v3.
- **Per-PLAYER registration.** You type individual entrant names (4–16). The interview model is now team-based: a competitor is an **ALLIANCE** (a 3-bot team), not one person.
- **Registration UI bugs.** "Overlapping inputs and typing things" — the name-entry overlaps other controls / mis-handles typing (the inline canvas name box vs the native input overlay, likely colliding).
- **No 3v3.** Brackets are 1v1 only; the locked model is 3 robots per side.
- **No map-select.** Predates the proposed per-match map-select screen.

## Goal
A tournament where **8 ALLIANCES** compete in a **3v3** bracket, across **any current game mode** (incl. RoboRumble), with a clean registration flow.

## Design

### Registration — by ALLIANCE, not player
- Register **alliance NAMES** (team names), not every individual. Default **8 alliances** (support a range, e.g. 4–16, power-of-two via byes as today).
- Each alliance fields a **3-bot lineup**. Open question (DECISION A): do you configure each alliance's 3 bots up front (drives/loadouts/CPU-tier), or is the lineup set at match time on the existing 6-seat claim grid? Recommend: **just the alliance name at registration; the 3-bot lineup is picked on the claim grid when that match starts** (reuses the live 6-seat setup, keeps registration light). Optionally remember a lineup per alliance between rounds.
- Humans vs CPU per bot is decided at match time (the claim grid already does this), so a tournament can be all-CPU sim, mixed, or all-human couch.

### Modes
- The tournament mode picker offers **every current mode**: normal ball, shooter ball, tank fight, obstacle race, **RoboRumble**. (Race is per-lane, not alliance-vs-alliance — DECISION B: keep race as the existing 1v1-per-lane within the bracket, or exclude race from 3v3 alliance tournaments. Recommend: race stays 1v1-lane; 3v3 applies to ball/tank/RoboRumble.)
- Each match runs the chosen mode at 3v3 (or the mode's natural format).

### Registration UI fix
- Replace/repair the overlapping name-entry. One clean list: add an alliance name (native input overlay positioned correctly, ≥16px to avoid iOS zoom, Enter commits, click an entry to remove), with no control overlap. Reuse the v3.6 mobile-safe inline-input pattern that the 6-seat grid rename uses, and make sure the input box doesn't sit under other buttons.

### Bracket
- Generic double-elimination for any field size via byes to the next power of two (today's engine) — keep it, just drive it off **alliances**.
- Bracket view shows **alliance names** + advance state; per-match claim screen shows the two alliances; result/champion screens by alliance.
- **Map-select per match** (per the RoboRumble PRD P3) slots in here: before each bracket match, pick the arena with a render.

### Seeding
- Keep RANDOM + QUALIFIER seeding. For 3v3, a qualifier is fuzzier (a whole alliance time-trials?) — DECISION C: keep RANDOM-only for v2, defer qualifier seeding for alliances.

## What specifically changes in the codebase (rough)
- `tour` registration: names array → **alliance** array; the name-entry screen (overlap/typing fix).
- Mode list in the tournament setup: add `roborumble` (+ confirm shooter/tank/race wiring) and default the match format to 3v3 where applicable.
- Match start from a bracket: route through the **6-seat claim grid** (`m2.tseats`) instead of the legacy 2-card claim, carrying the two alliances' identities + remembered lineups.
- Bracket/claim/result/champion screens: render by alliance name.
- Hook the per-match **map-select** screen.

## Suggested phases
- **T1 — Registration by alliance + UI fix** (alliance list, fix overlap/typing). Small, high-value, unblocks the rest.
- **T2 — 3v3 bracket matches via the 6-seat grid** + alliance identities through claim/result/champion.
- **T3 — Add ROBORUMBLE (and confirm all modes) to the bracket.**
- **T4 — Map-select per match** (shared with the RoboRumble PRD).
- **T5 — Polish** (remembered lineups per alliance, seeding for alliances, spectator).

## Open decisions
- **A**: lineup configured at registration vs at match time (recommend match time on the grid).
- **B**: race in a 3v3 alliance tournament (recommend keep race 1v1-lane).
- **C**: qualifier seeding for alliances (recommend defer; RANDOM only for v2).

## Constraints
Single self-contained HTML file, no assets/deps; exact-anchor patches with count-asserted tests; `node --check` + full battery green before each ship; tournament flow is largely headless-testable (registration model, bracket math, routing) — render/feel is Sam's eyeball.

## CHANGELOG
- v1.0 (2026-06-16): Initial capture from playtest — tournament is outdated (missing modes incl. RoboRumble, per-player not per-alliance, overlapping-input/typing bugs, no 3v3). v2 = 8-alliance 3v3 brackets, all modes, alliance-name registration, UI fix, map-select hookup. Phased T1–T5.
