# MODE TAXONOMY — ball-merge · Battle Ball · Kids mode (2026-06-25)

**SPEC ONLY — not built.** Sam's mode-restructuring brain-dump (2026-06-25),
captured with current-state facts + recommendations. These are **structural UX
changes** (splash, mode tiles, settings, tournament, career, tests all touch them)
— big surface; **best built WITH Sam in a live session, gated EXPERIMENTAL first.**

Code refs are against `drive_showdown_v6.0.0.html` (= v5.1.297 renumbered, identical code; extract with `./extract.sh`).

---

## Current state (the facts)
- **Main modes = MP tiles (`M2_MODES`, ~line 6330):** NORMAL (push ball) · SHOOTER
  (shoot ball) · TANK FIGHT · ROBORUMBLE · OBSTACLE RACE.
- **Single Player ALREADY treats shooter as a TOGGLE**, not a separate mode:
  `shooterMode` is an on/off flag on the SP menu (lines 1018/1032), alongside
  `tankFight` / `obstacleCourse` / `inverted`. So SP is toggle-based; **only MP
  splits the two ball games into two tiles** — the inconsistency Sam is flagging.
- **Ball flavors = exactly two:** push (`m2.mode==='normal'`) vs shoot
  (`m2.mode==='shooter'`). No "classic" variant (only the `rotRatio` "classic feel"
  turn ratio, unrelated). So a 2-value setting covers it.
- **Combat + ball ALREADY EXISTS** as the RoboRumble **PUSH-BALL** sub-mode
  (`bbmode='pushball'`): combat bots with the full weapon/armor/perk loadout shove a
  ball into goals, with flavored weapon interactions already shipped (kamikaze
  launches the ball, pincer carries it, FF blasts — see HANDOFF_2026-06-20 / the
  v5.1.222–227 changelog).
- **Splash front door:** CAREER · SINGLE PLAYER · MULTIPLAYER · SETTINGS
  (`splashGpIdx` 0–3).

---

## 1. Merge NORMAL + SHOOTER → one **BALL** mode; SHOOTER = a toggle
> **✅ BUILT (gated) — v6.3.0 (2026-07-03).** Shipped behind EXPERIMENTAL FEATURES as
> an **alias**: the merged **BALL** tile + a **BALL TYPE** FORMAT row (`m2.set.ballFmt`)
> are presentational; `m2.mode` keeps the canonical `'normal'`/`'shooter'` strings, so
> tournament / career / records / all 12 smoke suites are untouched. Funnel =
> `b2Shooter()` / `p2BallMode()` (replaced ~24 scattered checks, byte-identical);
> tile list = `m2Modes()`. **Migration finding: NONE needed** — `tour` is never
> persisted, career saves stage IDs (not modes), the h2h record keeps its legacy
> display tag, and SP records already key shooter separately (`_sht`). Tests: new
> `smoke61.js` (23 asserts). **PROMOTE step (pending Sam):** flip the merge
> unconditional, migrate `m2.mode` to `'ball'` behind the funnel, merge the
> tournament/career cyclers, then guard the 3 `M2_MODES.find` label sites.

**Sam:** "shooter and non-shooter ball modes should be combined, and shooter is
just a toggle within that mode."

- **Rationale:** they're the same sport (balls through the gap) — push vs shoot is a
  *variant*, not a different game. SP already models it as a toggle; MP should match
  → one tile instead of two, less clutter, clearer.
- **Build:**
  - `M2_MODES`: drop the `shooter` tile; keep one **BALL** tile (rename `normal`
    → `ball`, label "BALL").
  - Add a **SHOOTER on/off** row to the ball settings (`p2SettingsRows`) — or, for
    headroom, a **FORMAT: PUSH / SHOOTER** cycler (extensible to more ball variants
    later). Store as `m2.set.ballFmt` (or reuse a bool `m2.set.shooter`).
  - Replace the scattered `m2.mode==='shooter'` checks (CPU brain ~2326/2485/2613/
    2619/2906, scoring 3175, fire button 426, `modeKey` 859, …) with a single helper
    `b2Shooter()` → reads the setting. One funnel = low-risk refactor.
  - Update the result/series labels, tournament MODE cycler, career mode refs, and
    tests (smoke58 ball, smoke52 settings, smoke59 grid).
- **Decision:** bool toggle vs a FORMAT cycler — **recommend FORMAT** (future-proof;
  costs nothing now).
- **Migration note:** any saved tournament/career configs storing
  `mode:'shooter'` need a one-time remap to `mode:'ball', shooter:true`.

## 2. **BATTLE BALL** — RoboRumble × Ball, the ESCORT / "protect your pusher" format
**Sam:** "maybe battle ball is the mode that combines RoboRumble with ball modes."
**Refined (2026-06-25):** "a regular ball mode 3v3, but 2 of the 3 were RoboRumble
bots… and it was like VIP — protect your pusher bot."

This is the long-running **hybrid combat+ball / "shooting in ball mode"** idea (the
one earlier mis-transcribed as balloon battle), now with a concrete, compelling
shape: **role-differentiated 3v3 escort.**

- **The format (the headline):** each alliance fields **1 PUSHER + 2 COMBAT bots.**
  - **PUSHER** = the ball-scorer (drive + plow / push; little or no weapon). It's
    your **VIP** — the bot you protect.
  - **2 COMBAT bots** = full RoboRumble loadout (weapon/armor/perk) — escorts/
    attackers who clear a lane for *your* pusher and hunt the *enemy* pusher.
  - So it's not "everyone shoves the ball" (that's plain pushball) — it's a **carry +
    escorts** structure: a payload/objective bot guarded by fighters. Reads like
    escort-the-payload / a MOBA carry+supports, which is richer and more strategic.
- **Win condition — VIP layered on the ball objective.** Combine the two existing
  mechanics:
  - **Score** the ball into the enemy goal to win (or first-to-N), **AND**
  - **protect your pusher (VIP):** if your pusher is destroyed/disabled, you can't
    score until it respawns — and a pure-VIP variant could make **killing the enemy
    pusher** an outright win. Tunable: (a) VIP-elimination win, (b) score-to-win
    where a dead pusher just halts your offense, or (c) both (kill OR outscore).
  - Recommend **(b/c):** the ball is the goal, the pusher is the linchpin → killing
    it is a huge tempo swing without being an instant-win cheese. "Protect your
    pusher" emerges naturally.
- **It's very buildable on what exists.** RoboRumble already ships BOTH halves as
  sub-modes: **PUSH-BALL** (combat bots + a ball + goals, with weapon-on-ball
  interactions) and **VIP** (`bbmode='vip'`: a designated bot whose death loses the
  match). Battle Ball = **pushball + VIP-on-the-pusher + role-assigned loadouts**
  (seat 0 = pusher, seats 1–2 = combat). The new parts are the role split + the
  combined win check; the engine, ball, goals, VIP crown, and 6-seat grid all exist.
- **Ship it as a CHEAT MODE first (Sam, 2026-06-25: "it would be like a cheat
  mode").** Not a mainline tile to start — a **gated toggle** (cheats menu /
  EXPERIMENTAL FEATURES) that turns a RoboRumble ball match into the escort/VIP
  format: seat 0 → PUSHER (VIP), seats 1–2 → COMBAT, win = score + protect-the-VIP.
  This is the lowest-risk path (a toggle layered on the existing pushball + VIP +
  6-seat-grid engine, no new setup screens / tournament-career routing) and matches
  the standing "when in doubt, gate" rule. **Promote to its own mode TILE later** if
  it plays well (same logic as balloon battle — distinct setup since you assign roles,
  not one shared loadout). Keep the bb PUSH-BALL/VIP sub-modes wired meanwhile.
- **Setup screen:** reuse the 6-seat grid; per alliance, **seat 0 = PUSHER** (a
  pared-down loadout: drive + plow, maybe a defensive perk) and **seats 1–2 = COMBAT**
  (full armory). Could let players pick who pushes.
- **"Shoot the ball" hook:** since 2/3 carry weapons, fold in the shooting-in-ball
  idea — fire to knock the ball toward goal or to defend it, so weapons matter for
  *both* fighting and scoring.
- **Open decisions:** win rule (a/b/c above — recommend b/c); is the pusher weaponless
  or lightly armed; 3v3 only or also 2v2/1+1; who picks the pusher role.

## 3. **KIDS MODE** — a severely cut-down mode for children
> **✅ BUILT (gated) — v6.4.0 (2026-07-03).** Shipped option **(a) simplified BALL** as
> its own self-contained `kids` phase (drive a big smiley bot, push one big ball into one
> big goal, confetti + a star counter, endless, no-fail, no records/timer). Reached from a
> **splash KIDS entry** — the bottom row goes 3-up (KIDS·SETTINGS·CREDITS) when EXPERIMENTAL
> FEATURES is on, byte-identical 2-up when off. Controls = universal input (keys / stick /
> touch-drag). Tests: new `smoke62.js` (13 asserts). **PROMOTE step (pending Sam):** flip
> the KIDS entry to always-visible + a prominent big card (a parent handing over the phone
> shouldn't need the Konami gate).

**Sam:** "considering a severely cut-down mode for children."

- **Goal:** a dead-simple, **no-fail, colorful** mode a young kid can just *drive*
  and have fun — no menus to get lost in, no losing.
- **What's CUT:** no weapons, no lives/score pressure, no timer, no fail state,
  minimal/zero text (icons only), gentle or no opponents, a tiny settings surface.
- **What's SIMPLIFIED:** controls (one-stick drive / big on-screen buttons; optional
  steering assist), slower speed, **big bright targets**, lots of positive feedback
  (confetti, cheers, sounds), a fun robot/color picker.
- **Base options:**
  - **(a, recommend) Simplified BALL** — drive + push ONE big ball into ONE big
    goal; confetti on every goal; a friendly (or no) opponent; endless. Reuses the
    ball engine; the closest thing to "score!" joy with zero rules.
  - **(b) Free-drive sandbox** — just drive around, honk, bump big soft cones/props;
    no objective at all. Maximally safe; least "game."
  - **(c) Star-collect drive** — drive over big glowing stars on an open field;
    counts up forever. Simple goal, no fail.
- **Placement:**
  - **(recommend) a 4th SPLASH tile "KIDS"** (parallel to CAREER / SINGLE / MULTI) —
    discoverable when a parent hands over the phone; one tap into the cut-down mode.
  - or a "KIDS" preset inside Single Player (less discoverable).
- **Tie-in:** echoes CAREER's "middle-school = learning to drive" beat, but stripped
  to the bone (no story, no quiz, no difficulty).
- **Decision for Sam:** which base (a/b/c — recommend a), and splash tile vs SP
  preset (recommend tile).

---

## Proposed consolidated taxonomy (recommendation)
- **Splash front door:** KIDS · CAREER · SINGLE PLAYER · MULTIPLAYER  *(+ SETTINGS)*
- **Main mode tiles (MP):** BALL *(push/shooter toggle)* · BATTLE BALL · ROBORUMBLE
  · BALLOON BATTLE · TANK FIGHT · OBSTACLE RACE

That's **6 main tiles** (today's 5 − 1 from merging the two ball tiles + Battle Ball
+ Balloon Battle). The tile row is getting full — consider **grouping** (e.g. a
"BALL SPORTS" group → BALL / BATTLE BALL / BALLOON BATTLE; a "COMBAT" group →
ROBORUMBLE / TANK FIGHT) or a scrollable tile rail if it grows further. Flag for the
build.

Symmetry that falls out (a nice mental model):
| | no combat | + combat |
|---|---|---|
| **ball** | BALL | BATTLE BALL |
| **no ball** | (drive: RACE) | ROBORUMBLE |
| **balloons** | — | BALLOON BATTLE |

## Build / rollout (all three)
- **Gate behind EXPERIMENTAL FEATURES first** per the standing rule, then promote.
- **Order of least → most risk:** (1) ball-merge refactor (mechanical, well-bounded
  — one `b2Shooter()` funnel + a settings row + the tile drop), (2) Battle Ball
  (mostly promoting pushball + the shoot-the-ball hook), (3) Kids mode (new but
  small/self-contained), then taxonomy/splash polish.
- **These reshape core UX + touch tournament/career/tests → do WITH Sam, live**, not
  blind overnight. Recommend a playtest session per step.

## Open decisions for Sam
1. Ball merge: bool SHOOTER toggle vs a FORMAT cycler (recommend FORMAT).
2. Battle Ball: promote pushball to a tile but KEEP the bb sub-mode (A), or fully
   migrate it (B)? (Recommend A.) And how much "shoot the ball" to add.
3. Kids mode: base a/b/c (recommend a, simplified ball) + splash tile vs SP preset
   (recommend tile).
4. Tile crowding: flat 6 tiles vs grouping/rail once Battle Ball + Balloon Battle
   land.
5. Build now, or keep speccing? (These are big UX refactors — recommend a live
   session, not an unattended build.)
