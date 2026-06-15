# PRD — Tabled Modes (BattleBots + 3v3)

Detailed specs for the two big tabled features, so a fresh thread has the full
intent. **NOTE:** these are reconstructed from the design discussion (the verbatim
PRDs predated the thread migration). Items marked **[CONFIRM]** need Sam's sign-off
before building. Both are large — get an explicit green-light and build in phases,
battery-green per phase.

Engine context lives in `MIGRATION.md` (architecture map, ship workflow).

---

# A. BATTLEBOTS MODE

> **STATUS (2026-06-15): P1 SHIPPED in v5.1.49–51.** Mode `battlebots`/phase `p2bb`/state `bb2`
> on the tank arena: two bars (MOBILITY+HP), directional armor, ram-by-impact, mobility→speed,
> KO last-standing, basic CPU, HUD, always-on RAM/DASH. Tests: `smoke57.js` (25). Code map +
> constants in `MIGRATION.md §4b`. **Next: P2 weapons/loadouts** (needs a weapon picker on the
> claim card — build live + `SendUserFile`, hard to verify headless). Confirm with Sam before building.

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

## Core model — TWO bars: MOBILITY then HP  ✅ (confirmed by Sam)
The signature mechanic. Every bot has **directional armor** and a **two-layer
health system** so positioning (face your front at the enemy) is the whole game.

- **Two bars per bot:**
  - **MOBILITY** (e.g. 100) — drains first. As it drops, the bot gets slower
    (speed/turn scale with mobility%); at 0 the bot is **IMMOBILIZED** (can't drive;
    weapon may still fire if it doesn't need movement).
  - **HP** (e.g. 100) — the kill bar. Only takes damage once mobility is gone
    (for side hits) or directly (rear hits / flame), see hit-location table.
- **Directional armor (hit location = attacker's contact point vs victim's heading):**
  - **FRONT** — *generally invulnerable* to kinetic weapons (spinner/piston/ram).
    This is your shield; you fight by keeping your front toward the foe. ONLY the
    flamethrower bypasses it (see weapons).
  - **REAR** — weak spot; kinetic hits do **full HP damage** directly.
  - **SIDES** — kinetic hits do **MOBILITY damage only** (drain the mobility bar /
    "damage the wheels"). Once a bot's mobility is fully gone, further side hits
    spill over into **HP damage** — so you grind the wheels, then finish on the
    flank. (Sam: "mobility first, then when fully disabled it does HP damage.")
- **Damage = weapon type × relative impact speed × hit location.** Reuse
  `p2ImpactMag(a._inp,c._inp)` for closing speed; compute hit location from the
  victim's heading vs the contact normal (front cone / rear cone / side bands).
- **Weapon contact cooldown** per pair (~150–250ms) so a single touch isn't a
  continuous grind (except spinners/flame — continuous by design).
- **Self-damage / recoil:** a big hit knocks BOTH bots back (momentum), attacker less.

## Weapons — loadout is part of the game  ✅ (set confirmed by Sam)
Speccing your bot (WEAPON + ARMOR + DRIVE TYPE) at setup IS the game. Picker on the
claim card, like the drive picker. The set (common BattleBots archetypes):
1. **SPINNER** — continuous kinetic contact damage while the spinning edge touches a
   foe; high damage + high knockback to both, needs spin-up time. Bounces off FRONT
   armor (no damage) — must catch the REAR (HP) or SIDE (mobility). Visual: rotating bar.
2. **PISTON** — periodic punch/strike on fire: big single kinetic hit in a front arc,
   cooldown ~1s. Same directional rules (front-armored foe shrugs it off).
3. **FLAMETHROWER** — the FRONT-COUNTER. Low DPS that **ramps with sustained
   continuous fire** (must hold the stream on-target for a beat before it bites), and
   it **damages from ANY direction including the front** (ignores directional armor).
   Real-life-weak per tick, but the only answer to a turtling front-armored bot — and
   sustained burn can trigger a **BLOW-UP** (instant KO, big explosion) once a heat/
   burn meter fills. Risk/reward: get in close and hold it.
4. **WEDGE / PLOW** — sticky control tool (reuse the existing sticky-plow). Latch onto
   a foe to grab + ram it (sets up flanking the rear/side); low direct damage, wins by
   control. Pairs with the dash.
5. **RAM / DASH (always available)** — the existing RAMMING boost-tackle on **Left
   Trigger** for every bot regardless of weapon; kinetic damage scales with boost
   speed (front-armored, so ram the rear/side).

**ARMOR loadout [CONFIRM tradeoffs]:** picking heavier front armor vs balanced vs
light could trade top speed / mobility-bar size. Simplest v1: armor just sets the
front/rear/side multipliers + base mobility; drive type sets speed/turn. Confirm
whether armor is a separate pick or baked into chassis.

## Arena hazards **[CONFIRM]**
- **PIT** — a zone; a bot driven into it is instantly KO'd (or falls = loses).
- **SAWS / WALL SPINNERS** — hazard rects (like tank `tfObs` but damaging) that
  deal damage + knockback on contact. Reuse the moving-hazard math from the race
  (`r2HazAt`).
- **SCREWS / SPIKES** — static damage strips along walls.
- **OUT-OF-ARENA** — if knocked past a wall opening = KO (most arenas are walled).
Hazards toggleable (a setting), like the race MOVING HAZARDS toggle.

## Win conditions  ✅ (KO + flame-explosion confirmed by Sam)
- **KO:** opponent HP ≤ 0 → win. (HP only falls via REAR kinetic hits, SIDE hits
  after mobility is gone, or the flamethrower.)
- **FLAME BLOW-UP:** sustained flamethrower fills the foe's burn/heat meter →
  instant KO with a big explosion (a second kill path, the front-armor answer).
- **IMMOBILIZE is NOT itself a loss** — it's a vulnerability *state* (mobility at 0 =
  can't drive, and side hits now spill into HP). Sam: immobilize opens you to the kill,
  it doesn't end the match on its own. (No count-out timer in v1.)
- **PIT / OUT-OF-ARENA [CONFIRM]:** optional instant-KO hazards (see below).
- **TIME LIMIT → judges' decision [CONFIRM]:** if a timed format expires, most HP
  damage dealt wins (track `damageDealt[p]`); tie → least taken. (Mirrors ball TIMED.)
- Best-of series supported via the existing format engine.

## Suggested phases (battery-green each)
1. **P1 — Core duel + directional armor + two bars:** MOBILITY + HP bars, hit-location
   (front cone / rear cone / side bands) from heading vs contact normal, contact damage
   via impact speed, the mobility→HP spillover rule, slow-when-low-mobility, KO,
   last-standing win, on the tank arena. RAM/DASH (LT) as the only weapon (passive +
   boost). New mode id `battlebots` in `M2_MODES`; `bb2` state object mirroring `tf2`.
   Heavy tests: hit-location classification, side=mobility, rear=HP, front=immune,
   spillover after immobilize.
2. **P2 — Weapons/loadouts:** WEAPON + (ARMOR?) + DRIVE picker at setup; SPINNER +
   PISTON + FLAMETHROWER + WEDGE/PLOW, each with its damage/knockback/cooldown rules +
   the fire button. Flamethrower ramp + burn/blow-up meter.
3. **P3 — Hazards [CONFIRM]:** PIT + SAWS + OUT-OF-ARENA; hazard toggle + 2–3 maps.
4. **P4 — Win polish:** flame BLOW-UP KO, (optional) TIMED judges' decision, HUD
   (mobility + HP bars + burn meter + a facing/armor indicator), SFX.
5. **P5 — CPU brain:** a BattleBots CPU (keep its front to the foe, circle for the
   rear/side, hold flame on a turtler, dodge hazards, tier-scaled) — reuse
   `cpuTankUpdate` patterns + drive-kinematics.
6. **P6 — Multi-bot rumble [CONFIRM]:** N bots free-for-all (ties into the
   multi-tank roster rework).

## Open questions for Sam (remaining)
- **ARMOR:** separate setup pick (trades speed/mobility) or baked into chassis/drive?
- **Hazards:** include PIT / OUT-OF-ARENA instant-KO, or HP/mobility only (no pit)?
- **Arena:** walled box vs open-edge KO; how many maps for v1?
- **1v1 first, or straight to rumble?** (P1–P5 assume 1v1; rumble is P6.)
- **Numbers/TTK:** target fight length (e.g. 20–40s), bar sizes, flame ramp time,
  blow-up threshold — tune in playtest.

### Resolved (Sam) ✅
- Side hits = MOBILITY damage first; spill to HP only once fully immobilized.
- Immobilize is a vulnerability state, NOT an instant loss / no count-out.
- Weapon set = SPINNER, PISTON, FLAMETHROWER, WEDGE/PLOW + always-on RAM/DASH (LT).
- Directional armor: FRONT ~invulnerable to kinetic, REAR weak (HP), SIDES mobility.
- Flamethrower = low ramping DPS, ignores directional armor (hits the front), can
  cause a BLOW-UP on sustained burn. Win cons = KO + flame blow-up.
- Loadout (weapon/armor/drive) chosen at setup is a core part of the game.

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
