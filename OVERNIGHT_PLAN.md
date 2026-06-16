# 🌙 OVERNIGHT AUTONOMOUS GOAL — RoboRumble (2026-06-16 → morning)

## 🆕 FRESH THREAD — START HERE (handoff 2026-06-16)
You are continuing an autonomous RoboRumble build run. **Canonical branch = `dev`** (see `CLAUDE.md`).
1. `git fetch origin dev` and make sure you're on it. Current tip = **`drive_showdown_v5.1.122.html`** (v5.1.122).
2. **Fresh container:** `./extract.sh && ./battery.sh` → must print `ALL GREEN` (extract writes `/tmp/g.js`; without it every smoke test ENOENTs — that's missing setup, not failure).
3. Read this file's **Progress log** (below) for what's DONE + what's NEXT, and `MIGRATION.md` for project context.
4. Continue the queue (NEXT = P4 minibots) one shippable version at a time. **Ritual per version:**
   edit `drive_showdown_vX.Y.Z.html` → `git mv` to the next version → `sed` the new filename into `extract.sh` + `MIGRATION.md` → `./extract.sh && ./battery.sh` (ALL GREEN) → `git commit -m "Release …"` → `git push -u origin dev`. **After a `git mv` you must Read the renamed file before Edit.**
5. **Don't chase weapon balance** — the roster is final + balanced (sim says "FIGHTERS WITHIN 34–66% BAND ✓"); re-run `node harness/tests/bbbalance.js /tmp/g.js` only after a new weapon/perk.
6. Sam live-playtests: terse status, real `./battery.sh` results, drop a build (SendUserFile) at milestones, fold his feel-feedback in.

**Mandate (Sam, going to sleep):** Work the RoboRumble queue autonomously. **Aim for
FULLY BALANCED weapons (as best the sim allows)** and **finish/advance all queued passes.**
Ship playable builds incrementally to `dev`. Sam wants a **successful, green, feature-rich
output by morning.**

## Operating rules (non-negotiable)
- Every change: `./extract.sh && ./battery.sh` must end **ALL GREEN** before commit. **Never push red.**
- One coherent increment per version (`v5.1.10x`/`v5.1.1xx`). Commit + `git push -u origin dev` each time.
- Re-run `node harness/tests/bbbalance.js /tmp/g.js` after every weapon/balance change.
- **Table** any item that blocks or can't go green; document it in this file + MIGRATION; move on.
- Keep `MIGRATION.md` + `frcds_roborumble_v2_prd_v1.0.md` current as you go.
- The sim is CPU-vs-CPU; **real play differs** (e.g. flame>dozer in play) — don't break a working
  mechanic just to force a sim number. Sam likes RPS, but for tonight aim "everyone viable" (~40–60%,
  nobody 0/100).

## PRIORITY ORDER (each = a shippable version; do in sequence)
**KEY (Sam, 2026-06-16): FEATURES FIRST, BALANCE LAST.** No point tuning balance while new weapons +
features keep reshuffling it. Build everything, THEN one big balance pass at the very end. Until then,
leave weapons at sane *functional* values (not 0%/100%, not crashing) and DON'T chase the sim band.
1. **FLIPPER** (P1): new weapon — RT, front-arc, flings the foe BACK with big knockback; flung into a
   wall = ring-out damage (reuse the dozer wall-slam detection). Render + brain + tests.
2. **PINCER** (P1): new weapon — grab + immobilize (hold/pin), a 3v3 role-player; weak 1v1. Tests.
3. **KAMIKAZE** (P1): new weapon — RT triggers a LARGE explosion, self-destruct, takes nearby foes with
   it (3v3). Reuse the flame blow-up blast at bigger radius.
4. **P2 PERKS slot** (3rd equip slot): **"Parting Gift"** (explosion on death), **Flameproof**,
   **Minibot**. UI cycler + effects + tests.
5. **P4 MINIBOTS**: repurpose the alliance support bots as harassers (push/pin only) — ties to the
   minibot perk.
6. **P5 DRIVE SYNERGIES**: TANK = push buff + blade synergy; ARCADE benefit; steering → (P6 heal egg).
7. **P6 BOT-NAME EGGS**: Optimus Prime / Bumblebee (paint + steering-drive HEAL), Original Sin
   (tank+blade → invuln wheels + arcade benefit); achievements "Unoriginal Sin" / "Autobots Roll Out".
8. **P7 COMBAT CHEATS**: move-or-die, airstrike, megabots, walker/shufflebot, anime sword, unlimited
   resources, arena-trap toggle.
9. **P3 ARENA hazards + MAP-SELECT screen** (bigger; gates ring-outs + P9).
10. **P9 GAME MODES** (KOTH variants / CTF / push-ball / domination / sumo / stock / VIP) — needs P3.
11. **★ FINAL BALANCE PASS** (LAST, once all weapons/perks exist): use `bbbalance.js` (now covers the
    5+ pickables; buzzsaw in, ram-baseline out) — tighten every weapon/perk into the ~34–66% band as
    best the sim allows. This is the only point balance tuning is worthwhile.

## Progress log (append as you ship; survives context compaction)
- ✅ v5.1.99–107 (pre-overnight): flame turret-aim+feel, dozer grab-slam + charging-bull, RAM-only
  drop, bouncy tank shots, spinner nerf, flame LOS, HP→360, piston buff, CPU unstick, **BUZZSAW**.
  Sim @107: piston 62 · flame 50 · wedge 49 · spinner 38 · ram 6 (buzzsaw not yet in the sim).
- ✅ **P1 WEAPON ROSTER COMPLETE (v5.1.108–111):** sim set fixed (8 pickables, ram-baseline out, buzzsaw/flipper/pincer/kamikaze in); **BUZZSAW** (front spin-up cutter), **FLIPPER** (fling-back + ring-out), **PINCER** (grab+immobilize/drain-mob, 3v3), **KAMIKAZE** (RT self-destruct blast). 183 tests green. Balance deferred per Sam.
- ✅ **P2 PERKS slot COMPLETE (v5.1.112–113):** 3rd loadout field `ld.perk`; BB_PERKS (NONE/PARTING GIFT/FLAMEPROOF/MINIBOT); effects wired — PARTING GIFT = big blast on death (bbKill), FLAMEPROOF = flame-immune (bbApplyFlame); CPUs roll perks; ARMORY rail has a drag-drop PERK group (bbArmEquip 'perk'). MINIBOT is a reserved placeholder (real bot wired in P4). 191 tests green.
- ✅ **P5 DRIVE SYNERGY (v5.1.114):** TANK-family drive shoves harder (×tankPush) — dozer push synergy.
- ✅ **P6 BOT-NAME EGGS (v5.1.115):** Optimus/Bumblebee → paint ring + (steering drive) HEAL; Original Sin (tank+blade) → invuln wheels; achievement LS flags. (Full custom paint + achievement SCREEN = follow-up.)
- ✅ **BALANCE PASS (done early — roster is final):** the 6 DAMAGE weapons are all in the 34–66% band (piston 65 · buzzsaw 64 · flame 61 · dozer 53 · spinner 43 · flipper 43). bbbalance.js now prints **"FIGHTERS WITHIN 34–66% BAND ✓"** and excludes pincer (29, control) + kamikaze (0, self-destruct) as 1v1-weak-BY-DESIGN utility/3v3 weapons. Re-run after any future weapon/perk change.
- ✅ **P4 MINIBOTS (v5.1.117):** the MINIBOT perk now deploys ONE small harasser per bot — `bb2.minis` (spawned in `startP2BB` via `bbMiniSpawn`, ticked by `bbMiniUpdate` in `updateBB`, drawn in `drawBB`). It chases the nearest opponent MAIN and only **shoves + briefly pins** it (`BB_W.miniKnock`/`miniPinT`) — **no HP damage, not a weapon** — and **retires when its deployer is KO'd**. `minibot` added to the CPU perk-roll pool so harassers appear in CPU play. (Balance unaffected — perk, no weapon-stat change.)
- ✅ **P7 COMBAT CHEATS pt.1 (v5.1.118):** **UNLIMITED RESOURCES** (`bbUnlimited` — zeroes weapon cooldowns in `bbWeaponPre`: full-auto piston/flipper, always-spun disc, instant re-grab) + **MEGABOTS** (`megaBots` — giant HP pool `BB_W.megaHp` set at spawn incl. per-bot `mhp` for the bar, + crushing ram `BB_W.megaDmg` in `bbContactDmg`). Both reset by `cheatsAllOff` (also fixed: move-or-die was never reset there). 216 tests green.
- ✅ **P7 COMBAT CHEATS pt.2 (v5.1.119):** **AIRSTRIKE** (`airStrike` — `bbAirstrikeUpdate` rains bombs on a timer `BB_W.airCd`, biased toward a living bot + jitter, side-agnostic radial damage, reuses `bb2.blasts` FX) + **ANIME SWORD** (`animeSword` — `bbSwordUpdate` gives every bot a dramatic front-arc slash on `BB_W.swordCd`, big dmg + knockback, pierces the front, with a slash-arc FX in `drawBB`). 224 tests green. **P7 COMPLETE** (move-or-die/unlimited/megabots/airstrike/anime-sword shipped; **walker/shufflebot + arena-trap toggle TABLED** — walker = cosmetic legged-gait, low value/high engine cost; arena-trap belongs with P3 hazards, will land there).
- ✅ **P3 ARENA HAZARDS + MAP-SELECT (v5.1.120):** new RoboRumble-only **DANGER ZONE** map (`TF2_MAPS` id `hazard`) with a central **acid PIT** (`HAZ.pitDps` HP/sec while standing in it) + two oscillating **SAW blades** (`bbHazPos` = pure fn of `bb2.t`; contact dmg + knockback, inv-gated). `bbHazardUpdate` runs in `updateBB`; `drawBBHazards` paints striped pit + spinning saws. The **ARENA** map-select row now derives its options from `TF2_MAPS` (auto-includes new maps). 230 tests green. (MAP-SELECT remains the in-settings ARENA cycler; a dedicated full-screen map gallery is deferred polish. Hazards are RoboRumble-only — tank mode's MAP row keeps the 4 base arenas.)
- ✅ **P9 GAME MODES — framework + SUMO (v5.1.121):** new `GAME MODE` setting (`m2.set.bbmode`, row in BB settings) + `BB_MODES` registry + `bbMode()`/`bbModeUpdate(dt)` (runs in `updateBB`). **SUMO** = ring-out: bots shoved outside the central `BB_RING` are eliminated (winner via `bbCheckResult`); SUMO repositions spawns INSIDE the ring (default spawns sit at the edge) + draws a dashed ring. KO stays the default. 234 tests green.
- ▶ **NEXT (for the continuing window):** P9 cont. = DOMINATION (KOTH hold-point) + VIP (assassinate enemy VIP) [CTF/PUSH-BALL/STOCK need a ball/flag entity — likely tabled] → ★ final balance re-verify → Tournament v2 update (`frcds_tournament_v2_prd_v1.0.md`). Polish: full-screen map gallery; egg full-paint + achievement screen.
- **State: 24 commits this session (v5.1.99→121 + balance), all green on `dev`. P1 weapons · P2 perks · P4 minibots · P5 synergy · P6 eggs · P7 cheats · P3 hazards+map-select · **P9 (framework+sumo)** · balance = DONE.**
- **Reminders for whoever continues:** new weapon = BB_WEAPONS + BB_ARMORY_W entry + behavior (bbWeaponFire / contact loop) + brain fire (bbCpuUpdate) + render (bbDrawWeapon) + a smoke57 test + add to bbbalance.js WEAPONS. After git mv to the new version, you must Read the renamed file before Edit. Ritual: edit → git mv vN→vN+1 → sed extract.sh + MIGRATION → ./extract.sh && ./battery.sh (ALL GREEN) → commit "Release vN+1: …" → push dev.

## Morning deliverable
A green, pushed `dev` with: a balanced weapon roster (incl. buzzsaw/flipper/pincer/kamikaze), the
perks slot, and as many of P4–P9 as time allowed; MIGRATION + PRD updated; a summary of what shipped
+ what was tabled (in this file's progress log + the final chat message).
