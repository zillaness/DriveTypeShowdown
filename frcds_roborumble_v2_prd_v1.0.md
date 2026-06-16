---
file: frcds_roborumble_v2_prd_v1.0.md
version: 1.1
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
- **v5.1.97 — P0 FLANKING BRAIN DONE** + combat-balance pass: CPU orbits to the rear/side (sim decisive 1%→68%; piston 4%→75%, ram 0%→50%). Spinner nerfed (slower spin-up, near-restart RPM loss + SELF-DAMAGE on every bite; WEDGE deflects it). Count-out is now STALEMATE-only (finish an immobile foe yourself). Piston always visibly extends (fire = RT or A). **Fuel/air DROPPED for now** (too complicated) — would return with a map refuel spot only once flame/piston are competitive enough to need balancing.

## Current balance (CPU-vs-CPU, `bbbalance.js`, post-flanking)
spinner 75% · piston 75% · ram/none 50% · flame 25% · wedge 0%. Flame + wedge lag because they still lack their P1 kit (flame TURRET-AIM so it can track flankers; wedge GRAB-SLAM so its control converts to damage). The spinner DEFLECT counter works (spinner self-destructs on a blade) but wedge has no offense to capitalize yet → P1.

## Headline finding from the balance sim (drives the priority)
`bbbalance.js` (CPU-vs-CPU, all weapon matchups) shows **front-piercing weapons (spinner/flame) win ~100/75%, while wedge/ram/piston sit near 0%.** Root cause is **structural, not numeric**: the P1 CPU brain keeps its front to the foe and **never flanks**, so any weapon that can't pierce the front can never reach a rear/side. ⇒ **The #1 lever is a flanking CPU brain** (P0 below); weapon balance can't be tuned until the AI can actually use non-front weapons.

---

## P0 — CPU FLANKING BRAIN (unblocks everything)
The current `bbCpuUpdate` drives at the foe's rear but, mirrored, two bots just press front-to-front. Add real flanking: orbit to the foe's exposed side/rear, commit a hit, peel off, re-approach; respect obstacles (the CPU also gets stuck on map obstacles today — the sim runs obstacle-free to dodge this). Success = the balance sim resolves most matches decisively and wedge/ram/piston post non-trivial win rates. This is the gate for meaningful weapon tuning.

## P1 — WEAPON ROSTER redesign
**STATUS (2026-06-16):** FLAME turret-aim **DONE** (v5.1.99–100, now **ARCADE-drive-only** per playtest — swerve/holo aim via chassis, tank/steer locked forward; + 2× range / narrow cone / animated / rumble); DOZER **rename + blade render DONE** (v5.1.101); SPINNER/PISTON front-pierce DONE. **NEXT = DOZER grab-and-slam + its chassis-forward RT ram charge** (the LT dash is now the directional dodge — see §8). See the ⭐ REORGANIZED ROADMAP below for the live sequence.
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
- **BOUNCY TANK SHOTS** (new, 2026-06-16): the existing BOUNCY BALLS cheat already ricochets *shooter* projectiles but NOT tank-fight bullets — extend `bouncyMode` to bounce `tf2.bullets` off the arena walls (with a bounce-count cap so they still expire). Sam: "would be very fun with bouncing shots." Small + self-contained; fulfills the cheat's own "shots ricochet" description.

## P8 — BALANCE TOOLING (extend `bbbalance.js`)
- Add armor matchups + perks to the matrix; per-map runs once hazards land; a flanking-CPU rerun after P0.
- Goal: every weapon/armor/perk lands inside a sane win-rate band; the sim becomes the tuning gate (like `balance.js` for CPU tiers).

## P9 — GAME MODES / OBJECTIVES (cross-mode: RoboRumble + Tank Fight) — LATE QUEUE
Layer selectable objective modes on top of RoboRumble and Tank Fight (beyond last-bot / elimination). Sam's asks (2026-06-16 playtest):
- **KING OF THE HILL (KOTH)** — three sub-variants:
  - **Classic** — ONE fixed hill/zone; hold it to accrue time/score.
  - **Roaming hill** — the hill **despawns and RESPAWNS at a new location** periodically (forces repositioning + a scramble for the next spot).
  - **Oddball / carry-object** — **pick up an object and HOLD it to gain time**; on death you **DROP it** and someone else grabs it (a juggernaut-with-the-ball).
- **CAPTURE THE FLAG (CTF)** — grab the enemy flag, return it to base ("pretty self-explanatory").
- **Claude's suggested others (for Sam to pick from):**
  - **SUMO / RING-OUT** — shove foes out of a shrinking arena; pairs perfectly with the FLIPPER + arena hazards (P3) + the DOZER push. Most on-theme for combat robots.
  - **PAYLOAD / ESCORT / SHOVE-IT** — (round format TBD — Sam: "maybe that's not multiple rounds"; could be one continuous push or best-of-N): the tanks must MOVE and **SHOVE a HEAVY object across the field to the OPPONENT'S side to SCORE** (Sam: "a multi-round game where the tanks must move, shove something across the field… push a heavy object across the field to the other side to score"). **MULTIPLE VERSIONS (Sam): (a) PUSH-BALL / TUG-OF-WAR — ONE central heavy object, BOTH teams shove it toward OPPOSING goals at the SAME TIME; (b) each side pushes its own object to the far side.** Contested push either way; rewards TANK push + bulldozer (drive synergies, P5). **IMPLEMENTATION (Sam): give the tanks the ball-mode SNOW PLOW / scoop to shove the object** — the plow + ball-pushing/zone primitives already exist, so the payload object can reuse the ball physics.
  - **CONTROL / DOMINATION (capture points)** — **capture ZONES you take by STANDING IN / touching them**; hold captured zones to accrue score (multi-KOTH). **zone count is PER-MAP (Sam: "you decide how many… based on the map")** — each arena defines its own capture points (Claude picks; ~3 typical, more on bigger 3v3 maps). Great for 3v3.
  - **STOCK / ELIMINATION** — lives-based last-team-standing (vs the current sudden KO).
  - **JUGGERNAUT** — one buffed bot vs everyone; whoever kills it becomes the new juggernaut.
  - **VIP / HQ / BASE DEFENSE** (Sam — "this might be multiple game modes"): (a) **HORDE / SURVIVAL** — fend off WAVES of CPU enemies (PvE); (b) **BASE / VIP DEFENSE** — both teams protect a VIP or a base; (c) **VIP ROTATION (3v3)** — one alliance tank is the VIP; when the VIP dies the NEXT tank becomes VIP; **non-VIP tanks respawn UNLIMITED**; the alliance is eliminated only when **EVERY tank has died while it was the VIP**.
  - (lower priority) **BOMB DELIVERY** (carry a bomb to a goal), **TERRITORY**, **HOARD/COLLECT** (gather scattered pickups).
Shares the MAP-SELECT screen (P3); ties into TOURNAMENT v2 (a mode per bracket). Each mode = a score/time HUD + a win condition; reuse the ball/pickup + zone primitives where possible (the ball mode already has carry/drop + zones to borrow from).

---

## ⭐ REORGANIZED ROADMAP — sequenced + status (2026-06-16, post-playtest #2)
**✅ DONE:** P0 flanking brain · SPINNER/PISTON front-pierce · STALEMATE count-out · **FLAME turret-aim (ARCADE-only) + 2× range / narrow cone + animated render + RoboRumble RUMBLE (v5.1.99–100)** · **directional LT dash (dodge)** · **DOZER rename + bulldozer-blade render (v5.1.101)**.

**▶ NOW — finish P1 WEAPON ROSTER (re-run `bbbalance.js` after each):**
1. **DOZER grab-and-slam** + its **chassis-forward RT ram charge** (LT stays the dodge) — fixes wedge 0%. ← immediate next
2. **FLIPPER** — fling the foe back (sets up ring-outs).
3. **PINCER** — grab + immobilize (3v3 role).
4. **Drop RAM-ONLY** as a pickable.
5. (deferred) **PISTON air-tank** — only if piston needs the constraint.

**THEN (resequenced, with dependencies):**
- **P3 — ARENA: hazards + MAP-SELECT screen.** *Pulled EARLIER than the old order* — it UNBLOCKS ring-outs (flipper), the dozer-slam surfaces, AND most of the P9 game modes (capture-point placement, push-ball goals, KOTH hill spots) need per-map geometry + the select screen. The pivotal middle chunk.
- **P2 — PERKS slot** + **P4 — MINIBOTS** (the minibot is a perk → build them together).
- **P5 — DRIVE SYNERGIES** (tank push + blade; arcade benefit) → **P6 — BOT-NAME EGGS** (ride on the roster + synergies).
- **P9 — GAME MODES** (needs P3): KOTH (classic / roaming / oddball) · CTF · PUSH-BALL/PAYLOAD (reuse the ball plow) · DOMINATION (per-map capture points) · SUMO ring-out · STOCK · JUGGERNAUT.
- **P7 — COMBAT CHEATS** — small; slot in opportunistically (incl. the new **BOUNCY tank shots**, which is a quick standalone win any time).
- **P8 — BALANCE TOOLING** — runs THROUGHOUT (the tuning gate; re-sim after every weapon/perk/map).

**SEPARATE (non-RoboRumble backlog):** universal **SPLASH SETTINGS** — export/import SCORES · CONTROLS · HIGH SCORES · ACHIEVEMENTS · GHOSTS. Belongs with the setup/menu work, not this combat PRD.

## Constraints (unchanged)
Single self-contained HTML file, no assets, no deps; exact-anchor patches with count-asserted tests; `node --check` + full battery green before each ship; headless harness can't verify render/feel (Sam's eyeball gate for those).

## CHANGELOG
- v1.1 (2026-06-16, post-playtest #2): REORG. Marked DONE (flame turret-aim now ARCADE-only + 2× range/narrow cone/animated/rumble, directional LT dash, dozer rename+render). Added the ⭐ REORGANIZED ROADMAP that **pulls P3 (hazards + map-select) earlier** (it gates ring-outs + the P9 modes). Added **P9 GAME MODES** (KOTH variants, CTF, push-ball/payload, domination/capture-points, sumo, stock, juggernaut), **BOUNCY tank shots** to P7, the **DOZER grab-slam + chassis-forward RT ram** spec, and the dash-rule revision (LT dodge / RT ram). Flagged universal SPLASH SETTINGS as a separate non-combat backlog item.
- v1.0 (2026-06-16): Initial capture from the playtest brain-dump. Records the balance-sim finding (flanking CPU is the gate), the full weapon roster + perks + minibots + hazards + map-select + drive synergies + bot-name easter eggs + combat cheats, and a suggested sequence. v5.1.95/96 shipped the first combat-feel pass + the sim.
