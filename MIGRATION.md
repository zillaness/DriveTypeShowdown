# MIGRATION / HANDOFF — FRC Drive Showdown

Self-contained context for continuing this project in a fresh thread.
**To resume: read this file, then the user will say "continue the queue."**

---

## 1. Project basics
- **Single-file HTML5 canvas game.** Everything lives in one `frc_drive_showdown_vX.Y.Z.html` (game code + inline `<script>` + changelog comment block near the end).
- **Current build:** `frc_drive_showdown_v5.1.35.html`
- **Branch:** `claude/eager-sagan-5wehy1` (develop + push here ONLY; never push elsewhere).
- **Repo scope:** `zillaness/driveshowdown`. Everything committed + pushed; battery ALL GREEN.
- Built for FRC Team 2204 Rambots. Modes: 2P H2H (NORMAL ball, SHOOTER, TANK FIGHT, OBSTACLE RACE) + single-player drive practice. Claimable CPU opponent with 4 skill tiers (ROOKIE/VETERAN/WINNER/CHAMPION).

## 2. Ship workflow (every version)
1. Edit the `.html`.
2. `./extract.sh` → writes `/tmp/g.js` (the inline script). `node -c /tmp/g.js` to syntax-check.
3. `./battery.sh` → runs all `harness/tests/smoke*.js` + a balance measure. **Must end `ALL GREEN`.**
4. Bump version: update the `file:`/`version:` header lines (~lines 3–4), add a changelog entry at the TOP of the changelog block (format: `  vX.Y.Z (2026-06-14): TITLE. ...details... Full battery green. Single file, no assets.`).
5. `git mv` the html to the new version name; `sed -i` update `extract.sh` to point at the new filename.
6. `./extract.sh && ./battery.sh` again (confirm green after rename).
7. Commit (author `Sam Cao <samuele.cao@gmail.com>`; message body ends with the `https://claude.ai/code/session_…` line) + `git push -u origin claude/eager-sagan-5wehy1` (retry w/ backoff on network errors).
8. Occasionally `SendUserFile` the build for playtesting (git is the real revision control).

## 3. Test harness
- `harness/tests/smoke*.js`: each reads `/tmp/g.js`, appends an IIFE of asserts, mocks canvas/window/localStorage/navigator, `eval`s. Prints `--- name: N pass, M fail ---`.
- Key suites: **smoke52** settings-rows/options, **smoke53** rubberband tiers, **smoke54** CHEATS + pause + mouse-aim + records-disable (biggest), **smoke55** tank pickups, smoke45 sticky-plow + shove, smoke38 2P integration (tank/race), smoke46 scoring/tiers.
- The harness canvas is a no-op Proxy, so **render bugs that throw in a real browser (e.g. `createRadialGradient` with NaN, `String.repeat(negative)`) are NOT caught** — be careful with draw code. (We added a `cheat menu fits` assert in smoke54 to guard menu overflow.)

## 4. Architecture quick-map (search by symbol; line numbers drift)
- **Cheats:** vars `let arcadeMode,bouncyMode,machineGun,ballMult,multiBall,stickyPlow,noClip,iceMode,driftMode,ballScale,robotScale,ballPups`; `CHEATS[]` array (name/desc/get/tog or slider); `drawKonami()` renders the 2-col menu; `cheatToggle/cheatMove/cheatAdjust`. **`anyCheat()`/`cheated()`** gate all records; `cheatedRun` latches during a run (set at gameplay ticks `playT+=dt`/`b2.t+=dt`/`tf2.t+=dt`/`r2.t+=dt`, reset in `retryRun/startDrive/startP2Ball/startP2Tank/startP2Race`).
- **Input:** `getInp(bind)` returns `{vx,vy,vr}` per drive; **mouse-aim** = `mouseAimVr(bind)` override at the two `return{vx…}` lines (toggle `mouseAim`, key K). `mouseX/mouseY` tracked in mousemove.
- **Pause:** `paused`, `canPause()`, `drawPause()`, `pauseClick()`, `pauseResumeRect/pauseQuitRect`; gated in `update(dt)` before the phase dispatch; Esc/Start enter, B/A or click exit.
- **2P ball:** `b2` (`b2.bots[0/1]`, `b2.cpus` alliance, `b2.score`, `b2.pups`); `updateP2Ball`, `cpuBallUpdate` (brain → `b2ScoreCycle`), `b2Sticky`/`b2StickyCarriers` (plow capture cone `reach=RR+BR+[…]`, `lat=RR+[…]`), `b2Credit`/`b2TryScore`, `B2_SHOVE` (main-bot shove mass vs alliance, shooter).
- **Tank:** `tf2` (`tf2.tanks[0/1]` — HARDCODED 1v1), `cpuTankUpdate`, `tf2Shoot`/`tf2Explode`/`tf2Damage`, `PUP_TYPES`/`tf2AllowedPups`/`tf2ApplyPup`/`tf2SpawnPup`, `tfBulletOOB`/`tfBulletHitObs`. Constants: `TF2_BLAST_R`, `MG_BURST_PER`.
- **Race:** `r2` (`r2.bots`), `updateP2Race` (compare-times finish + 2× DNF), `cpuRaceUpdate` (PISTON RUN lateral-dodge). Race CPU is still holonomic (drive-kinematics deferred).
- **Tiers:** `CPU_TIERS` (4: ROOKIE/VETERAN/WINNER/CHAMPION) + per-mode clones `CPU_TIERS_SHOOTER/TANK/RACE` via `modeTiers()`; `cpuTierParams`. Sizes: `let RR`, `let BR` (live; `RR0/BR0` bases; `setRobotScale` recomputes plow `SC_*`).
- **Settings UI:** `p2SettingsRows()` (per-mode rows: vals+show or slider), `p2SetRowRect`, `p2SetDropRects`, `p2CycleSet`, `p2SetSliderVal`; `M2_SET_DEFAULTS` (RESET button); `cpuSettings` screen with `cpuSettingsReturn`.
- **SP records:** `best{}`/`saveBest()` (`frc_showdown_v1`), `spGhostFinish`, achievements `achUnlock/achBeatTier/achH2HResult`, `h2hRecord` (`frcds_h2h_v1`).

## 5. QUEUE (do in order)
1. **Global ⚙ Settings menu** *(next, not started)* — new `phase='settings'`. Entry: a button on the main menu (`drawMenu`/its click handler) AND a SETTINGS option in the pause overlay (`drawPause`/`pauseClick`). Contents: **Sound** (toggle `sfxOn`/`sfxToggle`), **Mouse-aim** (toggle `mouseAim`/`toggleMouseAim`), **link to CPU AI settings** (set `cpuSettingsReturn='settings'`, `phase='cpuSettings'`), room for default sensitivity. Back returns to caller (menu or resume). Mouse + touch + gamepad nav. Reuse the row/rect pattern from `cpuSettings` or `p2settings`.
2. **Per-power-up selection sub-screen (tank)** — 7 pups now (hp/rapid/speed/shield/expl/pierce/aim); too many for inline rows. Make a sub-screen (button on the tank MATCH SETTINGS, like the ALLIANCE CPU AI button) with one ON/OFF per pup. Add keys to `M2_SET_DEFAULTS` (e.g. `puHp,puRapid,puSpeed,puShield,puExpl,puPierce,puAim` all true) and have `tf2AllowedPups()` filter by them (map PUP_TYPES id→key).
3. **"Shooting" cheat in classic (normal) ball** — user wants a shoot ability in normal ball mode (clarify exact behavior: launch a held/plowed ball? reuse shooter-style fire?). Likely a Konami cheat; ball-mode has no fire path in normal — would add one. **Ask the user to confirm the exact mechanic before building.**
4. **Multiple enemy tanks + tank TIMED mode** — TWO independent levers the user wants: (a) **ENEMY TANKS** count setting (1–4), separate from (b) tank **tier** (existing). Requires reworking `tf2.tanks` from hardcoded `[0,1]` to a variable roster (human(s) + N CPU tanks): spawn positions for N, `cpuTankUpdate` over all CPU tanks, bullet owner/collision over all, win = last side standing. PLUS a tank **format** lever: LIVES (current) vs **TIMED / most-kills** (count kills in a time limit, most wins) — mirrors the ball TIMED format. Big; spec carefully + heavy tests.

## 6. Tabled (need user green-light)
- **BattleBots mode** — large; a phased plan was discussed. Get explicit go-ahead.
- **3v3 human** — staged foundation exists (`b2Roster` fill-rule, alliance helpers `b2Mains/b2Foes`), full wiring deferred to v5.2. Do last.
- **Race CPU drive-kinematics** — low priority; steer drives may not clear the course (turn radius). Currently holonomic.
- **CHAMPION "one ball at a time" (normal)** — sticky-plow capture cone fills; widened "a bit" in v5.1.33. Revisit if still feels off.

## 7. Tuning levers (playtest-driven; all easy knobs)
`TF2_BLAST_R` (explosive radius) · `MG_BURST_PER` (MG barrage seconds/round) · `MOM.ice`/`MOM.drift` (friction/accel) · `BR0`/`RR0` scale clamps in the BALL/ROBOT SIZE cheat set() · capture cone `reach`/`lat` arrays in `b2Sticky` · `B2_SHOVE` (shooter shove mass) · `BOOST` (RAMMING dash) · `CPU_TIERS`/`CPU_TIERS_SHOOTER` params · ROOKIE `ease{at,floor}`.

## 8. House style
- Match surrounding code density; comments only for non-obvious constraints. Keep it one file, no assets. Changelog every version. Don't put the model id in any committed artifact.
