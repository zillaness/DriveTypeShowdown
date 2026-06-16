---
file: frcds_roborumble_v2_prd_v1.0.md
version: 1.0
author: Sam Cao
created: 2026-06-16
last_updated: 2026-06-16
description: Capture + plan PRD for the RoboRumble (combat-robot) DEEP PASS — weapon roster, perks, drive synergies, minibots, arena hazards, map-select screen, bot-name easter eggs, combat cheats, and the CPU flanking brain. Built from a live playtest brain-dump. v5.1.95/96 already shipped the first combat-feel pass.
ai_update: Update last_updated and version. Rename file to match. Append changelog at bottom.
---

# RoboRumble v2 — combat deep pass (capture + plan)

Status: **capture + plan.** Distills a live playtest brain-dump into a sequenced backlog. The first combat-feel pass already shipped (v5.1.95 + v5.1.96); everything below is proposed/queued unless marked DONE.

## Already shipped (context)
- **v5.1.95** — immobilized COUNT-OUT (no-end fix), HP 100→250, PISTON front-pierce, SPINNER bleed-on-bite + wall self-damage, FLAMETHROWER longer reach + FUEL gauge, RAM DASH = forward lunge along the nose, WEDGE pin/shove clarity + PINNED cue, HUD gauges.
- **v5.1.96** — SPINNER front-pierce (bites the front too) + `harness/tests/bbbalance.js` (weapon win-rate simulator).

## Headline finding from the balance sim (drives the priority)
`bbbalance.js` (CPU-vs-CPU, all weapon matchups) shows **front-piercing weapons (spinner/flame) win ~100/75%, while wedge/ram/piston sit near 0%.** Root cause is **structural, not numeric**: the P1 CPU brain keeps its front to the foe and **never flanks**, so any weapon that can't pierce the front can never reach a rear/side. ⇒ **The #1 lever is a flanking CPU brain** (P0 below); weapon balance can't be tuned until the AI can actually use non-front weapons.

---

## P0 — CPU FLANKING BRAIN (unblocks everything)
The current `bbCpuUpdate` drives at the foe's rear but, mirrored, two bots just press front-to-front. Add real flanking: orbit to the foe's exposed side/rear, commit a hit, peel off, re-approach; respect obstacles (the CPU also gets stuck on map obstacles today — the sim runs obstacle-free to dodge this). Success = the balance sim resolves most matches decisively and wedge/ram/piston post non-trivial win rates. This is the gate for meaningful weapon tuning.

## P1 — WEAPON ROSTER redesign
Drop the placeholder, give each weapon a clear identity. Internal ids can stay (e.g. keep `'wedge'`); change DISPLAY + behavior.
- **Drop "RAM ONLY"** (`none`) as a pickable option — every bot has at least a blade. (Keep `none` internally as the neutral default if cheaper, but it's not offered in the armory.)
- **BULLDOZER BLADE** (rename from WEDGE): a real bulldozer-blade RENDER (low front plow, not the current look). Identity: control + **defense vs spinners** (a spinner that hits the blade deflects → takes self-damage + sheds spin, like a wall). Plus a **soft sticky GRAB**: ram a foe and you hold it ~1s and can **slam it into a wall** for damage. Synergizes with TANK drive (pushing). Good in 1v1 and 3v3.
- **HAMMER / PISTON**: armor-piercing front strike (DONE: front-pierce). Add an **air-pressure reservoir** (limited strikes that refill, like the flame fuel gauge).
- **FLAMETHROWER**: range + fuel (DONE). Add **turret aim** — the flame (and any "turreted" weapon) aims with the right stick / mouse INDEPENDENT of the chassis and independent of the Mouse-Aim toggle (not locked forward). Mirror the v5.1.74 tank-cannon aim.
- **SPINNER**: spin-up → more dmg, bleed-on-bite, wall self-damage, front-pierce (DONE). Tune after P0.
- **FLIPPER** (new): flings the foe **BACK** with big horizontal knockback (top-down can't fling up). Sets up ring-outs into hazards (see P3).
- **PINCER** (new): grabs + **immobilizes** the foe (hold/pin). Push/pin focus, *not* a damage weapon. A **3v3 role-player** (hold a foe while teammates pile on); weak in 1v1.

## P2 — 3rd loadout slot: PERKS
Add a third equip slot (weapon + armor + **perk**). Candidate perks:
- **Explosion on death** (reuse the flame blow-up blast / mutual-destruction chain).
- **Flameproof** (immune to flame DPS + blow-up).
- **Minibot** (deploy a harassing minibot — see P4).
- (room to grow: thicker armor, faster spin-up, bigger fuel/air tank, etc.)

## P3 — ARENA: hazards + map-select screen
- **Hazard maps**: some arenas have hazards you avoid — or **push the foe into** (pit / saws / crusher / flame jet). Ties into FLIPPER ring-outs and the BLADE slam.
- **MAP-SELECTION SCREEN** (after setup) for RoboRumble, TANK FIGHT, and maybe OBSTACLE RACE: a dedicated screen that shows a **RENDER of the map**, not just a name. (Acknowledged: this reorders the post-match menu flow — needs a careful nav pass.)

## P4 — MINIBOTS
Real combat robots field minibots. **Repurpose the existing alliance support bots** as harassing minibots in RoboRumble: strip the ball-mode behaviors (score-blocking, ball-pushing) and make them **only push/pin the foe**. (These aren't a weapon — they're a team element / perk.)

## P5 — DRIVE-TYPE SYNERGIES
Each drive earns an identity in combat:
- **TANK**: pushing buff + synergy with passive weapons (the bulldozer blade).
- **ARCADE**: a benefit TBD (it already aims the turret one-handed — maybe lean into that).
- **STEERING / SWERVE / HOLO**: TBD; steering pairs with the Optimus Prime egg (below).

## P6 — BOT-NAME EASTER EGGS (+ achievement)
- **"Optimus Prime"** → name it that and you get the red + blue + FLAMES paint (cosmetic). Name it that AND run ANY STEERING drive → **HEALING** (regen HP over time). Tiered egg: cosmetic on the name alone, the heal buff on name + steering.
- **"Bumblebee"** → same egg, BLACK + YELLOW paint; same synergy (name + any steering drive → HEALING). You get both the paint and the heal.
- **"Original Sin"** (a friend's real bot) → with TANK drive + a passive weapon (blade): **invulnerable wheels** + the benefit of ARCADE drive.
- **"Unoriginal Sin"** → a **non-secret** achievement for discovering the Original Sin synergy (its visible description hints at the combo).
- **"Autobots Roll Out"** → an achievement tied to the Optimus Prime egg (e.g. name your bot Optimus Prime + steering drive, or win a match with it).

## P7 — COMBAT CHEATS (Konami menu)
RoboRumble-flavored, several cross-mode:
- **MOVE OR DIE** (tank + RoboRumble): lose HP while you're not moving.
- **AIRSTRIKE**: shrinking crosshairs telegraph a strike that blows up an area — forces movement, prevents camping.
- **UNLIMITED RESOURCES**: infinite fuel / air-pressure / spinner RPM-inertia.
- **MEGABOTS**: the mini alliance bots become immovable megabots.
- **ARENA TRAPS**: toggle hazards on/off — or a 2-player twist where one player works the traps with the mouse.
- **WALKER / SHUFFLEBOT**: move SUPER slow but you can't be pushed (immovable).
- **ANIME SWORD**.

## P8 — BALANCE TOOLING (extend `bbbalance.js`)
- Add armor matchups + perks to the matrix; per-map runs once hazards land; a flanking-CPU rerun after P0.
- Goal: every weapon/armor/perk lands inside a sane win-rate band; the sim becomes the tuning gate (like `balance.js` for CPU tiers).

---

## Suggested sequence
**P0 (flanking brain) first** — it unblocks balance and makes every non-front weapon viable. Then **P1 roster** (blade rename+render+grab-slam+spinner-defense; flipper; pincer; drop RAM; piston air tank; flame turret-aim), with `bbbalance.js` re-run after each weapon. **P2 perks** and **P4 minibots** pair naturally (minibot-as-perk). **P3 hazards + map-select** is a self-contained arena/UI chunk. **P5 synergies** + **P6 easter eggs** ride on the roster. **P7 cheats** are mostly small and can slot in opportunistically. **P8** runs throughout as the tuning gate.

## Constraints (unchanged)
Single self-contained HTML file, no assets, no deps; exact-anchor patches with count-asserted tests; `node --check` + full battery green before each ship; headless harness can't verify render/feel (Sam's eyeball gate for those).

## CHANGELOG
- v1.0 (2026-06-16): Initial capture from the playtest brain-dump. Records the balance-sim finding (flanking CPU is the gate), the full weapon roster + perks + minibots + hazards + map-select + drive synergies + bot-name easter eggs + combat cheats, and a suggested sequence. v5.1.95/96 shipped the first combat-feel pass + the sim.
