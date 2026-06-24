# SMOKE SCREEN — spec (2026-06-24)

**SPEC ONLY — not built.** Sam's idea: a **smoke screen** for RoboRumble. The open
question he posed: **perk or bot (weapon)?** This captures both, with a
recommendation, the mechanics in *this* engine, tuning, tests, and gating.

Code refs are against `drive_showdown_v5.1.297.html` (extract with `./extract.sh`).

---

## What a smoke screen *does* in a top-down arena (the design problem)
Everything on the field is visible at all times, so "smoke" has to attach to a
real mechanic, not just be art. Three things it can disrupt:

1. **CPU target lock (the big one).** The CPU brain picks the **nearest enemy**
   (`bbCpuUpdate`, ~line 4533) and drives to its rear / faces it. A bot hidden in
   smoke should be **un-acquirable** — enemy CPUs lose the lock / skip it as a
   target while it's concealed, so you can disengage or reposition. Since most
   matches involve CPUs, this is where smoke earns its keep.
2. **Ranged aim.** A CANNON / AUTO-AIM shot at a target inside smoke can't lock
   (turret won't acquire). Optional second-order effect.
3. **Human read.** For human-vs-human, draw the cloud over the bots inside it so
   the opponent can't easily *see/track* you (a real concealment, pure visual).

Smoke does **NOT** block movement or damage — you can drive and shoot through it.
It's a **vision / targeting** tool only. That keeps it a clean *disengage /
reposition* gadget, not a wall.

---

## Option A — SMOKE SCREEN **PERK**  ✅ *recommended*
A 3rd-slot perk (`ld.perk`), alongside PARTING GIFT / FLAMEPROOF / PIT STOP / …
(`BB_PERKS`, ~line 4299). **Keeps your real weapon** — smoke is utility, it
shouldn't cost your spinner/flame.

- **Trigger (no new input needed):** auto-pops a smoke cloud at your position on a
  **panic condition** + a long cooldown:
  - when you drop below `smokeHpTrip` (e.g. 30% HP), **or**
  - the moment your mobility hits 0 (you're disabled) — the classic "cover my
    escape / break their lock so they stop farming me" beat.
  - Cooldown `smokeCd` (~12s) so it's a once-a-fight bailout, not a constant fog.
- **Effect:** the cloud breaks **enemy** lock (effects below) and conceals you for
  `smokeDur`, giving you a window to limp away / reset. Pairs with PAINKILLER /
  SPARE TIRE / RUNFLAT (stay mobile *and* unseen).
- **Why a perk fits:** there's currently **no "disengage/escape" perk** — perks
  are damage (ADRENALINE), heal (VAMPIRE/PIT STOP), or death-themed (PARTING
  GIFT/LAST STAND). Smoke fills that gap, and auto-trigger sidesteps the input
  problem (RT = weapon, LT = dash; perks have no free active button except the
  give-up dash-hold).
- **Trade-off:** automatic = less timing agency than an on-demand deploy.

## Option B — SMOKE **BOT** (weapon)
A pickable weapon in the MINELAYER/JET/TASER **control family**
(`BB_WEAPONS` + `BB_ARMORY_W` + `bbExpWeapon`).

- **Trigger:** **RT deploys** a smoke cloud behind/around you on a cooldown
  (`smokeCd`), capped to N live clouds (mirror `mineMax`). Clean input fit (every
  weapon fires on RT).
- **Effect:** same cloud + lock-break, but **on demand** — deploy right as a
  cannon lines up, or to cover a teammate's push (great in 3v3).
- **Trade-off:** it **costs your offensive weapon slot** — like REPAIR, it's a
  pure-utility pick (no damage). Strong in **3v3** as a dedicated disruptor; a big
  sacrifice in **1v1**.

## Recommendation
**Ship the PERK first** (Option A): higher value per slot (keep your weapon),
fills the missing escape niche, no input conflict, and it's the natural "I'm
getting farmed while disabled — let me vanish and reset" tool that pairs with the
GIVE-UP / respawn-delay work. **Offer the weapon (Option B) as a follow-up** for
players who want active, on-demand smoke as a 3v3 support pick. The cloud
engine below is **shared** — build it once, wire it to whichever trigger.

> Possible combo later: a perk that **auto**-pops on panic *and* the weapon that
> deploys **on demand** can both exist (different slots, same cloud code).

---

## The cloud engine (shared by both options)
Mirror the mine lifecycle (`bb2.mines` → a new `bb2.smokes[]`):

- **Data:** `{x, y, r:0, maxR, t:smokeDur, maxT:smokeDur, side, owner}` pushed on
  deploy/trigger.
- **Update** (`bbSmokeUpdate(dt)` called in `updateBB`, next to `bbMinesUpdate`
  ~line 5568): `t -= dt`; radius **grows in** over the first ~0.4s then **fades
  out** over the last ~0.6s (`r = maxR * easeIn/out`); cull at `t<=0`.
- **Draw** (`bbDrawSmoke()` in `drawBB`, UNDER the bots like `bbDrawMines`, plus a
  light over-pass to fade concealed bots): several translucent gray radial puffs
  (`globalAlpha` from `t`), a couple of slowly-drifting offset circles for a
  rolling-cloud feel. Reuse the `bb2.t` clock for the drift (no `Math.random` in
  the sim path — vary by index).
- **Concealment helper** `bbInEnemySmoke(b)`: true if `b` is within any smoke
  cloud whose `side !== b.side` (i.e., an enemy's smoke hides `b` from that enemy).
  Decision: **your own smoke does NOT blind your own targeting** (clean
  offensive/defensive tool); smoke only degrades the *enemy's* read of whoever is
  inside it. (Alt: symmetric fog — simpler but blinds you too; the deployer still
  benefits because they know where they're going. Tunable.)
- **CPU lock hook** (`bbCpuUpdate` foe pick, ~line 4533): when scanning for the
  nearest foe, **skip** any candidate where `bbInEnemySmoke(candidate)` is true
  (from this CPU's side) — so a concealed bot drops off the CPU's radar; it
  re-acquires when the foe leaves the cloud or it dissipates. (Keep a fallback: if
  *every* foe is smoked, target the last-known/nearest anyway so the CPU doesn't
  freeze.)
- **Human view** (bot draw): if `bbInEnemySmoke(b)` from the *viewing* human's
  enemy side, draw `b` at reduced alpha (mostly hidden under the cloud).
- **Ranged (optional):** in the CANNON/auto-aim acquire, treat a smoked target as
  un-lockable (no auto-aim snap; manual fire still possible but blind).

---

## Tuning (new `BB_W` consts)
`smokeDur:4.0` (cloud lifetime s) · `smokeMaxR:RR*3.2` (cloud radius) ·
`smokeCd:12.0` (perk panic cooldown / weapon redeploy) · `smokeHpTrip:0.30`
(perk: HP fraction that auto-pops) · `smokeGrow:0.4` / `smokeFade:0.6` (grow-in /
fade-out seconds) · (weapon) `smokeMax:2` (live clouds per owner).

## Gating
**EXPERIMENTAL FEATURES** (`expFeatures` via `bbExpWeapon` for the weapon; a
gated branch for the perk) until it plays well — per the standing "when in doubt,
gate" rule. Off by default ⟹ mainline + the balance sim are untouched.

## Tests (smoke57)
- Deploy/trigger pushes a cloud; `bbSmokeUpdate` grows then **dissipates** it
  (culled after `smokeDur`).
- `bbInEnemySmoke`: a bot inside an enemy cloud reads concealed; the **owner/ally**
  inside the **same** cloud does **not** (one-sided), and a bot outside reads clear.
- **CPU lock-break:** a CPU's nearest-foe pick **skips** a foe standing in the
  CPU's-enemy smoke, and **re-acquires** once the foe steps out / the cloud clears.
- **Owner unaffected:** the deployer can still target through its own smoke.
- (Perk) auto-triggers at `smokeHpTrip` / on immobilize, respects `smokeCd`
  (no re-pop during cooldown). (Weapon) RT deploys on `smokeCd`, capped `smokeMax`.
- **Render:** `bbDrawSmoke()` (+ a concealed-bot draw) runs without throwing — call
  the draw fn (the mock canvas only catches draw-logic errors if a draw actually
  runs; see the v5.1.270 FFA-render-crash gotcha).

## Open decisions for Sam
1. **Perk or weapon first?** (Recommend: perk.)
2. **Perk trigger:** auto-on-panic (HP/immobilize) vs a manual pop — manual needs
   an input (the give-up dash-hold is the only free one, and it's contextual).
3. **One-sided** (enemy-only blind, recommended) vs **symmetric** fog.
4. Should smoke also kill **CANNON/auto-aim** lock, or only the close-combat CPU
   brain? (Recommend: both, it's cheap.)
5. Mainline eventually, or stay an EXPERIMENTAL gadget?
