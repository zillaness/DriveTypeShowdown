---
file: frcds_bb_weapons_prd_v1.0.md
version: 1.0
author: Sam Cao
created: 2026-06-15
last_updated: 2026-06-15
description: PRD for BattleBots P2 — drag-and-drop weapon + armor loadouts with pure (no-budget) tradeoffs, drive synergies, per-wheel damage, and mutual-destruction draws. Builds on the shipped BattleBots P1 (v5.1.49–51) and the 6-seat claim grid.
ai_update: Bump version + last_updated, rename file to match, append changelog at the bottom. Keep numbers as TUNABLE — they are first-pass and meant for playtest.
---

# FRC Drive Showdown — BattleBots P2: Weapons + Armor Loadouts (PRD)

## Problem / Goal
Make **speccing your bot the game**. At setup, each BattleBots competitor picks a
**WEAPON + ARMOR + DRIVE** loadout via **drag-and-drop**. There is **NO points
budget** — every choice is a **pure tradeoff**, so there is no single "best" build;
the metagame is rock-paper-scissors + matchup reads. Loadouts render with **basic
cosmetic** changes so you can see what you're fighting.

Builds on **BattleBots P1** (shipped v5.1.49–51): mode `battlebots`, phase `p2bb`,
state `bb2`, `bb2.bots[]` each with `{mob, hp, inv, dead, boostT, boostCd, ctl, _inp,…}`,
two bars (MOBILITY→HP), directional armor (front immune / rear=HP / side=mobility,
spillover after immobilize), ram-by-impact, KO last-standing, basic CPU, RAM/DASH on
LT. Constants in `BB={MOB,HP,frontCone,rearCone,hitCd,dmgK,dmgMax,knock}`. Code map in
`MIGRATION.md §4b`. Already N-bot (works 1v1 and 3v3 via the grid as of v5.1.64/66).

## Design pillars (all from Sam, 2026-06-15)
1. **Weight is the base tradeoff.** Heavier weapon/armor → lower MOBILITY (slower
   drain-to-immobilize headroom) and lower **top speed + acceleration + turn rate**.
   Light builds are fast and nimble; heavy builds are slow bricks.
2. **Drive-type synergies.** The chosen DRIVE modifies the weight penalty and grants
   handling perks, so a weapon "wants" a certain chassis.
3. **Damage-DEALT vs damage-SUSCEPTIBILITY.** A build that hits hard tends to be
   easier to hurt (glass cannon); a tanky build deals less. This emerges from
   weight+armor, plus explicit weapon "fragility".
4. **Rock-paper-scissors** between weapon *types* and armor *types* (below).
5. **Flamethrower is the front-armor answer:** must **dwell ~0.5–1s** on a target
   (heat-up) before it bites; low DPS; **ignores directional armor** (damages the
   normally-invulnerable FRONT); sustained burn → **BLOW-UP** instant KO.
6. **Per-wheel health changes how you drive** (not just slowdown): lose a wheel and
   the chassis gains a **persistent handling fault** (constant turn-bias / strafe
   drift) keyed to the drive type.
7. **Mutual-destruction draws:** a bot blowing up can catch a **near-dead** enemy in
   the blast → double-KO / DRAW.

---

## A. The tradeoff model (no budget)

Each loadout = **DRIVE** (existing 13 drives) + **WEAPON** (1) + **ARMOR** (1 type,
applied across zones). Three derived stats drive everything:

- **`weight`** = `weaponWeight + armorWeight` (chassis base 0). Higher weight →
  - `speedMul = clamp(1 − weight·kSpeed, floor, 1)` applied to drive speed/accel,
  - `mobMax`  = `BB.MOB · (1 + weight·kMobHeavy)` *(heavy = a bigger mobility bar to
    grind through — heavier bots take longer to immobilize)* — **OR** the inverse if
    playtest says heavy should immobilize faster; pick one in tuning. Default: heavy =
    **bigger** mobility bar but **slower**.
  - `turnMul` reduced with weight (heavy = sluggish turning).
- **`deal`** (damage-dealt multiplier) and **`take`** (damage-taken multiplier):
  a weapon sets a base `deal`; armor sets `take`. Glass-cannon weapons push `deal`
  up and `take` up (fragile); control weapons push both down.
- **`zoneMul[front|side|rear]`** from ARMOR — modifies the P1 directional rules
  (front normally immune to kinetic; armor can harden a zone further or trade it away).

### Drive-type synergies (modifies weight penalty + perks) — TUNABLE
| Drive family | Perk | Synergy weapon |
|---|---|---|
| **Swerve / holonomic** (field/robot-centric, mecanum) | Best agility; can keep front to foe while strafing; smallest turn penalty from weight | FLAMETHROWER (hold aim), SPINNER (angle of attack) |
| **Tank / arcade / west-coast** | Highest pushing force; least speed penalty from heavy armor; best ram | WEDGE/PLOW, heavy armor + RAM |
| **Steering / car-like** | Fast in a straight line, wide turns; momentum ram bonus | PISTON (charge in, strike), RAM |
> Concretely: `weightPenalty *= drivePenaltyMul[family]` and each family adds a small
> flat perk (e.g. tank: `+push`, swerve: `−turnPenalty`, steer: `+ramSpeed`).

---

## B. Weapons (set confirmed by Sam) — all TUNABLE

Damage `= base · p2ImpactMag(a._inp,c._inp)`-style closing speed (for kinetic) ·
`zoneMul` · `deal` · RPS-armor factor, capped per hit. Each weapon has a **fire**
input (reuse a face button / RT; RAM stays on LT).

1. **SPINNER** — *kinetic-spin, glass cannon.* Continuous contact damage while the
   spinning edge touches a foe; **high damage + high knockback to BOTH**; needs
   **spin-up** (a ramp timer after firing). High `deal`, high `take` (fragile: takes
   bonus self-damage on big hits / when hit while spun-up). Bounces off FRONT armor
   (no dmg) — must catch REAR/SIDE. Weight: med. *Cosmetic: rotating bar/disc on the body.*
2. **PISTON** — *kinetic-strike.* Periodic single big hit in a front arc on fire,
   cooldown ~1s. Medium `deal`, medium `take`. Front-armored foe shrugs it (kinetic).
   Weight: med. *Cosmetic: a hammer/arm that swings on fire.*
3. **FLAMETHROWER** — *thermal, the front-counter.* Must **dwell ~0.5–1s** on-target
   (per-victim `heat` meter ramps) before damage starts; then **low DPS** that
   **ignores directional armor** (hits FRONT/any zone). Sustained burn fills a
   **burn/blow-up meter → instant KO + big explosion**. Low `deal` per tick, low
   `take`. Weight: med-heavy (fuel). *Cosmetic: a nozzle + flame stream when firing.*
4. **WEDGE / PLOW** — *control.* Reuse the sticky-plow: latch a foe, grab + ram to set
   up flanking its rear/side. **Low direct damage**, low `take` (tanky), wins by
   control + pairing with RAM. Weight: light-med. *Cosmetic: a front wedge ramp.*
5. **RAM / DASH (always equipped, every bot)** — existing boost-tackle on **LT**;
   kinetic damage scales with boost speed (front-armored → ram rear/side). Free.

---

## C. Armor types (RPS) — all TUNABLE

Armor is **one TYPE** chosen at setup, setting `take`, per-zone `zoneMul`, weight, and
an **RPS class**. Per-zone keeps P1's directional model (front strong, rear weak, sides
= mobility) and lets a type re-bias it.

| Armor type | weight | take | zone bias | RPS strong vs | RPS weak vs |
|---|---|---|---|---|---|
| **HARDPLATE** (kinetic) | heavy | low | front++ , rear+ | SPINNER/PISTON (kinetic) | FLAMETHROWER (thermal) |
| **HEATSHIELD** (ablative) | med | med | thermal-resist (raises flame heat-up time, caps burn) | FLAMETHROWER | SPINNER/PISTON (kinetic) |
| **LIGHT / SPEEDER** | light | high | none (fast, fragile) | nothing — fast | everything (glass) |
| **BALANCED** (default) | med | med | mild front | — | — |

**RPS triangle (weapons):** SPINNER **>** WEDGE **>** PISTON **>** SPINNER
(spinner shreds a slow wedge; wedge gets under a piston and controls it; piston hammers
a spinner before/after spin-up). **FLAMETHROWER** is orthogonal: **> turtles / HARDPLATE
front-armor**, **< fast kinetic** (gets shredded before it heats up).
**RPS (armor):** HARDPLATE resists kinetic / folds to thermal; HEATSHIELD the reverse.
Implement as a `rpsFactor(weapon, armor)` lookup (e.g. 0.6 / 1.0 / 1.5) multiplying damage.

---

## D. Per-wheel health → handling faults (Sam's "lose a wheel, it turns to one side")

Track a small fixed set of **wheel zones** per bot (keep it cheap, NOT literally every
wheel sprite): **4 corners** `wheels=[FL,FR,RL,RR]`, each `{hp, dead}`. **SIDE** mobility
damage in P1 now routes to the **wheel(s) on that side / corner nearest the contact
point**, draining that wheel's hp; the bot's overall MOBILITY bar = function of live
wheels. When a wheel `hp≤0` it's **DEAD**, and instead of only slowing the bot, it
applies a **persistent handling fault** by drive family:
- **Tank / arcade / steer:** a dead wheel on one side → **constant turn-bias** toward
  the dead side (asymmetric thrust). Two dead on a side → barely drivable circle.
- **Swerve / holonomic / mecanum:** a dead module → **strafe drift** + reduced
  authority on that vector (translation pulls toward the dead corner).
Implementation: `wheelFault(b)` returns a `{turnBias, driftX, driftY, speedMul}` added
into that bot's `getInp`/drive resolution each tick. Mobility-bar % derives from
`liveWheels/4`. This makes flank/side combat *change how the enemy drives*, not just
slow them — a much richer disable.
> Headless: wheel-damage routing + fault vector are pure logic → **unit-testable**
> (new smoke). The *visual* (a wheel going dark / sparks) is cosmetic.

## E. Mutual-destruction draw (Sam's "blow-up can take a near-dead enemy")

When a bot is destroyed (HP≤0 explosion **or** flame BLOW-UP), spawn a **blast** with a
radius. Any **other** bot within radius that is **below a near-death HP threshold**
(`hp ≤ blastLethalHp`) is **also KO'd**. If that leaves **no** bots on either surviving
side, the round is a **DRAW**. Extend `bbCheckResult` to return a draw state; HUD/series
handle "DRAW — double KO". (Cross-side only counts toward win/credit; a flame bot that
suicides into the last enemy = a dramatic draw.)

### E.1 Death FX (cosmetic, Sam-requested)
Win = **knockout / destruction**. Make death **fun & animated**: on a KO, scatter
**debris parts** (the weapon flies off, panels/wheels tumble out with random velocities +
spin, fade) for a kinetic death; a **big explosion** for a flamethrower BLOW-UP. Reuse
the existing blast/`fx` particle pattern. Pure cosmetic — gate behind the same draw
guards (no-op canvas), keep it cheap (a handful of particles per death).

## F. Drag-and-drop loadout UI
On the BattleBots claim card (1v1) **and** each grid seat (MULTI), add a **LOADOUT**
panel:
- A **tray** of weapon icons + armor-type chips; **drag** one onto the bot's WEAPON
  slot / ARMOR slot (drop to equip). Tap-to-cycle fallback for phone/gamepad (the grid
  already has tap cyclers for drive/tier — mirror that affordance so it's not
  drag-only). Drive picker stays as-is.
- A live **stat readout**: SPEED / MOBILITY / DAMAGE / TOUGHNESS bars recomputed from
  the loadout (so the tradeoff is visible), plus the RPS tags ("kinetic", "thermal-weak").
- **Cosmetic preview**: the bot icon redraws with the weapon (disc/hammer/nozzle/wedge)
  + armor look (plate thickness / color).
> The claim/grid UI is **not headless-verifiable** (no-op canvas). Build live +
> `SendUserFile` for Sam to eyeball, like the grid. The *data + effects* are testable.

## G. Data model (sketch)
- `BB_WEAPONS = [{id,name,class:'kineticSpin|kineticStrike|thermal|control',weight,deal,take,…,cosmetic}]`
- `BB_ARMOR   = [{id,name,weight,take,zoneMul,rpsClass:'hardplate|heatshield|light|balanced',cosmetic}]`
- `BB_RPS[weaponClass][armorRpsClass] = factor`
- Per seat/claim: `m2.bbLoadout[bind] = {weapon, armor}` (parallel to `m2.drive[bind]`).
  In MULTI, store on `m2.tseats[i].loadout`; `tankGridApply`/`startP2BB` copy it onto
  each `bb2.bots[k]`.
- Each `bb2.bots[k]` gains: `weapon, armor, weight, deal, take, zoneMul, wheels[4],
  heat (per-foe), burn, spin` as needed.

## H. Suggested phases (battery-green each; lowest-risk first)
1. **P2.1 — Loadout DATA + weight/speed/mobility effects (no UI yet).** Add
   `BB_WEAPONS`/`BB_ARMOR`/`BB_RPS`, `m2.bbLoadout` defaults, wire weight→speed/mob/turn
   + `deal`/`take`/`zoneMul`/`rpsFactor` into `bbApplyHit`/`updateBB`. Default loadout =
   today's behavior (RAM only, balanced) so P1 stays byte-identical. Heavy unit tests.
2. **P2.2 — The four weapons' fire behavior.** SPINNER spin-up + continuous, PISTON
   strike+cooldown, WEDGE sticky-grab, FLAMETHROWER heat-up + armor-ignoring DPS. Fire
   input. Tests for each weapon's damage rules + RPS.
3. **P2.3 — Flamethrower burn → BLOW-UP + mutual-destruction draw.** Burn meter, blast,
   `blastLethalHp`, `bbCheckResult` draw state.
4. **P2.4 — Per-wheel health + handling faults.** `wheels[4]`, side-dmg routing,
   `wheelFault` vector into drive resolution, mobility% from live wheels. Tests.
5. **P2.5 — Drag-and-drop LOADOUT UI + cosmetics** (claim card + grid seat). Live +
   `SendUserFile`; tap-to-cycle fallback.
6. **P2.6 — CPU picks a loadout + uses its weapon** (tier-scaled; turtle with flame,
   spinner spacing, etc.).

## I. Open questions / tuning (defer to playtest, don't block)
- Heavy = bigger mobility bar (slower to immobilize) **or** smaller (faster)? Default
  bigger; flip if it feels off.
- TTK target with weapons (P1 is RAM-only): aim ~20–40s fights.
- Exact RPS factors (0.6/1.0/1.5?), flame heat-up (0.5 vs 1.0s), blow-up threshold,
  blast radius, `blastLethalHp`.
- Is ARMOR a separate pick (this PRD) or baked into drive/chassis? → **separate pick**
  per Sam ("weapon AND armor system").
- Per-wheel: 4 corners (this PRD) vs per-drive wheel count? → keep **4 corners** for
  cost; map drive family to the fault style.

## Constraints
- Single-file HTML, exact-anchor patches, `node --check` + full `./battery.sh` green per
  phase. Render code guarded (no-op canvas won't catch NaN gradients / negative repeat).
- Model id never in committed artifacts. Author = Sam Cao.

## CHANGELOG
- v1.0 (2026-06-15): Initial spec from Sam's 2026-06-15 direction — weight-based pure
  tradeoffs, drive synergies, damage-vs-susceptibility, weapon/armor RPS, flamethrower
  heat-up + front-armor bypass, per-wheel health → handling faults, mutual-destruction
  draws, drag-and-drop loadout UI. Phased P2.1–P2.6.
