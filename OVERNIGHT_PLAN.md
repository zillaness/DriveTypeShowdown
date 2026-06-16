# 🌙 OVERNIGHT AUTONOMOUS GOAL — RoboRumble (2026-06-16 → morning)

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
- ▶ NEXT: BALANCE PASS (item 1) — add buzzsaw to bbbalance.js, then tighten the spread.

## Morning deliverable
A green, pushed `dev` with: a balanced weapon roster (incl. buzzsaw/flipper/pincer/kamikaze), the
perks slot, and as many of P4–P9 as time allowed; MIGRATION + PRD updated; a summary of what shipped
+ what was tabled (in this file's progress log + the final chat message).
