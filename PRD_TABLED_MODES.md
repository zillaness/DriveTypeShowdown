# PRD — Tabled Modes (BattleBots + 3v3)

Detailed specs for the two big tabled features, so a fresh thread has the full
intent. **NOTE:** these are reconstructed from the design discussion (the verbatim
PRDs predated the thread migration). Items marked **[CONFIRM]** need Sam's sign-off
before building. Both are large — get an explicit green-light and build in phases,
battery-green per phase.

Engine context lives in `MIGRATION.md` (architecture map, ship workflow).

---

# A. BATTLEBOTS MODE

A combat mode: drive a robot with a weapon in an arena, deal damage, KO or
out-damage the opponent. Builds on the existing TANK FIGHT arena + RAMMING
boost-tackle + the drive-kinematics system, but swaps "shoot bullets" for
"melee/weapon combat + hazards."

## Goals
- Use the existing drive types (tank/arcade/swerve/holo/steer) as the chassis —
  drive choice matters (a fast swerve vs a heavy rammer).
- A real damage model (HP), weapons, arena hazards, and a KO/judge win condition.
- Reuse: `tf2` arena/layout, `obsCheck`, `arcadeStep`/`arcadeTackle` (RAMMING),
  `withBot`, `getInp`, the HP-pip HUD, SFX (`hit`/`boom`/`explosion`).

## Core model
- **HP per bot** (e.g. 100). No "lives"; one HP bar. Optional armor stat by chassis.
- **Damage = weapon type × relative impact speed × hit location.** Reuse
  `p2ImpactMag(a._inp,c._inp)` for closing speed. Front/weapon-side hits do more;
  body/back hits do less (use heading vs contact normal).
- **Weapon contact cooldown** per pair (~150–250ms) so a single touch isn't a
  continuous grind (except spinners — see below).
- **Self-damage / recoil:** a big hit knocks BOTH bots back (momentum), the
  attacker less.

## Weapons **[CONFIRM the set]**
Pick at setup (a weapon picker on the claim card, like the drive picker). Proposed:
1. **SPINNER** — continuous contact damage while the spinner edge touches a foe;
   high damage, high knockback to both, needs spin-up time. Visual: rotating bar.
2. **HAMMER** — periodic overhead strike (press fire): high single-hit damage in a
   front arc, cooldown ~1s. Reuses the fire button.
3. **FLIPPER** — front wedge; on fire, launches the foe (big knockback / brief
   "flipped" stun), low direct damage — wins by control/pit.
4. **RAMMER** — no weapon; the RAMMING boost-tackle IS the weapon (already exists),
   damage scales with boost speed.
(Default everyone has passive ram damage; the weapon is the active layer.)

## Arena hazards **[CONFIRM]**
- **PIT** — a zone; a bot driven into it is instantly KO'd (or falls = loses).
- **SAWS / WALL SPINNERS** — hazard rects (like tank `tfObs` but damaging) that
  deal damage + knockback on contact. Reuse the moving-hazard math from the race
  (`r2HazAt`).
- **SCREWS / SPIKES** — static damage strips along walls.
- **OUT-OF-ARENA** — if knocked past a wall opening = KO (most arenas are walled).
Hazards toggleable (a setting), like the race MOVING HAZARDS toggle.

## Win conditions
- **KO:** opponent HP ≤ 0 → win.
- **Count-out / immobilized:** if a bot can't move (pinned/flipped) for ~10s → KO.
- **Pit / out:** instant.
- **TIME LIMIT → judges' decision:** if time expires, most damage dealt wins
  (track `damageDealt[p]`); tie → least damage taken. (Mirrors the ball TIMED format.)
- Best-of series supported via the existing format engine.

## Suggested phases (battery-green each)
1. **P1 — Core melee duel:** HP model, contact damage via impact speed, KO,
   last-standing win, on the tank arena. No weapons yet (passive ram damage only).
   New mode id `battlebots` in `M2_MODES`; `bb2` state object mirroring `tf2`.
2. **P2 — Weapons/loadouts:** weapon picker at setup; SPINNER + HAMMER +
   FLIPPER + RAMMER with their damage/knockback rules + a fire button.
3. **P3 — Hazards:** PIT + SAWS + OUT-OF-ARENA; hazard toggle + 2–3 arena maps.
4. **P4 — Win polish:** count-out timer, TIMED judges' decision (damage tracking),
   HUD (HP bars + damage meter), SFX.
5. **P5 — CPU brain:** a BattleBots CPU (approach, weapon-face, dodge hazards,
   tier-scaled) — reuse `cpuTankUpdate` patterns + the drive-kinematics from v5.1.21.
6. **P6 — Multi-bot rumble [CONFIRM]:** N bots free-for-all (ties into the
   multi-tank roster rework).

## Open questions for Sam
- Weapon set + whether weapon is chosen at setup or fixed per chassis.
- Arena style (walled box vs open-edge KO) and which hazards.
- 1v1 only first, or straight to a rumble?
- Damage numbers / TTK target (how long should a fight last?).

---

# B. 3v3 HUMAN (full head-to-head)

Always THREE competitors per side in the ball modes (NORMAL + SHOOTER), each a
human or CPU, plus the existing alliance support bots folded into the three.
The **foundation is already staged** in the code (behavior-preserving at 2 bots).

## What already exists (staged, inert)
- **`b2Roster(spots)`** — pure fill-rule. `spots` = length-6 array (0–2 = RED/al0,
  3–5 = BLUE/al1), each `{type:'human'|'cpu'|'empty'}`. Computes competitors =
  clamp(max humans either side, 1, 3); each side fields that many competitor mains
  then `3 − competitors` alliance bots. Unit-tested (smoke51).
- **Alliance helpers:** mains carry `.al`/`.spot`; identity/attribution/foe-gather/
  projectile-contact route through `b2Mains`/`b2Foes`/`b2OppMain`/`b2IsMain`
  (behavior-preserving at two bots).

## Remaining wiring (the actual build)
1. **Roster-driven spawn:** spawn N mains/side from `b2Roster` at 3 lanes/side
   (mirror-fair start positions), instead of the hardcoded 2 mains.
2. **Per-main CPU brain:** run `cpuBallUpdate`/`b2ScoreCycle` for every CPU main
   (not just slot 1); anti-double-team across 3.
3. **Per-main input routing:** map each claimed controller to its main; `withBot`
   per main (drive/sens/name swap already supports this).
4. **N-pair pinning + collisions:** generalize the pin-penalty and bot-bot
   separation from the 2-bot special case to all pairs (the all-pairs loop in
   `b2CpuUpdate` already does cpus; extend to mains).
5. **Six-card setup UI:** the claim screen shows up to 6 spots (3 per side) instead
   of 2; name/drive/controller per spot.
6. **Name + HUD wiring for six;** scoreboard still per-alliance (RED vs BLUE).
7. **Balance + re-green battery** for always-3v3 (own goals 0, scoring sane).

## Scope notes
- Ball modes only (NORMAL + SHOOTER). Tank/race stay as-is (tank multi-bot is the
  separate "multiple enemy tanks" queue item).
- Deferred to **v5.2** originally; do it LAST (after the current queue + BattleBots
  decision), since it touches spawn, input, AI, collisions, and the setup UI.

## Open questions for Sam
- Always exactly 3/side, or a selectable side size (2v2 / 3v3)?
- Field size / layout changes for 6 bots (more balls, wider field)?
- Mixed human+CPU per side confirmed (e.g. 1 human + 2 CPU allies)?
