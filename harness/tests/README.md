---
file: README.md
version: 1.6
author: Samuel Cao
created: 2026-06-12
last_updated: 2026-06-12
description: Test battery for FRC Drive Showdown. Run every suite against every new version before delivery.
ai_update: Update last_updated and version. Append changelog at bottom.
---

# FRC Drive Showdown — test battery

## Run
1. Extract game JS: `python3 -c "import re;open('/tmp/g.js','w').write(re.search(r'<script>(.*)</script>',open('GAME.html').read(),re.S).group(1))"`
2. Point suites at it: each smoke reads a hardcoded `/tmp/gNN.js` path near the top — sed it to `/tmp/g.js`.
3. `node --check /tmp/g.js` then `node smokeNN.js` for every suite, plus `node balance.js /tmp/g.js` (REQUIRED — must print ALL SCENARIOS BALANCED).

## Suites
balance (req'd every version) · 9 formats/series/pin · 10 courses/hazards · 82 mirrored L/R goals ·
12 tournament double-elim · 13 touch 2P · 30 polish/gp-menu · 31 gp 2P nav/mirrored-clean ·
32 registration UI · 33 single-elim · 34 SP ghosts · 35 ghost toggle/2P removal · 351 CLEAR ALL purge ·
36 mobile cycle · 37 any-pad + rumble · 38 H2H CPU + SFX (claim/tier UI, 5-tier table, rubber-band
interpolation, seeded ball/tank/race brain matches, LoS fire gating, hazard-run bounds, SFX safety +
mute persistence — 44 asserts, deterministic) · 39 ghost export/import (bundle/merge pure fns, key
labels, imported tagging, GHOSTS submenu nav, malformed-file reject, CLEAR ALL purge — 26 asserts) ·
40 H2H CPU v3.10 — ball-mode speed+turn coupling to player sens (all tiers), CHAMPION edge, intake denial,
shot-block/screen bias, anti-double-team, alliance directed scoring + own-goal guard — 8 asserts, deterministic.
41 H2H shot-block v3.10.1 — projectile-vs-robot collision in H2H shooter: front-face catch (with magazine room),
motion-scaled block (parked dead-stops, moving carries), alliance-CPU soft-wall + alliance credit, no self-collision
at the fire spawn — 9 asserts, deterministic (calls b2ProjBlock directly on hand-placed state, no seed).
42 achievements v3.11 — engine unit tests: ACH_DEFS shape (13 defs, 4 secret), idempotent achUnlock, unknown-id reject,
cumulative achDrive/achBeatTier thresholds with dedupe and non-numeric-tier guard — 12 asserts, deterministic (engine only).
43 H2H CPU normal-mode finish v3.12 — integration proof CHAMPION drives a lane ball through the gap (no longer stalls short),
plus unit checks for the in-lane aligned drive-through and the behind-side gate — 3 asserts (1 seeded integration, 2 direct cpuBallUpdate).
(smoke11 retired — 2P ghosts removed in v3.5.)

## Harness gotchas (hard-won)
- Node 21+: `navigator` is a built-in getter; stub via `Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true})`.
- Game binds keydown on WINDOW; capture via the window stub's addEventListener.
- Mock clock advances only on performance.now() calls — burn it past cooldowns (rumble 150ms).
- localStorage proxy: any accessor you define must be `configurable:true` or ownKeys traps throw.
- getInp must run inside withBot(p,bot,fn) — it reads the global `robot`.
- Ball drag ≈0.87/frame: a 300px/s shove travels ~38px total; size test impulses accordingly.
- CPU brain tests: seed Math.random with an LCG for determinism; restore it after. smoke38 seeds 0x2204 (ball), 0x1678 (tank), 0x254/0x1114 (race). smoke40 seeds 0x40A/0x40B; most smoke40 asserts call cpuBallUpdate/b2CpuUpdate directly with hand-placed state (no full match), so they need no seed.
- smoke38's hazard-run assert is intentionally bounded, not a completion check: the race CPU cannot solve sweeper+shelf compound crossings (v3.8 known limitation).
- smoke39 needs the localStorage proxy (ownKeys trap) so ghostList's Object.keys(localStorage) scan works — copy it from smoke351, not the plain stub.
- ALWAYS count-assert harness edits too — two silent no-op edits bit this project.

## CHANGELOG
- v1.0 (2026-06-12): Initial bundle, suites through v3.7.
- v1.1 (2026-06-12): Added smoke38 (H2H CPU + SFX, 44 asserts) for game v3.8. Documented brain-test seeding and the hazard-run bound.
- v1.2 (2026-06-12): Added smoke39 (ghost export/import + GHOSTS submenu, 26 asserts) for game v3.9. Noted the localStorage-proxy requirement for ghost-key enumeration.
- v1.9 (2026-06-13): Re-baselined smoke45 strip tests to the v4.2 hit-location model (11 asserts): a body bump knocks a ball off a loose ROOKIE plow but not a CHAMPION plow; a hit on a carried ball strips it at any tier; a hard hit on the cluster scatters the whole load. Tightened the capacity sub-test ball placement to fit the now-consistent capture cone. Full battery: 125 asserts across ten suites, all green.
- v1.8 (2026-06-13): Added smoke48 for game v4.1 (sticky-plow tuning + unstick + end countdown, 5 asserts): the normal-mode cycle unstick (a pinned CPU breaks free after ~3s and jukes away from the opponent toward open space), the pin-penalty alliance void (a clean main-vs-main wall pin still triggers, but an alliance bot in the cluster voids it), and the 5-4-3-2-1 end-of-match countdown (verified via the b2._endCount beep gate stepping 5->1). Re-baselined smoke45's strip tests for the tier-scaled gradient (now 10 asserts): a loose ROOKIE plow drops the ball to ordinary contact, a tight CHAMPION plow resists soft contact, and a hard hit scatters even a CHAMPION load; alliance teammates are no longer carriers. Full battery: 124 asserts across ten suites, all green.
- v1.7 (2026-06-13): Added smoke45/46/47 for game v4.0 (sticky-plow scoring rework). smoke45 (sticky engine, 9 asserts): front-cone capture, per-tier capacity cap (CHAMPION 6 / ROOKIE 1), carry-follow, release-score through the opponent gap, soft strip pops the front ball, hard hit scatters all, no friendly fire, and human main bots get no sticky plow. smoke46 (scoring cycle, 5 asserts): the hard zero-own-goal guarantee at every tier, CHAMPION averages >=30 goals/90s, CHAMPION out-scores ROOKIE, the bot never parks at its own gap, and no objective thrash. smoke47 (shooter unstick, 4 asserts): a pinned bot breaks free toward center after ~2.5s and steers to center, a freely-moving bot never false-triggers, normal mode stays cycle-driven. Re-baselined smoke38 (its D-block clear/defend sub-tests now assert the main CPU is pure offense and stays clear of its own gap) and smoke43 (its two push-finish units replaced with cycle units: a loaded CHAMPION drives toward the opponent gap, and the cycle target is never at the own gap). CPU-brain tests seed Math.random with an LCG; the sticky/cycle suites reuse the start helper (claim a CPU slot, run the countdown).
- v1.6 (2026-06-12): Added smoke43 (H2H CPU normal-mode scoring finish, 3 asserts) for game v3.12: a seeded integration test that CHAMPION pushes a parked lane ball through its gap, plus the in-lane aligned drive-through and the behind-side gate. The finish suppresses the in-lane standoff and drives through G.ex only when aligned; own-goal guard preserved.
- v1.5 (2026-06-12): Added smoke42 (achievements engine, 12 asserts) for game v3.11: definition-list shape, idempotent unlock + unknown-id reject, and the cumulative drive/tier thresholds (5 distinct to unlock, dedupe, non-numeric tier ignored). Engine-only — exercises achUnlock/achDrive/achBeatTier directly, no full match.
- v1.4 (2026-06-12): Added smoke41 (H2H shot-block, 9 asserts) for game v3.10.1: front-face catch, motion-scaled block (parked dead-stop vs moving push + direction), full-magazine fallthrough, alliance-CPU dead-stop + credit, and no self-collision at the RR+14 fire spawn. Hardened smoke82's shooter far-goal case to park the idle defender out of the shot lane — it had been scoring a shot THROUGH blue's body, which the v3.10.1 collision fix correctly now blocks; parking the defender isolates the far-goal scoring/credit unit under test.
- v1.3 (2026-06-12): Added smoke40 (H2H CPU v3.10 rework, 8 asserts: ball-mode speed/turn coupling to player sens + CHAMPION edge, intake denial, shot-block tracking, anti-double-team, alliance directed scoring + own-goal guard) for game v3.10. Hardened smoke38's clear sub-test to reset bot position before the parked-ball check (it had been implicitly carrying position from the shooter sub-test, which made it fragile to CPU brain changes). NOTE: the smoke12/smoke36 tournament 'champ=NAME' lines use unseeded rand seeding and differ every run; only their structural asserts are stable.
