---
file: CAREER_PLAN.md
version: 1.0
author: Sam Cao (vision) — drafted by Claude thread `inspiring-turing`
created: 2026-06-19
build_grounded_against: drive_showdown_v5.1.249.html (9452 lines, single self-contained <script>)
status: PLAN ONLY — no game code changed. Buildable spec for CAREER / STORY MODE.
---

# DriveShowdown — CAREER / STORY MODE plan

## ⭐ START HERE (for whoever builds this)

**The vision (Sam):** a narrative campaign that threads the EXISTING game modes into a "growing up"
progression. You play one mode per life-stage, advancing as you win:

| Chapter | Life stage | Maps to MODE | `m2.mode` id |
|---|---|---|---|
| 1 | **Middle school** — learning to drive | **OBSTACLE RACE** | `race` |
| 2 | **High school, season 1** — rookie team | **BALL · PUSHER** (push-ball) | `normal` |
| 3 | **High school, season 2** — veteran team | **BALL · SHOOTER** | `shooter` |
| 4 | **College** — "the video game you play in your dorm" | **TANK FIGHT** | `tankfight` |
| 5 | **Graduate** — pro circuit | **ROBORUMBLE** | `battlebots` |

**It is a NEW META-SHELL over the modes** — exactly like the existing **tournament** system, which is
the closest precedent (persistent state, between-match screens, a result-router that advances a bracket).
**Build the career shell by cloning the `tour*` pattern**, not by inventing new infrastructure.

**The single most important architectural fact:** every mode already EXITS to a "continue" screen
(`drawP2Nav` → `p2NavClick`) and the tournament already proves you can intercept that exit and route the
result back into a meta-shell (`tourMatchEnd`). Career mode is the **same hook with a different shell.**

**Recommended build order (each step = a green `./battery.sh`):**
1. **Career state + localStorage + a HUB/MAP screen** (phase `p2career`) — no matches yet, just the shell.
2. **Chapter 1 end-to-end** (obstacle race): launch a career match, intercept its result, show win/loss.
3. **Wire match-end → advance the career** (the `careerMatchEnd` router, mirrors `tourMatchEnd`).
4. **Remaining chapters 2–5** (just data-table rows + the mode each launches).
5. **Unlocks** (drives + RoboRumble loadout pieces earned per chapter).
6. **Story beats + polish** (intro/outro screens from a data table; difficulty ramp; achievement).

Ritual per increment is the project standard: edit → `git mv` vN→vN+1 → `sed` filename into
`extract.sh`+`MIGRATION.md` → `./extract.sh && ./battery.sh` ALL GREEN → commit → push `dev`.
**This document does NOT bump the version or touch the HTML** — it is the spec only.

---

## 1. Overview & player fantasy

DriveShowdown today is a **free-play** menu: pick a mode, pick a drive, configure settings, play. The
modes are great but unconnected. **Career mode gives them a spine** — a single-player story where the
player "grows up through robotics," and each life stage is taught by the mode that best fits it:

- **Middle school = you can barely drive.** The OBSTACLE RACE teaches control: thread the gaps, don't
  crash, beat the clock. (Maps cleanly to the *existing* single-player obstacle-course skill + the 2P
  race mode.)
- **High school = you join a team.** Two seasons of the BALL game — first the gentle **PUSHER**
  (push-ball, body-shoving — "rookie season"), then **SHOOTER** the next year (you've earned a launcher
  — "you're a veteran now").
- **College = the dorm video game.** TANK FIGHT, explicitly framed in-fiction as the arcade game you and
  your hallmates play between classes. Lighter, gun-duel energy.
- **Graduate = you've gone pro.** ROBORUMBLE — the deep combat sandbox with weapons/armor/perks. The
  campaign's loadout unlocks all funnel here, so reaching graduate-school feels like arriving at the
  "real" game with a kit you earned.

The fantasy: **start clumsy, end a champion**, and along the way unlock drives and combat gear so the
free-play modes get richer too. The campaign is **single-player vs CPU**, reusing the H2H CPU brains and
the 5-tier difficulty system that already exist.

**Coexistence with free-play:** career is a NEW front-door tile, not a replacement. The existing
SINGLE PLAYER / MULTIPLAYER / SETTINGS splash stays. Career is its own button → its own hub. Unlocks it
grants are additive (they widen what free-play offers); free-play remains fully playable standalone.

---

## 2. Progression structure

### 2.1 The chapter table (a DATA-DRIVEN spine)

Define a const array `CAREER_CHAPTERS` near the other mode tables (model on `M2_MODES`, line ~5953).
Each row is one stage. **Keep it a table so adding/reordering stages is a data edit, not a code edit.**

```js
// proposed shape — drop near M2_MODES (~line 5953)
const CAREER_CHAPTERS = [
  { id:'middle',  stage:'MIDDLE SCHOOL',     title:'Learning to Drive',
    mode:'race',       tier:0/*ROOKIE*/,   matches:3, winCond:'race',   icon:'🏫', col:'#40c4ff',
    unlock:{drive:'arcade'} },
  { id:'hs1',     stage:'HIGH SCHOOL · YR 1', title:'Rookie Season',
    mode:'normal',     tier:0,             matches:3, winCond:'best2of3',icon:'⚙',  col:'#44ffaa',
    unlock:{drive:'botSwerve'} },
  { id:'hs2',     stage:'HIGH SCHOOL · YR 2', title:'Veteran Season',
    mode:'shooter',    tier:1/*VETERAN*/,  matches:3, winCond:'best2of3',icon:'🎯', col:'#ff8844',
    unlock:{drive:'mecanum'} },
  { id:'college', stage:'COLLEGE',           title:'The Dorm Champion',
    mode:'tankfight',  tier:2/*WINNER*/,   matches:3, winCond:'best2of3',icon:'🎮', col:'#ffcc00',
    unlock:{bbWeapon:'wedge'} },
  { id:'grad',    stage:'GRADUATE',          title:'Turning Pro',
    mode:'battlebots', tier:3/*CHAMPION*/, matches:5, winCond:'best3of5',icon:'🏆', col:'#ff6b6b',
    unlock:{bbWeapon:'piston', bbPerk:'partinggift'} },
];
```

Field meaning:
- `mode` — the exact `m2.mode` id the chapter launches (`race|normal|shooter|tankfight|battlebots`). These
  are the SAME ids `M2_MODES` uses (line 5953), so the existing start functions just work.
- `tier` — the CPU difficulty tier index into `CPU_TIERS` (line 2232): 0 ROOKIE → 3 CHAMPION. **This is
  how difficulty ramps** — see §2.3.
- `matches` — how many matches in the chapter (a short bracket-of-CPUs OR a best-of series; see §2.2).
- `winCond` — how the chapter is cleared.
- `unlock` — what reaching the END of this chapter grants (see §4).
- `icon`/`col`/`stage`/`title` — hub-screen presentation.

### 2.2 Win conditions to advance

Two simple shapes (both already exist in the engine — reuse, don't reinvent):

- **`race`** (chapter 1): beat the CPU racer (the result is `r2.result === 0` = player wins). A chapter
  can require winning N races (e.g. 3 "events") to advance — track wins in `career.matchWins`.
- **`best2of3` / `best3of5`** (chapters 2–5): play a short series. The engine ALREADY has `p2Series`
  (best-of series with `w[]`, `need`, `round`, `done`; see `drawP2Nav` line ~3976 and `p2SeriesStart`).
  Career can reuse `p2Series` for the per-chapter series, OR — cleaner and more career-flavored — model
  each chapter as a tiny **gauntlet of opponents** the way a tournament does (beat 3 CPUs in a row,
  increasing tier). **Recommendation: a gauntlet**, because it (a) reuses the tournament "beat the next
  opponent" loop, (b) gives natural difficulty steps inside a chapter, and (c) gives the story more
  named rivals. Each chapter = `matches` opponents; lose and you re-try the current opponent (or the
  chapter — a design decision for Sam, §8).

**Advance rule:** clear all `matches` of a chapter → mark `career.chapter` complete, grant `unlock`,
play the OUTRO beat, then the INTRO beat of the next chapter, then return to the hub with the next
chapter highlighted/unlocked.

### 2.3 Difficulty ramp (ties to existing CPU tiers)

Difficulty is **entirely expressible through the existing tier system** — no new AI work:

- The base tier per chapter is `chapter.tier` (0 ROOKIE → 3 CHAMPION), set on the CPU claim object
  exactly like the claim screen does today: `m2.claim[1] = {type:'cpu', tier: chapter.tier}` (the same
  shape produced at line 2557 and selected by the gamepad cycler at line 1496).
- `modeTiers()` (line 2253) already routes to the right per-mode tier table
  (`CPU_TIERS_SHOOTER/TANK/RACE/BB`), so a career match in any mode gets that mode's tuned difficulty for
  free.
- **Within a chapter**, ramp by bumping the tier per opponent in the gauntlet (e.g. chapter 4 college:
  opponent 1 = WINNER, opponent 2 = WINNER, boss = CHAMPION). Store as a small `opps` sub-array on the
  chapter, or compute `tier = clamp(base + matchIdx>=last ? 1 : 0, 0, 3)`.
- **RoboRumble bonus:** `BB_TIER_DMG` (line 2249) already scales CPU→human damage by tier (ROOKIE 0.90×
  … CHAMPION 1.10×), so the graduate chapter automatically hits harder. No extra code.

The ramp across the whole campaign is therefore: ROOKIE → ROOKIE → VETERAN → WINNER → CHAMPION, which is
a clean "you get better, so do they" curve and exercises every tier (also satisfies the existing
**Tier Climber** achievement `alltiers`, line 308 — nice synergy).

---

## 3. Data model

### 3.1 The `career` state object

Mirror the `tour` global (declared `let tour=null;` at line 5978). Add alongside it:

```js
let career=null;   // null when not in a campaign; an object while playing one
```

Shape (created by `careerNew()` or loaded from storage):

```js
career = {
  chapter:   0,          // index into CAREER_CHAPTERS — the current/active chapter
  matchIdx:  0,          // which opponent within the chapter (0..chapter.matches-1)
  matchWins: 0,          // wins banked in the current chapter (for race/gauntlet)
  done:      [],         // array<bool> length = CAREER_CHAPTERS.length — chapter cleared?
  unlocks: {             // everything the campaign has granted so far
    drives:    [],       // drive ids unlocked (e.g. ['arcade','botSwerve'])
    bbWeapons: [],       // RoboRumble weapon ids unlocked (e.g. ['wedge','piston'])
    bbArmor:   [],       // armor ids
    bbPerks:   [],       // perk ids
    paints:    [],       // paint-job indices / cosmetic ids
  },
  flags: {},             // story flags: {beatRivalX:true, sawIntroHs1:true, ...} — drives beats
  drive:  null,          // the drive the player has chosen to use this campaign (career-locked, optional)
  ver: 1,                // schema version for safe migration
};
```

Notes:
- `chapter` + `done[]` together are the source of truth for "where am I." `done[]` lets the hub render
  past chapters as completed even if the player jumps around (if revisiting is allowed — §8).
- `unlocks` is **the persistent reward ledger**. Free-play menus consult it (see §4) so career rewards
  bleed into the rest of the game.
- `flags` is an open bag for story beats (§6) so beats can be conditional without schema churn.

### 3.2 localStorage persistence (follow the `frcds_*` + JSON pattern)

The codebase has a consistent pattern: a key `frcds_<thing>_v<N>`, JSON-encoded, loaded once at startup
with a try/catch fallback, saved through a tiny `saveX()` helper. Examples to copy literally:
- achievements: `frcds_ach_v1` (line 284), `frcds_achp_v1` (line 286), saver `achSave()` (line 296)
- custom maps: `frcds_maps_v1` (line 4845), saver `saveCustomMaps()` (line 4846)
- RoboRumble loadout: `frcds_bbload_v1` (line 6695/6696)

**Career key:** `frcds_career_v1`.

```js
// load once at startup (place near line ~284 with the other loads)
let careerSave = (()=>{ try{ const c=JSON.parse(localStorage.getItem('frcds_career_v1')||'null');
  return (c && typeof c==='object') ? c : null; }catch(e){ return null; } })();
function careerStore(){ try{ localStorage.setItem('frcds_career_v1', JSON.stringify(career)); }catch(e){} }
```

`careerSave` is the *persisted* campaign (or null = no save yet). `career` is the *active* in-memory
object. On entering the career hub: if `careerSave` exists, offer CONTINUE (load it into `career`);
else NEW CAREER (`careerNew()` then `careerStore()`). **Call `careerStore()` after every meaningful
state change** (match win, chapter clear, unlock grant) so progress survives a refresh — same discipline
as `achSave()`/`saveBBLoadout()`.

**Save-slot decision** is open for Sam (§8): the simplest is ONE save (single `frcds_career_v1`). Multiple
slots would be `frcds_career_v1` holding an array — trivial to extend later because the per-campaign
shape is self-contained.

---

## 4. Unlocks

Career rewards are **additive widenings of systems that already exist**, gated by reading
`career.unlocks` (or the persisted `careerSave.unlocks`). Nothing about free-play breaks if career is
never played — the unlock arrays just start empty and the gates fall through to "everything available."
(Recommendation: in free-play, gate ONLY in career-flavored places; keep the sandbox fully open so we
don't punish free-play users. Sam to confirm — §8.)

What each chapter grants (see the `unlock` field in §2.1) and where it plugs in:

| Reward type | Existing system it feeds | Where it's defined / consumed |
|---|---|---|
| **Drive types** | `DRIVES` (line 87), `HOLO_DRIVES` (98), `STEER_DRIVES` (113) | The drive picker (`p2drive` phase). Career grants the family progressively: arcade → swerve → mecanum/holonomic → … so the player "earns" fancier drivetrains, matching the FRC fiction (a rookie team runs tank/arcade; a top team runs swerve). |
| **RoboRumble weapons** | `BB_WEAPONS` (line 4039), armory chips `BB_ARMORY_W` (4118) | The graduate chapter + late rewards. Unlocked weapons appear in the armory rail; locked ones could be hidden/greyed in a career-aware armory. The CANNON precedent (cheat-gated, hidden until unlocked) is the exact mechanism to copy. |
| **RoboRumble armor** | `BB_ARMOR` (line 4054) | Same — armor chips `BB_ARMORY_A`. |
| **RoboRumble perks** | `BB_PERKS` (line 4150), pick list `BB_PERKS_PICK` | Same — perk chips. |
| **Paint / cosmetics** | `PAINT_JOBS` (line 4459), `ACCENT_COLS` (4470) | Cosmetic-only rewards (livery for clearing a chapter). The 🎨 paint picker (v5.1.232) already cycles `ld.paint`; career can grant additional palette entries / a "campaign livery." |

**Loadout tie-in:** the player's RoboRumble loadout already persists in `frcds_bbload_v1`
(`saveBBLoadout`/`loadBBLoadout`, line 6695). Career unlocks should expand the POOL the armory offers;
the player still equips via the existing armory UI. For the graduate chapter, seed `m2.bbLoadout` from
the campaign's earned weapons so the final stage feels like "use the kit you built."

**Drive lock (optional, §8):** Sam may want the campaign to lock the player to ONE drive they chose at
the start (`career.drive`), to emphasize "mastering your robot." Easy to support — set `m2.drive[0]` from
`career.drive` when launching a career match instead of showing `p2drive`. Default OFF (let them pick).

---

## 5. Screens / phases needed

Career adds a small set of new `phase` values. **Each new screen reuses the existing draw/click chrome
and dispatch pattern** — there is one `draw()` switch that early-returns per phase (e.g. lines 6892–6895
for the tournament phases) and one click dispatcher that routes per phase (e.g. line 6581 routes all
`p2t*` phases to `tourClick`). Career follows the identical shape.

| New phase | Screen | Draw fn (new) | Click fn (new) | Models on |
|---|---|---|---|---|
| `'p2career'` | **Career HUB / MAP** — the stage map: 5 chapter nodes (middle→grad), current one highlighted, completed ones checked, a CONTINUE/NEW button, back to splash. | `drawCareerHub()` | `careerHubClick()` | `drawTourBracket` (line 6341) for the "overview of a multi-stage journey" layout; `p2Chrome` (line 6831) for header/ESC. |
| `'p2cintro'` | **Chapter INTRO / story beat** — a card with stage art + a few lines of flavor + "▶ START". | `drawCareerBeat()` (shared) | `careerBeatClick()` | A simple full-screen text card; reuse `p2Chrome` + `btn()`. |
| `'p2coutro'` | **Chapter OUTRO / unlock reveal** — "You graduated high school!" + the reward earned + "▶ CONTINUE". | `drawCareerBeat()` (shared, beat type='outro') | `careerBeatClick()` | Same card; show `unlock` granted with a small flourish (reuse the achievement-toast style, `drawAchToast` line ~8209). |

Notes:
- **One shared beat renderer** `drawCareerBeat()` takes the current beat object (from the beat table,
  §6) and renders title/lines/button. The intro and outro phases differ only by which beat they pull —
  keep the draw code single.
- Career does NOT need new in-match phases. **Matches run in the existing `p2race`/`p2ball`/`p2tank`/
  `p2bb` phases.** Career just (a) configures `m2` before calling the existing `startP2Race` /
  `startP2Ball` / `startP2Tank` / `startP2BB` (lines 5850 / 2559 / 3339 / 4326), and (b) intercepts the
  result on the way out (next section).
- **Front-door tile:** add a CAREER button to the splash screen (the SINGLE/MULTIPLAYER split is around
  line 978). Clicking it sets `phase='p2career'` and ensures `career`/`careerSave` are initialized.

### 5.1 The match-end interception (the keystone)

This is the one wiring detail that makes the whole shell work, and the tournament shows EXACTLY how.

Today, after a match, `drawP2Nav` (line 3976) shows a "▶ CONTINUE BRACKET" button **iff `tour` is
active**, and `p2NavClick` (line 4003) reads the result and calls `tourMatchEnd(w)`. The result is read
uniformly across modes at line 4011:

```js
const w = r2?r2.result : tf2?tf2.result : bb2?bb2.result : b2.result;  // 0 | 1 | 'draw'
```

**Career mirrors this exactly.** Add a parallel branch:
- In `drawP2Nav`: `if(career && career.active){ show "▶ CONTINUE CAREER"; return; }` (place the check
  alongside the `if(tour && ...)` branch, before the `p2Series`/REMATCH default).
- In `p2NavClick`: when that button is clicked, read `w` the same way and call **`careerMatchEnd(w)`**.

`careerMatchEnd(side)` (the new router, modeled 1:1 on `tourMatchEnd`, line 6153):
```js
function careerMatchEnd(side){
  const ch = CAREER_CHAPTERS[career.chapter];
  const playerWon = (side === 0);             // career player is always RED / side 0
  if(playerWon){
    career.matchWins++; career.matchIdx++;
    if(career.matchIdx >= ch.matches){        // chapter cleared
      career.done[career.chapter] = true;
      careerGrantUnlock(ch.unlock);           // push into career.unlocks (§4)
      careerStore();
      career.active=false; r2=tf2=bb2=null; b2Teardown(); applyLayout('land2p');
      phase='p2coutro';                        // outro/unlock reveal → then hub → next chapter intro
      return;
    }
  } else {
    // loss: retry current opponent (or chapter) — see §8 retry policy
    career.matchWins = 0;
  }
  careerStore();
  career.active=false; r2=tf2=bb2=null; b2Teardown(); applyLayout('land2p');
  phase='p2career';                            // back to hub; player picks "continue" to play next match
}
```

(`career.active` is a transient "a career match is in flight" flag — same role `tour.cur` plays for the
tournament. Set it true in `startCareerMatch`, clear it here.)

### 5.2 Launching a career match

A small launcher `startCareerMatch()` configures `m2` then calls the existing start fn:
```js
function startCareerMatch(){
  const ch = CAREER_CHAPTERS[career.chapter];
  career.active = true;
  m2.mode = ch.mode;
  m2.set  = {...M2_SET_DEFAULTS};              // sane per-mode defaults (line 5967)
  // (optionally tweak m2.set here per chapter, e.g. bestOf, bbmode='ko', etc.)
  m2.claim = [ {type:'human', name:'YOU'}, {type:'cpu', tier: careerOppTier(ch)} ];  // §2.3
  if(career.drive) m2.drive = [career.drive, career.drive];   // optional drive-lock (§4)
  switch(ch.mode){
    case 'race':       startP2Race(); break;   // line 5850
    case 'normal':
    case 'shooter':    startP2Ball(); break;   // line 2559 (mode read from m2.mode)
    case 'tankfight':  startP2Tank(); break;   // line 3339
    case 'battlebots': startP2BB();   break;   // line 4326
  }
}
```
`careerOppTier(ch)` returns `ch.tier` (optionally bumped on the chapter's last/boss opponent, §2.3).
The career player occupies side 0 (RED); the CPU is side 1 (BLUE) — matching the claim-screen convention.

---

## 6. Story / narrative beats

Keep beats **modular and data-driven** (a table, like everything else), so Sam can edit copy without
touching logic. Tone: fun, FRC-robotics-flavored, lightly self-aware — matching the existing in-game
copy ("push the rear, guard your front", the easter-egg achievements "Autobots, Roll Out").

```js
// proposed — a beats table keyed by chapter id + slot ('intro'|'outro')
const CAREER_BEATS = {
  middle: {
    intro: { title:"MIDDLE SCHOOL", lines:[
      "Your robotics club just handed you a controller for the first time.",
      "It has two sticks and absolutely no chill.",
      "Get through the obstacle course without redecorating the gym walls." ] },
    outro: { title:"YOU PASSED DRIVER TRYOUTS", lines:[
      "Coach is impressed. Mostly that you stopped hitting things.",
      "Unlocked: ARCADE DRIVE — point and go.",
      "High school is next. There's a ball involved." ] },
  },
  hs1: {
    intro: { title:"HIGH SCHOOL · ROOKIE SEASON", lines:[
      "Welcome to the JV team. Strategy this year: SHOVE THE BALL.",
      "No launcher yet — you push it through the goal with your face.",
      "(The robot's face. Probably.)" ] },
    outro: { title:"ROOKIE BANNER EARNED", lines:[
      "You pushed your way to a winning record.",
      "Unlocked: SWERVE DRIVE — strafe like you mean it.",
      "Next year they trust you with a launcher." ] },
  },
  hs2: {
    intro: { title:"HIGH SCHOOL · VETERAN SEASON", lines:[
      "You've earned a SHOOTER. Aim, launch, score.",
      "The freshmen look up to you now. Don't airball." ] },
    outro: { title:"REGIONAL CHAMPIONS", lines:[
      "Banner secured. Recruiters are watching.",
      "Unlocked: HOLONOMIC DRIVE.",
      "Off to college — where the robots are, uh, virtual." ] },
  },
  college: {
    intro: { title:"COLLEGE", lines:[
      "Turns out the dorm's favorite game is TANK FIGHT.",
      "It's you, your hallmates, and a bracket scrawled on a whiteboard.",
      "Win the floor. For honor. And bragging rights." ] },
    outro: { title:"DORM CHAMPION", lines:[
      "Undefeated on Floor 3. They'll tell stories.",
      "Unlocked: a RoboRumble WEAPON for what comes next.",
      "After graduation... the pros." ] },
  },
  grad: {
    intro: { title:"GRADUATE — TURNING PRO", lines:[
      "This is ROBORUMBLE. Real weapons, real armor, real damage.",
      "Everything you unlocked, you bring here. Build your machine.",
      "Beat the champion. Become the champion." ] },
    outro: { title:"CAREER COMPLETE", lines:[
      "From a kid who couldn't drive to the RoboRumble champ.",
      "The whole roster is yours. Go wreck free-play.",
      "🏆 Achievement: 'From the Pits to the Podium'." ] },
  },
};
```

- `drawCareerBeat()` renders `title` big + `lines[]` stacked + a "▶ START" / "▶ CONTINUE" button.
- Beats are **skippable** (a SKIP button + remember in `career.flags` so re-entering a chapter doesn't
  replay them) — confirm with Sam (§8).
- The final outro can fire a new **achievement** (add an entry to `ACH_DEFS`, line 267, e.g.
  `{id:'careerwin', name:'From the Pits to the Podium', ...}` and `achUnlock('careerwin')` in
  `careerMatchEnd` when the grad chapter clears) — reusing the achievements infra wholesale.

---

## 7. Phased build plan

Each phase is **independently shippable** (a green `./battery.sh`) and listed in dependency order. For
each: the key functions to add and the integration points (file = the single HTML `<script>`).

### Phase 1 — Career shell: state + storage + HUB screen
*Goal: a NEW CAREER / CONTINUE front door and a hub that shows the 5 chapters. No matches yet.*
- **Add:** `let career=null;` (near line 5978), `let careerSave=…` loader + `careerStore()` (near line
  284, the load block), `careerNew()` (init the object from §3.1), the `CAREER_CHAPTERS` table (near
  5953), the `CAREER_BEATS` table (§6).
- **Add phase `'p2career'`** + `drawCareerHub()` (model `drawTourBracket` + `p2Chrome`) and
  `careerHubClick()`.
- **Integrate:** splash gets a CAREER tile (~line 978 area); `draw()` switch gets a `p2career` branch
  (alongside the tournament branches ~6892); click dispatcher routes `p2career` to `careerHubClick`
  (alongside ~6581).
- **Tests:** a new smoke (or extend an existing menu suite) asserting `careerNew()` shape, `careerStore`/
  load round-trip through localStorage (the harness can stub localStorage as the map-editor/ach tests
  do), hub renders without throwing.

### Phase 2 — Chapter 1 end-to-end (obstacle race)
*Goal: from the hub, launch chapter 1, play a real race, and SEE a win/loss outcome.*
- **Add:** `startCareerMatch()` (§5.2), `careerOppTier()`. Wire the hub's "▶ START / CONTINUE" to call
  the chapter intro (`p2cintro`) → `startCareerMatch()`.
- **Add phases `'p2cintro'`** + shared `drawCareerBeat()` + `careerBeatClick()`.
- **Integrate:** `startCareerMatch` sets `m2.mode='race'`, claim = human vs ROOKIE cpu, calls
  `startP2Race()` (line 5850).
- **Tests:** smoke that runs `careerNew` → start chapter 1 → assert `phase==='p2race'`, `r2` exists,
  `m2.claim[1].tier===0`.

### Phase 3 — Wire match-end back to the hub + advance
*Goal: winning a chapter-1 match advances the career; losing retries.*
- **Add:** `careerMatchEnd(side)` (§5.1), `careerGrantUnlock(unlock)` (push into `career.unlocks`),
  `careerActive` flag handling.
- **Integrate:** `drawP2Nav` (line 3976) gets a `if(career&&career.active)` branch showing
  "▶ CONTINUE CAREER"; `p2NavClick` (line 4003) reads `w` (the existing line-4011 expression) and calls
  `careerMatchEnd(w)`. Add `'p2coutro'` phase (reuses `drawCareerBeat`).
- **Tests:** smoke that simulates `r2.result=0` → `careerMatchEnd(0)` advances `matchIdx`/clears the
  chapter at the threshold → `phase==='p2coutro'`; `result=1` → retry path. Round-trip persists via
  `careerStore`.

### Phase 4 — Remaining chapters 2–5
*Goal: all five stages playable, each launching the right mode at the right tier.*
- **Mostly DATA:** the `CAREER_CHAPTERS` rows already name the mode + tier; `startCareerMatch`'s switch
  already routes to `startP2Ball`/`startP2Tank`/`startP2BB`. Verify each mode's `m2.set` is sane for
  career (e.g. ball `format`, RoboRumble `bbmode:'ko'`, lives). Add any per-chapter `m2.set` overrides.
- **Integrate:** confirm the result expression covers `bb2.result==='draw'` → treat as no-advance
  (rematch), exactly like the tournament's draw guard.
- **Tests:** extend the smoke to walk all 5 chapters to completion (assert mode per chapter, tier ramp,
  `career.done` all true, final `phase` is the grad outro / hub).

### Phase 5 — Unlocks wired into the game
*Goal: clearing a chapter actually GRANTS drives/weapons/perks/paint and they appear where used.*
- **Add:** `careerGrantUnlock` populates `career.unlocks.{drives,bbWeapons,bbArmor,bbPerks,paints}`.
- **Integrate (read-side):** career-aware gating where loadout/drive pools are built — the drive picker
  (`p2drive`), the armory chip builders (`BB_ARMORY_W/A`, `BB_PERKS_PICK` ~line 4118), and the paint
  cycler. **Keep free-play fully open** unless Sam wants free-play gated (§8); the in-campaign armory can
  show only-unlocked. Seed the grad loadout from `career.unlocks` into `m2.bbLoadout`.
- **Tests:** smoke asserting each chapter's `unlock` lands in `career.unlocks`; an unlocked weapon id is
  present in the career armory pool.

### Phase 6 — Story beats + polish
*Goal: intros/outros from the beat table, skip handling, the campaign-complete achievement, ramp polish.*
- **Add:** finalize `CAREER_BEATS` copy; `drawCareerBeat()` renders intro vs outro; SKIP + `career.flags`
  remember-seen; `ACH_DEFS` entry `careerwin` + `achUnlock('careerwin')` on grad clear; per-opponent tier
  bump (boss = +1 tier) inside `careerOppTier`.
- **Integrate:** outro reveals the unlock with an achievement-toast-style flourish (`drawAchToast`
  pattern ~8209). Hub shows completed chapters checked and the unlock ledger.
- **Tests:** beats render; achievement fires once (idempotent — `achUnlock` self-guards); SKIP sets the
  flag.

---

## 8. Risks / open questions for Sam

1. **One save vs multiple slots?** Plan assumes ONE `frcds_career_v1`. Slots = wrap in an array (easy to
   add later; the per-campaign shape is self-contained). Pick before Phase 1.
2. **Retry policy on a loss:** retry the current OPPONENT (gentle) or restart the whole CHAPTER (stakes)?
   Plan defaults to retry-opponent. Also: is there ever a "game over"/permadeath, or always retry?
3. **Skippable story?** Plan makes beats skippable + remembered. Confirm you want a SKIP, and whether to
   auto-skip already-seen beats on replay.
4. **Does career LOCK free-play?** Plan keeps free-play fully open (unlocks only widen, never restrict
   the sandbox). If you'd rather free-play *also* gate behind career unlocks, that's a bigger,
   more controversial change — say the word.
5. **Drive-lock per campaign?** Optional `career.drive` to force one drivetrain ("master your robot")
   vs. letting the player pick each match. Default OFF.
6. **Chapter length / `matches` count:** 3 per chapter (5 for grad) is a guess. Longer = more story, more
   grind. Tune the `matches` field.
7. **Difficulty:** the ramp ROOKIE→CHAMPION is aggressive at the end (graduate = CHAMPION + 1.10× damage).
   Is "graduate school is brutally hard" the intended feel, or should it cap at WINNER?
8. **RoboRumble loadout for the grad chapter:** auto-equip the earned kit, or make the player build it in
   the armory first (more agency, more friction)?
9. **Map variety:** should chapters force specific arenas (career flavor) or use defaults/RANDOM? The map
   gallery + `bbMapObj` resolver already support per-match maps if we want themed arenas.
10. **Coexistence framing on the splash:** CAREER as a third top-level tile next to SINGLE/MULTIPLAYER,
    or nested under SINGLE PLAYER? Plan assumes a peer tile.

---

## 9. Why this is low-risk to build

- **Zero new engine systems.** Every match runs in an existing phase via an existing start function; the
  result is read by the existing expression; the meta-shell is a near-copy of `tour*`.
- **Additive only.** A null `career`/empty `unlocks` means free-play behaves exactly as today — the gates
  fall through. Career is invisible until you open its tile.
- **Data-driven.** Chapters, beats, and unlocks are tables — most of "more content" is editing data, not
  code, which keeps each increment a small, green diff.
- **Reuses persistence + achievements + tiers + loadouts verbatim**, so it inherits all their tests and
  conventions (the `frcds_*` JSON pattern, `achUnlock` idempotency, `modeTiers()` routing,
  `saveBBLoadout`).

---

### Appendix: key code anchors (drive_showdown_v5.1.249.html)

| What | Line | Use in career |
|---|---|---|
| `phase` declared (`'splash'`) | 155 | add `p2career`/`p2cintro`/`p2coutro` |
| splash SINGLE/MULTIPLAYER split | ~978 | add the CAREER tile |
| `M2_MODES` (mode ids + colors) | 5953 | model `CAREER_CHAPTERS`; mode ids match |
| `p2Enter` / `p2Exit` | 5970/5971 | pattern for entering/tearing down a shell |
| `p2Chrome(title,sub)` | 6831 | header/ESC chrome for all career screens |
| `startP2Race` | 5850 | chapter 1 launcher |
| `startP2Ball` | 2559 | chapters 2–3 (reads `m2.mode`) |
| `startP2Tank` | 3339 | chapter 4 |
| `startP2BB` | 4326 | chapter 5 |
| `drawP2Nav` (CONTINUE button) | 3976 | add the "CONTINUE CAREER" branch |
| `p2NavClick` (result read `w`) | 4003 / 4011 | call `careerMatchEnd(w)` |
| `tourMatchEnd` (result→advance) | 6153 | template for `careerMatchEnd` |
| `tour` state + `tourBuild`/draw | 5978 / 6025 / 6341 | template for `career` + hub |
| tournament phase dispatch (draw) | 6892–6895 | add career phase branches |
| tournament click dispatch | 6581 | add career click route |
| `CPU_TIERS` + `modeTiers()` | 2232 / 2253 | per-chapter difficulty |
| `BB_TIER_DMG` | 2249 | grad-chapter damage ramp (free) |
| `m2.claim` cpu shape `{type,tier}` | 2557 | career opponent claim |
| `M2_SET_DEFAULTS` / `m2.set` | 5967 | per-chapter match config |
| achievements `ACH_DEFS`/`achUnlock` | 267 / 298 | `careerwin` achievement |
| `frcds_ach_v1` load + `achSave` | 284 / 296 | storage pattern to copy |
| custom-map storage `frcds_maps_v1` | 4845 / 4846 | storage pattern to copy |
| loadout `frcds_bbload_v1` save/load | 6695 / 6696 | seed grad loadout from unlocks |
| `DRIVES`/`HOLO_DRIVES`/`STEER_DRIVES` | 87 / 98 / 113 | drive unlocks |
| `BB_WEAPONS`/`BB_ARMOR`/`BB_PERKS` | 4039 / 4054 / 4150 | RoboRumble unlocks |
| armory chips `BB_ARMORY_W/A` | 4118 | career-aware armory pool |
| `PAINT_JOBS`/`ACCENT_COLS` | 4459 / 4470 | cosmetic unlocks |
| `drawAchToast` (toast style) | ~8209 | unlock-reveal flourish |
