# 🌙 OVERNIGHT AUTONOMOUS GOAL — RoboRumble (2026-06-16 → morning)

## 🆕 FRESH THREAD — START HERE (handoff 2026-06-16)
You are continuing an autonomous RoboRumble build run. **Canonical branch = `dev`** (see `CLAUDE.md`).
1. `git fetch origin dev` and make sure you're on it. Current tip = **`drive_showdown_v5.1.116.html`** (v5.1.116).
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
- ▶ **NEXT (for the continuing window):** P4 minibots (+ wire the MINIBOT perk) → P7 combat cheats (move-or-die, megabots, airstrike, walker, anime sword, unlimited resources, arena traps) → P3 arena hazards + MAP-SELECT screen → P9 game modes (KOTH/CTF/push-ball/domination/sumo/VIP). Polish follow-ups: egg full-paint + achievement screen; pincer/kamikaze 3v3 feel.
- **State: 19 commits this session (v5.1.99→115 + balance), all green on `dev`. P1 weapons · P2 perks · P5 synergy · P6 eggs · balance = DONE.**
- **Reminders for whoever continues:** new weapon = BB_WEAPONS + BB_ARMORY_W entry + behavior (bbWeaponFire / contact loop) + brain fire (bbCpuUpdate) + render (bbDrawWeapon) + a smoke57 test + add to bbbalance.js WEAPONS. After git mv to the new version, you must Read the renamed file before Edit. Ritual: edit → git mv vN→vN+1 → sed extract.sh + MIGRATION → ./extract.sh && ./battery.sh (ALL GREEN) → commit "Release vN+1: …" → push dev.

## Morning deliverable
A green, pushed `dev` with: a balanced weapon roster (incl. buzzsaw/flipper/pincer/kamikaze), the
perks slot, and as many of P4–P9 as time allowed; MIGRATION + PRD updated; a summary of what shipped
+ what was tabled (in this file's progress log + the final chat message).
