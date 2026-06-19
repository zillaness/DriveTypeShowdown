# 🌙 OVERNIGHT AUTONOMOUS GOAL — RoboRumble (2026-06-16 → morning)

## 🌙 TONIGHT (2026-06-19, thread `inspiring-turing`) — START HERE — tip v5.1.220, all green on `dev`
**A long live-playtest session with Sam (v5.1.199→220).** See `MIGRATION.md` → "⏩ CURRENT STATE — 2026-06-19, v5.1.220" for the full shipped list (repair bot, MECHA iai dash-slash, tier-difficulty-as-damage-vs-human, cannon cheats split + explosive/MG/bouncy, CTF return-home, respawn↔timer rule, grid weapon render, abs-heading snap fix, Last-Stand win-in-window fix, gray cannon, map gallery→Tank Fight).

**Sam's mode tonight = FEEL-FIRST live iteration**, not an autonomous balance grind. The 1v1 CPU-sim is a coarse directional tool (spinner 72 / pincer 11 / kamikaze 0) — **NOT a tuning target.** Ship one green increment per fix, drop a build at each.

**📋 APPROVED BACKLOG PLAN (2026-06-19) — see `/root/.claude/plans/moonlit-scribbling-zephyr.md` for the full phased plan.** Sam approved planning all of tonight's backlog. Sequence (small→big): **F1 map gallery ✅ v5.1.220** → **F2 eggs full paint + color picker + achievements** → **F5 custom map editor** → **F3 Tournament v2 (T2/T4/T1)** → **F4 STOCK→6p FFA**. Two surprises from exploration: the achievements SCREEN already exists (eggs just need wiring into it), and the RoboRumble map gallery already existed (F1 = extend to Tank Fight, done). F2 Original Sin livery is LOCKED by Sam: black+silver body, **4 black animated/spinning wheels even in tank drive** (override treads), **yellow dozer blade**.

**🎬 FUTURE VISION — CAREER / STORY MODE (Sam, 2026-06-19):** a narrative campaign that threads the existing modes into a progression as the player "grows up": **middle school** = learning to drive → **OBSTACLE RACE**; **high school** seasons = the **BALL** modes, first PUSHER then SHOOTER the next season; **college** = TANK FIGHT framed as "the video game you play in your dorm"; **graduate** = you're now competing in **ROBORUMBLE**. Big feature (new meta-shell: progression state, unlocks, story beats between matches) — captured here so it isn't lost; not scoped yet.

**🎮 LIVE PLAYTEST QUEUE (2026-06-19, Sam — newest first; ✅ = shipped):**
- ✅ PUSH-BALL: physics fix (v5.1.222), flavored weapon interactions + pincer carry (v5.1.223), kamikaze launches the ball + FF blasts (v5.1.225), soccer ball + GOALS TO WIN setting (v5.1.226).
- ✅ ORIGINAL SIN: full livery + H-strafer black wheels + yellow blade (v5.1.221/224), invuln wheels + ½ damage buff (v5.1.225).
- ✅ PUSH-BALL CPU weapon-awareness (v5.1.227): the push-ball CPU now FACES the ball and FIRES its weapon (pusher/piston/jet/flame/dozer/drill/pincer/spinner) when lined up behind it, not just body-shoving. (`bbCpuUpdate` pushball block.) Also: Original Sin buff on tank OR arcade.
- ✅ 3v3 IN-MATCH SENSITIVITY (v5.1.228): `p2SensAdjust` looped only 2 players → 3v3 back seats couldn't change sens mid-match. Now loops all `playerBind`; toasts via `p2SeatSide`.
- ✅ CONTROLLER COMPAT (v5.1.229): SPLASH gets stick/D-pad nav + focus cursor + A-select (SETTINGS reachable on a pad); 3v3 GRID — D-pad no longer instantly claims the seat under the cursor, BACK drops a CPU into the next open seat, B releases/swaps.
- ✅ ABSOLUTE HEADING ↔ DRIVE FRAME coupling (v5.1.230): field-centric drives auto-enable absHeading, bot-centric disable it; still a global toggle the user can override. `driveFieldCentric`/`absHeadingCouple`.
- ✅ EGG ACHIEVEMENTS (v5.1.231, F2b): egg unlocks now show in the Achievements screen ("Autobots, Roll Out" / "Unoriginal Sin"); legacy `bb_egg_*` migrated.
- ✅ CUSTOM PAINT picker (v5.1.232, F2c): click a bot's chassis preview (🎨) on the 1v1 card / 3v3 seat to cycle a paint palette (`ld.paint`); `_bbPaint` repaints body+accent in-match + on the setup preview. Completes the eggs "Both" request.

**ALL of the live playtest queue + the approved F1–F5 backlog are SHIPPED (tip v5.1.232, all green on `dev`).** Remaining big-ticket backlog (needs Sam, not yet started): STOCK→6-player FFA (F4, ~10h+), Tournament v2 (F3: T2 3v3-grid / T4 per-match map / T1 input), custom MAP EDITOR (F5), career/story mode (future vision).

**Backlog / what's parked (most needs Sam in the loop):**

**🏆 TOURNAMENT v2 — LOCKED DESIGN (Sam, 2026-06-19):**
- **TWO formats (a setting):**
  - **SINGLE-ELIM (party) — KEEP the EXISTING tournament, do NOT lose it.** Up to **16**, single bracket. Lighter: 1v1 (optionally + alliance bots) or 3v3 with one human per side.
  - **DOUBLE-ELIM ("FRC mode") — NEW.** Up to **8**. Losers' bracket + **best-of-3 GRAND FINAL**.
- **Rosters: captain DRAFT from a shared pool** (snake order) — wire the existing `tourAllianceDraft`. Usable in BOTH formats.
- **Seeding: MANUAL** seeding of the human players (rank the ≤8 humans); **pre-ranked CPUs (by tier) auto-fill the empty slots.**
- **Lineup: set ONCE at registration (the drafted bots). NO per-match switching now.**
- **Mode: ONE mode for the whole bracket; the MAP varies per match** (T4, reuses the generalized map gallery).
- **Context:** ball modes are the best-tuned competitive showcase; RoboRumble tournaments lean on weapon-lineup strategy (its champ/vet/rookie tiers aren't as tuned yet).
- **TABLED for the FUTURE (as tournament settings):** (a) per-match lineup/loadout swaps; (b) **4-bot alliances with a swappable BACKUP** (sub a bot in/out between matches, vs choosing any lineup).
- **Build phases (UI-heavy, hands-on):** ① keep single-elim intact + add a FORMAT setting (single ≤16 / double ≤8) → ② double-elim bracket engine (losers' bracket + bo3 final) → ③ manual human seeding + CPU tier auto-fill → ④ captain-draft screen (snake from shared pool → 3-bot rosters) → ⑤ T2 route bracket matches through the 6-seat grid with the drafted lineups → ⑥ T4 per-match map-select → ⑦ T1-hard registration text-input fix.

- **STOCK → 6-player FFA** (F4) — scoped ~10h+ (engine hard-wires 2 sides: spawn, win-detection, ~51 touchpoints). Recommend a playtest session, not unattended. No separate format toggle — the lives/timer settings (kept valid by the respawn↔timer rule) pick last-standing vs most-kills.
- **Tournament v2** (F3) — see the LOCKED DESIGN block above. Model landed (`tourAllianceDraft`); rest is UI + the locked decisions. Needs Sam.
- **Custom MAP EDITOR** (F5) — **IN PROGRESS (current build).** In-game editor (paint walls/hazards/pickups on the field) → save to `customMaps` in localStorage → export/import as JSON or share-code. Steam Workshop needs an Electron + Steamworks packaging layer (out of scope for the HTML build) but the JSON format is Workshop-ready.
- **TABLED by Sam 2026-06-19:** KAMIKAZE 0%-in-3v3 CPU brain · tier-difficulty lapse/react depth · jet CPU dash-through. **Earlier:** repair heal↔buff cycle · weapon-balance feel re-tune. **DONE this session:** gray cannon render (v5.1.219), map gallery→Tank Fight (v5.1.220).

**Operating ritual unchanged** (see below): `./extract.sh && ./battery.sh` ALL GREEN → `git mv` vN→vN+1 → `sed` filename into `extract.sh`+`MIGRATION.md` → commit "Release …" → push `dev` + session branch.

---

## 🆕 FRESH THREAD — START HERE (handoff 2026-06-16)
You are continuing an autonomous RoboRumble build run. **Canonical branch = `dev`** (see `CLAUDE.md`).
1. `git fetch origin dev` and make sure you're on it. Current tip = **`drive_showdown_v5.1.210.html`** (v5.1.205). **See the `## 🌅 OVERNIGHT 2026-06-18` section near the bottom — that's the freshest state + open items.**
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
- ✅ **P9 GAME MODES — DOMINATION + VIP (v5.1.122–123):** **DOMINATION** (KOTH) = hold the center `BB_DOM_R` zone uncontested to bank time; first side to `BB_DOM_TARGET`s wins (`bbModeUpdate` sets result; zone + hold meters drawn). **VIP** = the first bot per side is its VIP (marked at spawn); `bbCheckResult` resolves VIP first — a side loses the instant its VIP dies (crown drawn over VIPs). P9 ships **KO/SUMO/DOMINATION/VIP**; CTF/PUSH-BALL/STOCK **TABLED** (need a ball/flag entity — bigger). 241 tests green.
- ✅ **★ FINAL BALANCE RE-VERIFY (v5.1.123):** re-ran `bbbalance.js` after all the P4/P7/P3/P9 work — still **"FIGHTERS WITHIN 34–66% BAND ✓"** (piston 65 · buzzsaw 64 · flame 61 · wedge 53 · spinner/flipper 43; pincer/kamikaze excluded utility). No tuning needed (modes/cheats/perks/hazards don't touch weapon stats).
- ✅ **TOURNAMENT v2 — T3: RoboRumble in the bracket (v5.1.124):** added `battlebots` to the tournament MODE cycler + the MATCH-MODE label, and **fixed the bracket result-router** (`p2NavClick` read `r2/tf2/b2` but never `bb2`, so RoboRumble matches couldn't report a winner) — now resolves `bb2.result`, with a **DRAW → replay** guard (mutual destruction is undecisive in a bracket). A RoboRumble single-elim bracket now completes end-to-end. smoke33: 3 new asserts; battery green. (T1 alliance-registration + T2 3v3-via-grid + T4 per-match map-select remain — the bigger UI overhaul; RoboRumble bracket matches currently run as the mode's natural format via the legacy claim.)
- ✅ **TOURNAMENT v2 — T1-light: alliance framing (v5.1.125):** the registration screen now speaks **ALLIANCES** (team names), not per-player entrants — header subtitle, the input placeholder ("type an ALLIANCE name…"), and the counter ("ALLIANCES — N of 4–16 registered"). smoke33 asserts the alliance framing. (The deeper T1 fix — the native-input overlap/typing bug — is canvas/DOM eyeball work; the model already stores a names→alliances list, so this reframes it without a data migration.)
- ✅ **P9 — CPU MODE-AWARENESS (v5.1.126):** the new game modes now play well vs CPUs. In `bbCpuUpdate`: **VIP** → CPUs HUNT the enemy VIP (ignore grunts); **DOMINATION** → a CPU outside the zone drives to the center to hold the point (still facing the foe to trade); **SUMO** → a CPU near the ring edge pulls back toward center so it doesn't ring itself out. All mode-gated (KO + the balance sim unaffected). 244 tests green. (`me._foe` exposed for the test.)
- ▶ **NEXT:** Tournament T2 (3v3 via the 6-seat grid — route bracket matches through `m2.tseats` + carry alliance identities/lineups through claim/result/champion; today bracket matches run the mode's natural format via the legacy claim) → T4 (per-match map-select screen) → T1-hard (native-input overlap/typing fix, eyeball). Polish: full-screen map gallery; egg full-paint + achievement screen; P9 CTF/push-ball (needs a ball entity). **NOTE for whoever continues: T2/T4/T1-hard are UI/render-heavy — best done with Sam able to playtest (the model/routing slices are landed; what remains is eyeball work).**
- ✅ **P9 — MODE OBJECTIVE HUD (v5.1.127):** `bbModeHint()` makes the in-match instruction line spell out each mode's win condition (SUMO/DOMINATION/VIP/KO) instead of always the KO text. 245 tests green.
- ✅ **FEEDBACK PASS (v5.1.136–158):** P1 weapon feel (pusher fling + ring-out, drill spin-up readout/HUD gauge, more weapon rumble); **REPAIR TORCH** support weapon (heal allies/repair tires, chip enemies); perks pass (NONE removed; **VAMPIRE/SPARE TIRE/PIT STOP**); armor pass (LIGHT faster, HARDPLATE tougher, + **RUNFLAT/REACTIVE**); AIRSTRIKE shrinking-crosshair telegraph; cheat-menu reorg (themed two-column layout, sliders beside their toggles).
- ✅ **P5 — CROSS-MODE CHEATS (v5.1.159):** the **AIRSTRIKE** cheat now also lands in **TANK FIGHT + BALL** modes, where it **STUNS instead of KOs** (reuses the ram-stun `stunT`/`BOOST.stun`). New shared `p2AirstrikeUpdate`/`p2AirDraw` (telegraph→detonate, proximity-scaled stun + knockback + rumble) hooked into `updateP2Tank`/`updateP2Ball`; a universal stun-freeze now applies even when RAMMING is off; `drawStun` renders for airstrike-stunned bots too. New suite **smoke60 (15 asserts)**; full battery green. (Other RoboRumble cheats stay RoboRumble-scoped for now — airstrike was the headline cross-mode example.)
- ✅ **PLAYTEST FIXES (v5.1.160):** (1) **PUSHER reach FIX** — `flipRangeK` 0.9→1.6 (RR*1.9=32.3 sat UNDER touching RR*2=34, so the thrust whiffed at point-blank; now RR*2.6 catches a pressed foe) + wider arc + harder/longer fling; sim flipper 19%→57% (in band). (2) **DRILL reach FIX** — same bug (`drillReachK` 0.7→1.3) + faster ramp + higher DPS; raw HP already penetrates the front. (3) **REACTIVE armor rework** — the first hit on each side (front/side×2/rear) is now fully ABSORBED (zero damage) AND blasts the attacker (reflect 85→120) + a detonation ring. (4) **1v1 side-select fix** — the "click empty side to claim it" hotzone was a tiny y=484 box; now the whole empty card selects that side (a missed click defaulted you to RED). (5) **cheats-over-pause fix** — `draw()` no longer paints the pause overlay over the konami cheat menu. Full battery green. (Weapon sim still drifted — flame/buzzsaw high, drill/spinner low — a dedicated tuning pass is pending.)
- ✅ **PLAYTEST FEEL PASS (v5.1.161):** (1) **PIT STOP reworked → a MEDIC drone** — deploys a repair minibot (like the harasser, `kind:'medic'`) that seeks the most-damaged ALLY (incl. owner) and patches HP + mobility + re-welds wheels; any build wants it now (passive out-of-combat regen removed). (2) **Minibots are DESTRUCTIBLE** — `miniHp`/`miniDps`: an enemy in contact grinds a drone down (spin/weapon adds bite), with a hit-flash + death blast. (3) **Spinner/buzzsaw RECOIL removed** — no more self-damage while dealing damage; the SPINNER still sheds RPM per bite (re-spin), the **BUZZSAW now HOLDS its speed** (no re-spin). (4) **Buzzsaw full-speed animation FIX** — the discrete teeth strobed/aliased to a standstill; at speed it now renders a motion-blur disc. (5) **PUSHER buffed hard** — fires on EDGE contact (reach RR*3, ±81° arc so you needn't hit center) + flings much further (1500 + slower decay). smoke57 348 green (3× stable). (Sim: pusher now 88% — feel-first per Sam; weapon re-tune still pending.)
- **State (cumulative, both threads): all green on `dev`, tip v5.1.161. P1 weapons · P2 perks · P4 minibots(destructible) · P5 synergy · P6 eggs · **P7 cheats** · **P3 hazards+map-select** · **P9 modes** · **Tournament T3 + T1-light** = DONE. dev tool `bbbalance2.js`. OPEN: weapon balance re-tune; perks in the 3v3 grid (only weapon+armor pickable there today); drag-drop discoverability.**
  - Prior thread (handoff base): v5.1.99→116 (P1 weapons · P2 perks · P5 · P6 · early balance · move-or-die).
  - **This thread: v5.1.117→135 (19 releases)** — P4 minibots; P7 cheats (unlimited/megabots/airstrike/anime-sword) + **ARENA TRAPS** (v133); P3 hazards+map-select; **P9 COMPLETE — 8 modes** (KO/SUMO/DOMINATION/KOTH/VIP/CTF/PUSH-BALL/STOCK, v121–132) + CPU mode-awareness + objective HUD; balance re-verify; Tournament T3 + T1-light; polish: **RANDOM arena** (v134); **Tournament T2 foundation: `tourAllianceDraft` FRC alliance-selection model** (v135). **walker/shuffle-bot still TABLED.**
  - **▶ TOURNAMENT — remaining (decision-gated, mostly UI):** wire `tourAllianceDraft` into the flow (register teams → rank → draft → seed alliances into the existing `tourBuild` bracket); **DECISIONS to pin:** (A) lineup at registration vs match-time grid, (B) race stays 1v1-lane?, (C) captain-promotion cascade rules (seed-1-recruits-seed-2), (D) 1v1 vs 3v3 default + min field for 3v3. Then T4 per-match map-select, T1-hard input fix. NOTE: game modes are **RoboRumble-only** — porting any to TANK FIGHT = a separate wiring job (GAME MODE row for tank + a mode hook in the tank loop), not yet done.
- **Reminders for whoever continues:** new weapon = BB_WEAPONS + BB_ARMORY_W entry + behavior (bbWeaponFire / contact loop) + brain fire (bbCpuUpdate) + render (bbDrawWeapon) + a smoke57 test + add to bbbalance.js WEAPONS. After git mv to the new version, you must Read the renamed file before Edit. Ritual: edit → git mv vN→vN+1 → sed extract.sh + MIGRATION → ./extract.sh && ./battery.sh (ALL GREEN) → commit "Release vN+1: …" → push dev.

## 🌙 TONIGHT (2026-06-17) — GOAL + QUEUE (set with Sam before sleep)
**GOAL:** Ship the **Absolute Heading Control** drive toggle and fully polish the new **CANNON**
weapon — all green on `dev` — with the weapon/armor/perk balance **reported** and **held** for Sam's
buff/nerf feedback (do NOT guess balance changes tonight).

**QUEUE (in order):**
1. ✅ **v5.1.175 CANNON weapon** — the tank cannon as a PICKABLE (any player/CPU can equip). RT fires
   shells at range; turreted aim (arcade=stick/mouse; swerve/holo rotate-to-aim while strafing;
   tank/steer fire forward). Sim ~61% (stronger for a human). + `bbreport.js` armor/perk sweep.
2. ✅ **v5.1.176 flame BLOW-UP RING** — big distinct meter ring (dark track + glowing yellow→orange→red
   fill), slow unfill, **human/CPU decoupled** (human heats fast/satisfying, CPU slow/balanced; flame 55.6%).
3. ✅ **v5.1.177 ABSOLUTE HEADING toggle (snap-to-angle)** — Settings row + `absHeadingVr`; right-stick
   ANGLE = chassis facing (rotate toward it) vs default rate-of-rotation; default OFF; skips steer +
   arcade turret-lock; smoke54 +7.
4. ✅ **v5.1.178 CANNON polish** — human aim path verified (arcade stick/mouse + aim-assist via
   `bbAimAngle`→`weaponAng`); fire SFX present; + a RELOAD CUE (muzzle glows green when loaded, humans only).
5. ✅ **Perk table trustworthy** — `bbreport.js` now measures a no-perk baseline (the bots[0] A/B handicap
   = 25%) and normalizes: minibot/pitstop 100 · partinggift 85 · flameproof/vampire/sparetire ~50 (no 1v1 edge).
6. ✅ **Docs** — MIGRATION.md recent-history refreshed (v5.1.175–178).
7. ✅ **v5.1.179–180 BALANCE PASS (Sam's calls):** buffed DRILL (+stickiness — a pull that keeps the foe
   on the bit; 37→44), DOZER (+touch dmg; 34→45), SPINNER (+360° REACH mechanic + dmg; 44→56); buffed
   HARDPLATE (lighter, 30→51) + HEATSHIELD (tougher/lighter, 38→45); + HUMAN flamethrower STICKINESS
   (slows the victim). Piston settled to 66 on its own. **OPEN:** runflat fell to ~28 in the armor
   reshuffle (Sam to decide); heatshield-vs-flameproof-perk overlap (kept — armor frees the perk slot).

**NEXT (Sam's stated priorities, in order):**
A. ✅ **PERKS in the 3v3 grid (v5.1.186)** — were already pickable via mouse/touch (cyclers + drag-drop
   since v5.1.173) + carry to the match; the gap was GAMEPAD — added Y=weapon/X=armor/A=perk nav + hint.
B. ✅ **DOMINATION = multi-point (v5.1.187)** — reworked to 3 control points (triangle) with persistent
   ownership; hold more points → score faster; CPU captures the nearest un-owned point; 3 tinted zones.
C. Later / not yet: Tournament v2 (nobody's used it yet), moving game modes to TANK (don't need stock).
   Combat: jet/pusher real-play tuning (pending Sam's 3v3 walled-map read); piston air-tank / flame fuel
   (only if those need reining in); polish (map gallery, egg paint+achievements, drag-drop discoverability).

**STATUS: tip v5.1.180, all green on `dev`. Balance pass DONE. NEXT = perks-in-grid, then domination multi-point.**

**Balance snapshot @ v5.1.176 (for Sam's feedback):**
- Weapons (sim win%): flipper 70 · buzzsaw 67 · piston 66 · **cannon 61** · flame 56 · pincer 53 ·
  spinner 44 · drill 37 · wedge 34 · kamikaze 0 (kamikaze/pincer = 3v3 utility, 1v1-weak by design).
- Armor (mirror win%): balanced 67 · reactive 64 · light 58 · runflat 41 · hardplate 35 · heatshield 35.
- Perks (vs no-perk; ~25% = no 1v1 effect due to a sim bots[0] handicap): minibot 100 · pitstop 100 ·
  partinggift 60 · flameproof/vampire/sparetire ~25 (situational; shine in 3v3 / vs flame).

## 🌅 OVERNIGHT 2026-06-18 (thread `inspiring-turing`) — tip v5.1.205, all green on `dev`

Live-iteration session with Sam, then an autonomous overnight queue. Everything below is on `dev`.

**Shipped this thread (v5.1.199→205):**
- **v5.1.199 — PINCER anchor + 3v3 trigger-claim + REPAIR autofire (first cut).** A clamping PINCER can't be
  shoved off its captive by the JET / PUSHER / PISTON (push from the weapon is denied; dozer still shoves via
  the wheels; rescue-bash + fight-back stay the counters). 3v3 grid claim now accepts the TRIGGERS for
  "press any button" (bumpers excluded = sensitivity).
- **v5.1.200–202 — REPAIR BOT finished (Sam's live design).** Final model: **PASSIVE (no trigger) = a big AoE
  ATTACK-BUFF field** (gentle gold, radius == heal range — the circle IS the heal-range gauge); **ACTIVE (hold
  trigger) = HEAL** (dish stops + locks + points at the ally, green beam from the FRONT feed point; no stick →
  heal the MOST-NEEDY; right stick redirects). Buff turns OFF while healing. Health ring (%HP) on the target.
  Dish redrawn as a real parabolic radar dish (pivots at its front point, no "fuse" stalk). Tunables:
  repairBuffRK 16, repairReachK 15, repairDmgBuff 2.5. **BUGFIX: RED grid seat (index 1) showed 'BLUE' + lost
  the typed name in the HUD** — scoreboard now reads `ctl.name` first.
- **v5.1.201 — #5 weapon on the 1v1 drive-base preview** (reuses `bbDrawWeapon`; `_wpnPreview` flag skips big
  field auras; bb2 stubbed for the claim screen).
- **v5.1.203 — #4 the 1v1 cards get the full drag-drop ARMORY RAIL** (same as the grid; `bb1v1ArmoryOn`/
  `bb1v1SideAt`/`bb1v1Equip` route the drop to `m2.bbLoadout[pl]`; cyclers stay as a tap path).
- **v5.1.204 — #3 TANK FIGHT VIP + SUMO** (game-mode parity done). Both 1-life elimination; `TF2_RING`=290;
  CPU hunts the VIP / stays off the ring edge.
- **v5.1.205 — drag-drop discoverability hint** on the 1v1 claim subtitle.
- **test:** de-flaked smoke57 PUSHER RING-OUT (was ~2/12 → 0/24; froze the flinger so AI drift can't shift the
  RNG-sensitive collision). Battery is now reliably green.

**Open items still parked (unchanged from below):** flame human/CPU separation (playtest call), KAMIKAZE 0% in
3v3 (CPU brain), jet CPU dash-through counter (playtest), tournament v2 (T2/T4/T1), polish (map gallery, egg
paint+achievements). Pending Sam's playtest read on: the finished REPAIR bot, the 1v1 drag-drop rail + weapon
preview, tank VIP/SUMO feel.

---

## 🤝 HANDOFF 2026-06-18 (fresh-thread START HERE) — tip v5.1.198

**What this session shipped (v5.1.175→198), all green on `dev`:**
- **New weapons:** CANNON (ranged explosive shells, now **cheat-gated** — Konami "UNLOCK CANNON"),
  JET ENGINE (area-denial thrust cone). **Tuned the whole roster** toward Sam's 40–60 band.
- **JET:** forward thrust cone, big knockback + wall/bot SLAMS, light trickle dmg (jetDps 16), fast
  spin-up, **OVERHEAT** (heat ring fills CCW + RED warning ~1s before the cut; turbofan visual). Pushes
  minibots (no instakill). Slam-into-bot (a flung/pushed foe into a 3rd bot hurts both). 1v1 ~44%, **3v3 ~69%** (it's a 3v3 weapon).
- **PERKS:** ADRENALINE / PAINKILLER / LAST STAND added; **NO PERK** re-enabled (neutral pick); perks
  fully pickable in the 3v3 grid (mouse/touch/**gamepad** Y/X/A).
- **PINCER counter (1v1):** no forced timer — held captive can **turn + fight back** (grinds the holder
  → holder wants to release); slower drain.
- **REPAIR → support RADAR DISH:** RELEASE = auto-heal nearest hurt ally (right-stick/mouse redirect,
  heals minibots); HOLD = spin up → AoE **damage-buff** aura. Pure support (no enemy dmg). CPU heal/buff brain.
- **ARMOR:** heatshield = flameproof + general reduction; runflat = neutral + usable popped-tire crawl; hardplate buffed.
- **Game modes → TANK:** DOMINATION (3 points) + KOTH (moving + static) ported. Flame blow-up ring (visible).
- **UX:** armory **hover tooltips** (weapon/armor/perk descriptions); single-player top-left **⎋ ESC → splash**.
- **Sim tools:** `bbbalance.js` (1v1), `bbbalance3.js` (3v3 teams), `bbreport.js` (armor/perk), `bbrepair.js` (repair).

**Balance snapshot @ v5.1.198** — 1v1 (sim): wedge 62 · buzzsaw 61 · spinner 56 · drill 56 · flame 50 ·
flipper 50 · piston 49 · pincer 11 (counter-nerfed) · jet 44 · kamikaze 0. cannon ~60 (cheat). 3v3: wedge/jet
top, flipper/kamikaze collapse. (Binary matchups only resolve in ~11% steps — a strict order in 40–60 isn't possible.)

**OPEN / NEXT (pick up here):**
1. **Flame human/CPU separation is UNDONE** (unified burnBuild 0.54) — Sam is playtesting whether the human
   flame feels too slow. If yes, re-split (burnBuild human / burnBuildCpu) per v5.1.176.
2. **KAMIKAZE 0% in 3v3** — bug: the CPU doesn't detonate it well (it should excel in 3v3). Fix the CPU kamikaze brain.
3. **Tank game-modes parity:** VIP + SUMO still to port (Domination + KOTH×2 done). See `tf2ModeUpdate`/`TF_MODES`.
4. **Jet CPU dash-through** — the intended counter (dash/ram through the cone) the AI doesn't use; parked for Sam's read.
5. **Repair** is a support niche the KO-brawl sim undervalues (~18% in `bbrepair.js`); needs a human 3v3 playtest
   read on the new heal/buff dish (the buff aura isn't measured by the assessment).
6. Tournament v2 (T2 3v3 grid / T4 map-select / T1 typing) — later, nobody's used it yet.
7. Polish: full-screen map gallery · egg paint + achievements screen · drag-drop discoverability.

**Pending Sam feedback** on the v5.1.198 build: flame feel (unified), jet overheat warning, repair radar dish, pincer fight-back.

## Morning deliverable
A green, pushed `dev` with: a balanced weapon roster (incl. buzzsaw/flipper/pincer/kamikaze), the
perks slot, and as many of P4–P9 as time allowed; MIGRATION + PRD updated; a summary of what shipped
+ what was tabled (in this file's progress log + the final chat message).
