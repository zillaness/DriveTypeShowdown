# PRD — Queue Item 4: Multiple Enemy Tanks + Tank TIMED / Most-Kills Format

Spec for the biggest remaining QUEUE item (not a tabled mode). Engine context in
`MIGRATION.md`. Line refs are anchors against the current build's `/tmp/g.js`
(extract via `./extract.sh`) — search by symbol, numbers drift.

## 0. Two independent levers (TANK FIGHT only)
- **(a) ENEMY TANKS** — `m2.set.tcpus` = 1–4 CPU tanks, SEPARATE from CPU tier
  (tier is chosen per CPU at the claim screen). Today the roster is hardcoded to
  exactly two sides (`tf2.tanks[0]`/`[1]`).
- **(b) TANK FORMAT** — `m2.set.tformat` = `lives` (current) vs `timed`
  (count kills in a time limit; most kills wins), mirroring ball mode's TIMED path.
They compose: e.g. 1 human vs 3 CPU, TIMED 90s.

## 1. 1v1 hardcoding to remove (search these symbols)
`tf2SpawnPos(p)` (only p∈{0,1}); `cpuTankUpdate` (`for p<2`, `foe=tanks[1-p]`,
2-slot `cpuH2H`, `m2.drive[p]`); `startP2Tank` (`tanks:[0,1].map`);
`tf2Respawn(p)`; `tf2Shoot(p)` (AUTO-AIM `foe=tanks[1-p]`); `tf2Damage(tg,owner)`
(`tf2.result=owner` instant 1v1 win); `tf2Explode` (`for q<2`); `updateP2Tank`
(`for p<2`; `a=tanks[0],c=tanks[1]` separation; `arcadeTackle` foe `[tanks[1-p]]`;
bullet target `tg=1-b.owner`; pup pickup `for p<2`); `drawP2Tank` (`for p<2`,
result reads `tanks[w]`,`1-w`); `mgOn(p)` (reads `m2.claim[p]`); `momModeFor(bot,p)`;
fire/reload `p2FireHeld(p)`. `tfBulletOOB`/`tfBulletHitObs` are already generic.

## 2. New roster model
Each tank carries its own identity instead of relying on its array index:
```
tf2.tanks[i] = { side:0|1, ctl:{type:'human'|'cpu', bind:0|1|null, tier, brain, drive, sens, name},
                 col, hp, lives, kills:0, reload, inv, <pup fields>, _inp, dead:false }
```
- **Sides:** side 0 = the player(s), side 1 = CPU. 1 human → tank 0 side 0,
  tanks 1..N side 1. **2-human H2H:** legacy rivals when `tcpus===0`; when
  `tcpus>=1`, humans become TEAMMATES on side 0 vs CPU side 1. **[CONFIRM with Sam]**
- New helpers: `tankFoes(i)` (live opposite-side), `tankCtl(i)`, `tankFire(i)`,
  `tankMgOn(i)`, `withTank(i,fn)` (extend `withBot` to accept a ctx override so CPU
  tanks use their own drive/sens, not `m2.drive[p]`).
- **Colors:** `M2_COLS` has only 2 entries — add `TF2_TANK_COLS` (human =
  `M2_COLS[0]`; CPU = shades of blue). Draw uses each tank's `col`.

## 3. Bullet ownership & collision (N-general)
- `b.owner` = tank index `i`; also store `b.side`. No friendly fire: skip targets
  where `t.side===tf2.tanks[b.owner].side`. Loop all tanks, hit first within `RR+4`;
  pierce uses `b.hitSet` (already index-based → multi-target). `tf2Explode` damages
  all `t.side!==owner.side`. `cpuTankUpdate` dodge skips same-side bullets.
- Tank-vs-tank separation: replace the `a/c` pair with an O(N²) `i<j` loop (mirror
  `b2CpuUpdate`). N≤5 → trivial cost. `arcadeTackle` gets `tankFoes(i)`.

## 4. Spawn positions (tank2p arena 1200×640)
Human(s) on the LEFT (`x=70`); CPU on the RIGHT column (`x=FW-70`, `h:π`),
Y-spread symmetric about `FH/2`: N=1 `[mid]`, N=2 `[±120]`, N=3 `[±160,mid]`,
N=4 `[±180,±60]`, clamp Y∈`[RR+12, FH-RR-12]`. **Keep legacy 1v1 spawn
byte-identical** when human=1,tcpus=1 (keeps smoke38/55 green).

## 5. CPU brains for N tanks
New `cpuTankBrainsInit()` from `startP2Tank()`: one brain per CPU tank, store
`ctl.brain`. `cpuTankUpdate` iterates CPU tanks; each targets its NEAREST live
opposite-side tank (replaces `tanks[1-p]`). Give each CPU a default `ctl.drive`
(e.g. field-swerve) since `m2.drive` only holds 2. **[CONFIRM drive choice]**

## 6. TIMED / MOST-KILLS
- **Kill credit** in `tf2Damage` (single kill funnel): on death, `killer.kills++`.
- **Timer:** `tf2.t+=dt` already accumulates.
- New `tf2CheckResult()` (replaces inline `tf2.result=owner`):
  - **LIVES:** result when only one SIDE has live tanks (last side standing).
  - **TIMED:** ignore lives (always respawn = deathmatch); at `tf2.t>=tTimeSec`
    sum kills per side, most wins; tie → sudden-death (first kill wins, mirrors
    golden ball). **[CONFIRM tie-break]**. Set `lives=Infinity` in timed; guard HUD
    `♥`.repeat against Infinity.
- HUD: LIVES = per-tank HP/♥ cards (now >2 tanks → compact strip); TIMED =
  countdown + per-side KILLS scoreboard, cards show `KILLS n` not hearts.
- Result overlay generalized for both formats (`w=tf2.result` is a side index).

## 7. Settings UI
`M2_SET_DEFAULTS` += `tcpus:1, tformat:'lives', tTimeSec:90`. Make the tankfight
branch of `p2SettingsRows()` format-aware (same pattern as ball):
```
{k:'tcpus',  lab:'ENEMY TANKS',  vals:[1,2,3,4], show:v=>'×'+v},
{k:'tformat',lab:'FORMAT',       vals:['lives','timed'], show:v=>v==='timed'?'TIMED — most kills wins':'LIVES — last standing'},
S.tformat==='timed' ? {k:'tTimeSec',lab:'MATCH TIME',vals:[60,90,120,180],show:v=>v+'s'}
                    : {k:'lives',   lab:'LIVES PER TANK',vals:[1,3,5],show:v=>v},
{k:'bestOf',...},{k:'map',...},{k:'pow',...},{k:'hpk',...}   // (after the per-pup screen lands, pow/hpk → a button)
```
`p2CycleSet`/dropdown need no change (they read rows dynamically). Watch 8-row
y-spacing (`140+i*62`) vs START/RESET — add an overflow guard test.

## 8. Tests
Keep green (pin `tcpus=1,tformat='lives'`): smoke38 §F tank CPU, smoke55 pickups.
New **smoke56 — multi-tank + TIMED**: roster size & sides; spawn fairness (right
half, distinct Y, in-bounds, off-obstacle); no friendly fire; side-aware explosion;
LIVES last-side-standing; kill credit; TIMED expiry winner + sudden-death tie;
TIMED respawn-ignores-lives; settings rows present + format swap; settings overflow
guard. Harness canvas is a no-op Proxy → manually review HUD repeats
(`♥`.repeat(Infinity)) and `col` lookups for owner>1.

## 9. Phases (battery-green each)
1. **Roster plumbing, behavior-identical** (tcpus=1, lives) — introduce
   ctl/side/kills/dead + helpers, generalize all loops, legacy 1v1 byte-identical.
2. **N CPU tanks** — tcpus row, multi-spawn, per-CPU brains+drive, friendly-fire,
   colors, HUD cards, LIVES last-side-standing via `tf2CheckResult`. smoke56 1–6,10.
3. **TIMED / most-kills** — tformat/tTimeSec rows, kill counting, TIMED branch +
   sudden death, TIMED HUD, Infinity-lives deathmatch. smoke56 7–9.
4. **Ship** — version bump, changelog, rename, battery, commit.

## 10. Confirm with Sam before Phase 2
1. 2-human H2H when tcpus>=1: teammates vs CPU (assumed) or FFA?
2. Strictly two teams (human vs CPU) or full free-for-all among all tanks?
3. TIMED tie-break: sudden-death first-kill (recommended) vs RED default?
4. CPU tank drive type: all field-swerve (assumed) or inherit `m2.drive[1]`?
