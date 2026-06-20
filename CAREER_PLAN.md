---
file: CAREER_PLAN.md
version: 2.0
author: Sam Cao (vision) — drafted by Claude
created: 2026-06-19 (v1.0) · MAJOR REFRAME 2026-06-20 (v2.0)
build_grounded_against: drive_showdown_v5.1.251.html (9474 lines, single self-contained <script>)
status: PLAN ONLY — no game code changed. Buildable spec for CAREER / STORY MODE.
supersedes: v1.0 "growing-up through school grades" plan (middle→high→college→grad with one mode
            per grade). That spine is DROPPED — see §0. The reusable bones (localStorage `frcds_*`
            pattern, the tour* meta-shell precedent, the match-end interception, the phased build
            order, the code-anchor appendix) are PRESERVED and re-pointed at the new design.
---

# DriveShowdown — CAREER / STORY MODE plan (v2.0: the FUN TUTORIAL)

## ⭐ START HERE (for whoever builds this)

**Career mode is a FUN TUTORIAL wrapped in a choose-your-own-adventure (CYOA) story.** Its whole job is
**onboarding**: teach the player every mode AND — the part that matters most — the **drive-control
concepts** (tank vs arcade, bot-centric vs field-centric, holonomic drives, relative vs absolute
heading). Story is the *delivery vehicle*, not the point. The point is: by the end, the player knows how
to DRIVE and which modes exist, and they had fun learning.

Three pillars:

1. **Tutorial first.** Every stage teaches a real game concept. The backbone is a **controls
   curriculum** (§2), sequenced simple→complex, with the existing modes as the vehicles that showcase
   each concept.
2. **TANK is stage 1 — the hook.** `tankfight` plays like an early **arcade game** (simple throttle +
   steer). That is the origin moment where the player **falls in love with being a bot driver.** The old
   plan opened on the obstacle race in "middle school" — that's gone. **Tank is where you start.**
3. **CYOA between matches.** Between the actual games are **story beats with real choices** (2–3
   options). Choices + how you performed drive light **branching** (which concept/mode you explore next,
   story tone, flags). Modest and data-driven — a table of beats, not a giant tree.

Two design rules that flow from "it's a tutorial":

- **Adaptive difficulty, not a fixed ramp.** Each stage scales to **how you did on the previous bit** —
  dominate and the next CPU tier steps up; struggle and it eases. A running **skill rating** (§3) maps to
  the existing 5-tier CPU system. The story shifts slightly with performance too.
- **You don't have to WIN to progress.** Losing still advances the campaign — the narrative just branches
  ("you got knocked out, but you learned something" vs a triumphant path). **Progression is by CHOICE +
  completion, never gated on wins.**

**It is a NEW META-SHELL over the existing modes** — architecturally the closest precedent is the
**tournament** (`tour*`): persistent state, between-match screens, a result-router that advances the
journey. **Build the career shell by cloning the `tour*` pattern**, not by inventing new infrastructure.

**The single most important architectural fact:** every mode already EXITS to a "continue" screen
(`drawP2Nav` → `p2NavClick`), and the tournament already proves you can intercept that exit and route the
result back into a meta-shell (`tourMatchEnd`). Career is the **same hook with a different shell** — but
its router (`careerMatchEnd`) advances on **win OR loss** and updates the skill rating.

**Recommended build order (each step = a green `./battery.sh`):**
1. **Career state + localStorage + HUB + the CYOA BEAT screen** (text + 2–3 choice buttons) — no matches
   yet, just the shell + the choose-your-own-adventure skeleton.
2. **Stage 1 = TANK end-to-end** with its teaching card ("tank drive: each stick is a track") and
   **win/loss BOTH advancing** to the next beat.
3. **Wire match-end → next beat/stage** (`careerMatchEnd`, modeled on `tourMatchEnd`).
4. **Adaptive difficulty** (skill rating → CPU tier; light story branch on performance).
5. **Remaining stages + their drive-concept teaching beats** (arcade → field-centric → holonomic →
   absolute-vs-relative heading), mapped to the modes that showcase them.
6. **Branching/choices depth + unlocks + polish.**

Ritual per increment is the project standard: edit → `git mv` vN→vN+1 → `sed` filename into
`extract.sh`+`MIGRATION.md` → `./extract.sh && ./battery.sh` ALL GREEN → commit → push `dev`.
**This document does NOT bump the version or touch the HTML** — it is the spec only.

---

## 0. What changed from v1.0 (the reframe)

| v1.0 (superseded) | v2.0 (this doc) |
|---|---|
| A "growing up through robotics" story; **school grades are the spine** (middle→high→college→grad). | **No grade spine.** A looser **driver's-journey origin story**; grades survive only as the faintest optional flavor, never the structure. |
| **One mode per grade**, fixed order: race → ball-push → ball-shoot → tank → roborumble. | **The CONTROLS curriculum is the spine** (§2). Modes are vehicles for teaching concepts, ordered simple→complex. |
| Opens on the **OBSTACLE RACE** in middle school. | **Opens on TANK FIGHT** — the arcade-game hook that makes you fall in love with driving. |
| Tank was "the college dorm game." | Sam was unsatisfied with tank-as-college. **Tank is stage 1, the origin.** |
| **Fixed difficulty ramp** ROOKIE→…→CHAMPION baked into the chapter table. | **Adaptive difficulty** — a `skill` rating moves with performance and picks the next tier (§3). |
| Advance **only by winning** (clear a chapter to proceed). | Advance on **win OR loss**; losing branches the story (§4, §5). |
| No mid-story choices (just intro/outro flavor cards). | **CYOA beats with 2–3 real choices** that branch concept/mode/tone (§4). |

Everything reused from v1.0: the `frcds_*` localStorage JSON discipline, the `tour*` meta-shell as the
build template, the `drawP2Nav`/`p2NavClick` match-end interception, the data-driven tables, the phased
green-battery build order, and the code-anchor appendix (re-pointed to v5.1.251 line numbers).

---

## 1. Overview & player fantasy

DriveShowdown today is a **free-play** menu: pick a mode, pick a drive, configure, play. The modes are
great but **nothing teaches you to use them** — a newcomer faces a wall of drivetrains (tank, arcade,
bot-/field-centric swerve, mecanum, X-drive, kiwi, car/4-wheel steer) and a toggle called "Absolute
Heading" with zero on-ramp. Career mode is **that on-ramp, made fun.**

**The fantasy: a driver's-journey origin story.** You're a kid who just got handed a controller. The
first thing you touch is a **TANK** in a simple arcade-style duel — two sticks, two tracks, throttle and
steer — and *that's the moment you fall in love with driving robots.* From there the story follows you
**discovering and mastering** ever-richer ways to drive: you learn arcade (point-and-go), then that a
robot can **strafe** (swerve), then the brain-bending difference between driving **relative to the robot**
vs **relative to the field**, then exotic **holonomic** drives that move any direction at once, and
finally the advanced idea that your right stick can set a **target heading to snap to** (absolute) instead
of a **turn speed** (relative). Each new concept is unlocked by a stage that *naturally shows it off*, and
the story reacts to how you do.

It's **single-player vs CPU**, reusing the existing H2H CPU brains and the 5-tier difficulty system — but
the tier is chosen **adaptively** by your skill rating, not fixed.

**Coexistence with free-play:** career is a NEW front-door tile, not a replacement. The existing SINGLE
PLAYER / MULTIPLAYER / SETTINGS splash stays. Career is its own button → its own hub. Anything it unlocks
is **additive** (it widens free-play); free-play remains fully playable standalone, and the tutorial is
**skippable for veterans** (§7 open Q).

---

## 2. The teaching curriculum (THE BACKBONE)

This is the spine of the whole mode. Design the stage order around **CONTROLS**, simple→complex, and pick
the mode that best *showcases* each concept. Every drive concept below is a real, in-game system — the
grounding notes cite how it actually works in `drive_showdown_v5.1.251.html`.

### 2.1 The drive-control concepts to teach (in order)

| # | Concept | What the player learns | In-game grounding (v5.1.251) |
|---|---|---|---|
| C1 | **TANK drive** | Each stick is a *track*. Push both = forward; split them = turn/spin in place. The raw, mechanical feel. | `DRIVES[0]` `tank` (line 88): "Left stick = Left track · Right stick = Right track". |
| C2 | **ARCADE drive** | One stick: forward/back + turn. "Point and go." Why it's easier than tank but less expressive. | `DRIVES[1]` `arcade` (line 90): "W/S = Forward/Back, A/D = Turn". |
| C3 | **Strafing / SWERVE (bot-centric)** | A robot can move **sideways** without turning. Translate on one stick, rotate on the other. Heading and travel direction decouple. | `botSwerve` (line 92, `DRIVES[2]`): "Strafe without turning — W points robot-forward". Stick-swap UI at line 515. |
| C4 | **BOT-CENTRIC vs FIELD-CENTRIC** | The big one. Bot-centric: "forward" = where the robot points. Field-centric: "forward" = always up-field, no matter which way the robot faces. Why field-centric is easier once you're spun around. | `fieldSwerve` (line 94, `DRIVES[3]`): "W always moves up on field regardless of heading". `driveFieldCentric(d)` (line 164) is the literal frame test. |
| C5 | **HOLONOMIC drives** | Drives that translate in *any* direction at will: **mecanum**, **X-drive**, **kiwi**, strafers (front/H/U). Same translate-stick + rotate-stick scheme, different mechanics/feel. | `HOLO_DRIVES` (line 98): mecanum/frontStrafer/hDrive/uDrive/xDrive/kiwi. `holoCentric` flag toggles their field/bot frame (line 994). |
| C6 | **RELATIVE vs ABSOLUTE heading** (advanced) | The right stick can mean two things: **relative** = stick deflection is a *turn speed* (default); **absolute** = the stick's *angle* is a target facing the robot snaps toward. Twin-stick "point the robot where the stick points." | `absHeading` (line 162) + `absHeadingVr()` (line 172). Field-centric auto-enables it via `absHeadingCouple`/`driveFieldCentric` (lines 164–170); the "Absolute Heading" toggle hint at line 799. |
| C7 *(optional/bonus)* | **STEER drives** (car / forklift / 4-wheel) | "Must be moving to turn" — Ackermann-style steering, the opposite of swerve. A fun contrast/curveball, not core. | `STEER_DRIVES` (line 113): carSteer/rearSteer/fourWheelSteer. |

**Why this order:** C1→C2 are the two "you already get this from video games" drives (tank = each-track,
arcade = point-and-go) — the gentle hook. C3 introduces the *idea* of decoupling heading from travel
(strafing). C4 is the conceptual centerpiece (bot- vs field-centric) and only makes sense *after* you've
felt strafing. C5 generalizes strafing to many drivetrains. C6 is the advanced right-stick concept that
field-centric quietly turned on for you in C4 — now you learn it explicitly and can toggle it. C7 is an
optional palate-cleanser contrast.

### 2.2 Which mode showcases each concept

The existing modes are the vehicles. Match each concept to the mode that *teaches it best*:

| Mode (`m2.mode`) | Best teaches | Why |
|---|---|---|
| `tankfight` | **C1 TANK** (the hook), and a great venue for **C6 absolute heading** later (twin-stick aim). | Simple arcade duel; aiming a turret while driving is the perfect place to feel "stick angle = facing". |
| `race` (obstacle) | **C2 ARCADE**, **C3 STRAFE**, **C7 STEER** | Threading gaps rewards precise point-and-go (arcade), then "oh I can sidestep that wall" (strafe); steer drives feel great on a course. |
| `normal` (push-ball) | **C4 FIELD-CENTRIC** | Pushing a ball around the field while you get spun by contact is *exactly* when field-centric "up is always up-field" clicks. |
| `shooter` (ball) | **C5 HOLONOMIC** + reinforce **C6** | Strafe-to-line-up-a-shot shows off mecanum/X/kiwi; aiming the launcher pairs with absolute heading. |
| `battlebots` (RoboRumble) | **capstone** — combine everything | The deep combat sandbox: bring your best drive + the heading mode you like; "graduation" of the curriculum. |

(This is a *recommended* mapping; the stage table §2.3 is data-driven, so Sam can re-pair freely.)

### 2.3 The STAGE LIST (replaces the old school chapters)

Each stage = `{ mode it launches, the drive concept(s) it teaches, the win/learn objective, how it
connects to neighbors }`. **Stage 1 is TANK.** Stages advance on completion (win OR loss), with CYOA
beats between them. The number/exact pairing is tunable (§7), but this is the intended simple→complex
shape:

| # | Stage id | Mode | Teaches | Drive locked/taught | Objective (the LEARN goal) | Connects to |
|---|---|---|---|---|---|---|
| 1 | `tank_hook` | `tankfight` | **C1 TANK** | `tank` | Drive with two tracks; win or lose a duel — the point is *falling in love with driving*. | → CYOA: "that was fun — what next?" |
| 2 | `arcade_course` | `race` | **C2 ARCADE** | `arcade` | Point-and-go through an obstacle course; feel how arcade differs from tank. | branches from stage-1 beat |
| 3 | `strafe_intro` | `race` *(or `normal`)* | **C3 STRAFE** | `botSwerve` | Discover strafing — sidestep a wall / line up without turning. | → the field-centric reveal |
| 4 | `field_centric` | `normal` (push-ball) | **C4 BOT vs FIELD** | `fieldSwerve` | Get spun around pushing the ball; learn "up is always up-field." The centerpiece. | branches on whether it clicked |
| 5 | `holo_shooter` | `shooter` | **C5 HOLONOMIC** | `mecanum`/`xDrive`/`kiwi` (player picks) | Strafe to line up shots with a holonomic drive; sample a few. | → heading lesson |
| 6 | `heading_advanced` | `tankfight` *(or `shooter`)* | **C6 REL vs ABS heading** | any swerve/holo + `absHeading` toggle | Twin-stick: point the robot where the stick points (absolute) vs turn-speed (relative). | → capstone |
| 7 | `capstone_rumble` | `battlebots` | **capstone** | player's choice of everything | Bring your favorite drive + heading mode to a real RoboRumble fight. Graduation. | → finale beat |
| *(opt)* | `steer_detour` | `race` | **C7 STEER** | `carSteer`/`fourWheelSteer` | A side-detour curveball reachable via a CYOA choice — "try driving like a car." | optional branch |

**Drive-lock per stage:** because each stage is *teaching one concept*, the campaign sets the player's
drive for that stage (`m2.drive` from the stage's taught drive) so the lesson lands — see §5.2. The
coaching card (§5) explains the concept *before* the match. Free-play stays fully open; the lock is
career-only.

---

## 3. Adaptive-difficulty model (concrete, buildable)

Difficulty is **not** a fixed ramp. It tracks a single persisted number — `career.skill` — that nudges up
or down based on how you did, and maps to the existing CPU tier system.

### 3.1 The skill rating

- `career.skill` is a float, **range 0.0 … 4.0**, **starts at 0.5** (a touch above ROOKIE).
- After every career match, update it from a **performance score** `perf ∈ [0,1]` derived from the result
  (and, where cheap, the margin):
  - **Win:** `perf = 0.75 + 0.25 * dominance` (dominance from margin if available — e.g. race time gap,
    RoboRumble HP remaining, ball-goal differential — else 0.75).
  - **Loss:** `perf = 0.25 * closeness` (closeness 1.0 = nail-biter, 0.0 = blowout; default 0.25).
  - **Draw** (RoboRumble mutual KO): `perf = 0.5`.
  - Update: `career.skill = clamp(career.skill + (perf - 0.5) * STEP, 0, 4)`, `STEP = 1.2`. So a clean win
    pushes ~ +0.3, a blowout loss ~ −0.6, a close loss ~ −0.15. Performance moves you, but one match never
    swings you more than ~half a tier.

### 3.2 Skill → next stage's CPU tier

The engine has **5 tiers** in `CPU_TIERS` (line 2232; per-mode clones `CPU_TIERS_SHOOTER/TANK/RACE/BB` at
2245–2248), index 0 ROOKIE … 4 CHAMPION, routed by `modeTiers()` (line 2253). Map the rating to a tier
when launching the next match:

```js
function careerTier(){                       // skill (0..4) → CPU tier index (0..4)
  return clamp(Math.round(career.skill), 0, 4);
}
```

So a player who keeps winning climbs ROOKIE→…→CHAMPION naturally; a player who's struggling gets eased
back down. The tier is set on the CPU claim exactly like the claim screen does today:
`m2.claim[1] = {type:'cpu', tier: careerTier()}` (claim cpu shape lives at line ~2557; tier is read by
`modeTiers()`/the per-mode tables). **RoboRumble bonus:** `BB_TIER_DMG` (line 2249) already scales CPU→
human damage by tier, so the capstone auto-hits harder when your skill is high — free.

### 3.3 Performance also nudges the STORY (lightly)

The same `perf` (or a coarse `result ∈ {win,loss,draw}`) sets a flag the next beat can read:
`career.flags.lastResult = 'dominated' | 'won' | 'lost' | 'blown_out'`. CYOA beats branch on it (§4) so a
dominant run gets a cocky narrator and a tougher fork offered, a blowout gets a "shake it off, here's a
tip" fork. **This is how losing branches the story instead of ending it.**

---

## 4. Branching / CYOA data model

Keep branching **modest and data-driven**: a graph of **beats**, each with text and 2–3 **choices**, each
choice carrying an *effect* (where to go next + flags/unlocks). Conditions let a beat or choice depend on
performance/flags/prior choices. This is the choose-your-own-adventure layer that sits *between* matches.

**Branching philosophy (Sam, evolved live — capture the FINAL position):**
- **Light, data-driven branching.** Choices + how you performed shape the *between-match* story. Keep it light — a
  handful of meaningful forks, not a combinatorial tree.
- **Some choices have MILD real differences** — not purely cosmetic. A choice might take a short **detour** stage
  (e.g. the `steer_detour` "drive like a car" curveball), reorder which **concept** you meet next, nudge the
  **difficulty** (pick the "tougher sparring partner" → +skill bump), or grant a small **unlock** (a paint, a perk).
- **NOT full convergence — different choices tell different STORIES and different ENDINGS.** There are **multiple
  endings** (aim for a small, authorable set — ~3–5 distinct ones), selected by your choices + performance + flags.
  The narrative genuinely forks; the ending you reach is *yours*.
- **You BASICALLY play the same GAMETYPES throughout (Sam, confirmed).** The gameplay/teaching backbone is
  **common on every path** — every player plays through essentially the same modes (tank → arcade race → ball →
  shooter → rumble) and is taught every core drive concept (tank → arcade → strafe → bot/field-centric →
  holonomic → heading). Choices only *reorder / detour / re-frame / difficulty-nudge* that common spine. What
  **truly diverges is the STORY layer** — the between-match narrative beats and **which ENDING you land on**.
  So: **same gametypes, different stories & endings.** (This keeps it a complete tutorial for everyone while still
  feeling like your own adventure — and it's far cheaper to build than branching gameplay.)
- **The payoff: a personalized end-of-journey RECAP** (see §4.4) that stitches your choices + win/loss/skill history
  + which ending you reached into a narrated "here's how *your* story went" summary.

### 4.0 Choices with IN-GAME consequences (a light "build your robot" modifier layer)

Beyond story/ending forks, **some choices apply a small GAMEPLAY modifier** to the matches that follow — a
narrative decision with real mechanical weight. **The core rule (Sam): it's ALL learning-gated — get questions right
→ bonuses; get them wrong → you lose out.** Examples:
- **"Dedication" / shop time** → a **performance bonus** for putting in the work. ⚠️ **Metric = total TIME the
  player spends LEARNING in-game** (exploring shop factoids, taking quizzes) — **NOT the real-world system clock.**
  Sam explicitly does **not** want to reward staying up late or punish younger players, so there's no real-clock or
  "late-night" check; effort is measured purely by in-game learning engagement (patience-gated).
- *"Couldn't afford the nicest motors"* → a **small sensitivity cap** / slightly lower top speed — fixed by earning
  **grant money** (§6.4), i.e. by doing the optional writing exercise.
- **Power-chemistry knowledge** → a **speed / weapon-damage** bonus (answer the Li-ion vs SLA + cells-in-series/
  parallel questions right → "the better battery chemistry powered a higher-performance weapon"). The headline of
  *correct answers = real in-match bonuses*.

**Model:** store active modifiers in `career.mods` (a small list of `{id, label, effect}`), persisted with the save.
Apply them in **`startCareerMatch()`** (the launch hook, §5.2) by tweaking the about-to-start match *before* calling
the mode's `startP2*` — e.g. clamp the effective `SENS_MAX` / per-seat `m2.sens`, bump an `m2.set` HP/speed knob,
pre-set the loadout/perk, or add/remove an ally CPU. Keep each effect **small and reversible** — save/restore around
the match exactly like the qualifier does (`tour._qsave` pattern), so a modifier never leaks into free-play. These
also feed the recap ("…ran the budget motors all season and *still* made it"). **Open Q for Sam:** how impactful —
flavor-with-a-wink, or genuinely build-defining?

### 4.1 `CAREER_BEATS` — the beat table

```js
// proposed — drop near M2_MODES (~line 5972). A MAP of beat-id → beat.
const CAREER_BEATS = {
  // ── a STORY/CHOICE beat: text + 2–3 choices that route the journey ──
  'intro': {
    kind:'story',
    title:"FIRST DRIVE",
    lines:[
      "Someone hands you a controller and points at a robot.",
      "\"It's a tank. Left stick is the left track, right stick is the right track. Go.\"" ],
    choices:[
      { label:"Let's GO (drive the tank)", goto:'stage:tank_hook' },
      { label:"Wait — how do tracks work?", goto:'coach:C1', then:'stage:tank_hook' },
    ],
  },
  // ── a COACHING beat: a teaching card shown BEFORE a stage (the tutorial heart) ──
  'coach:C4': {
    kind:'coach', concept:'C4',
    title:"BOT-CENTRIC vs FIELD-CENTRIC",
    lines:[
      "Bot-centric: \"forward\" is wherever your robot is POINTING.",
      "Field-centric: \"forward\" is always UP-FIELD — even when you're spun around.",
      "You're about to get shoved around chasing a ball. Field-centric keeps 'up' = up.",
      "Try it. If you hate it, you can flip back." ],
    choices:[ { label:"Got it — drive", goto:'stage:field_centric' } ],
  },
  // ── a POST-MATCH branch beat: reads performance, forks the path ──
  'after:tank_hook': {
    kind:'story',
    title:"...okay that was awesome",
    when:{},                                   // always reachable after stage 1
    lines:[
      ({c})=> c.flags.lastResult==='lost'
        ? "You got wrecked. But you were GRINNING. Yeah. You're a driver now."
        : "You won your first duel. Welcome to robotics — it only gets weirder." ],
    choices:[
      { label:"Teach me to go FAST (a course)",        goto:'coach:C2', then:'stage:arcade_course' },
      { label:"Can robots move SIDEWAYS?",             goto:'coach:C3', then:'stage:strafe_intro' },
      { label:"Try driving like a CAR (detour)",       goto:'coach:C7', then:'stage:steer_detour',
        when:{ flag:'lastResult', eq:'dominated' } }, // a flex option only if you crushed it
    ],
  },
  // ...one 'after:<stage>' + the needed 'coach:<concept>' beats per stage (§2.3)
};
```

**Beat shape:**
- `kind`: `'story'` (narrative + choices that branch) · `'coach'` (a teaching card for one `concept`,
  shown before its stage) · `'outro'`/`'finale'` (campaign end). The shared `drawCareerBeat()` renders
  all kinds; coaching cards get a small concept badge + the "try it" framing.
- `title`, `lines[]`: `lines` may be plain strings OR a `({c})=>string` function (gets `career` as `c`) so
  copy can react to `flags`/`skill` without a combinatorial tree.
- `choices[]` (1–3): each `{ label, goto, then?, when?, effect? }`.
  - `goto`: a node ref — `'stage:<id>'` launches a stage, `'coach:<concept>'` / `'<beatId>'` go to a beat.
  - `then`: a *follow-on* node after `goto` (e.g. `coach` then `stage`) — keeps the graph shallow.
  - `when`: a condition (see below) — if false, the choice is hidden/greyed.
  - `effect`: optional `{ setFlag:{...}, unlock:{...} }` applied when chosen.
- `when` (beat-level or choice-level): `{ flag:'lastResult', eq:'dominated' }` /
  `{ minSkill:2 }` / `{ choseBefore:'someChoiceId' }` — small declarative predicates evaluated against
  `career`. Keep them tiny; no scripting.

**The journey graph** is therefore: `intro` → (choice) → `coach:C1`? → `stage:tank_hook` (match) →
`after:tank_hook` → (choice) → `coach:Cx` → `stage:...` → … → `finale`. Linear-ish with a few forks and an
optional detour — **modest by design.**

### 4.2 The `career` state object

Mirror the `tour` global (declared `let tour=null;` at line 5997). Add alongside it:

```js
let career=null;   // null when not in a campaign; an object while playing one
```

Shape (created by `careerNew()` or loaded from storage):

```js
career = {
  node:    'intro',     // current position in the beat graph (a beat id, or 'stage:<id>' while a match is queued)
  stage:   null,        // the stage id currently being played (set by startCareerMatch), else null
  active:  false,       // a career match is in flight (transient — set in startCareerMatch, cleared in careerMatchEnd)
  skill:   0.5,         // ADAPTIVE difficulty rating 0..4 (§3) → careerTier()
  taught:  [],          // concepts the player has been coached on, e.g. ['C1','C2','C4'] (for "skip already-seen", progress UI)
  cleared: [],          // stage ids completed (win OR loss) — drives hub progress + "don't re-teach"
  choices: {},          // record of choices made: { 'after:tank_hook': 1, ... } — for `choseBefore` conditions
  flags:   {            // story flags, incl. adaptive-story hooks
    lastResult: null,   // 'dominated'|'won'|'lost'|'blown_out' — set by careerMatchEnd (§3.3)
  },
  unlocks: {            // additive reward ledger (§6) — bleeds into free-play
    drives:[], bbWeapons:[], bbArmor:[], bbPerks:[], paints:[],
  },
  ver: 1,               // schema version for safe migration
};
```

Notes:
- `node` + `cleared[]` are the source of truth for "where am I." Progression appends to `cleared[]`
  whether you **won or lost** — the *beat* you land on next differs (via `flags.lastResult`), but you
  always move forward.
- `taught[]` lets coaching cards self-skip on replay and powers a "concepts learned" progress readout.
- `flags` is an open bag so beats stay conditional without schema churn.
- `unlocks` is the persistent reward ledger (§6).

### 4.3 localStorage persistence (the `frcds_*` + JSON pattern)

The codebase has a consistent pattern: a key `frcds_<thing>_v<N>`, JSON-encoded, loaded once at startup
with a try/catch fallback, saved through a tiny `saveX()` helper. Copy literally:
- achievements: `frcds_ach_v1` (line 284), saver `achSave()` (line 296)
- custom maps: `frcds_maps_v1` (line 4859), saver `saveCustomMaps()` (line 4860)
- RoboRumble loadout: `frcds_bbload_v1` save/load (lines 6714/6715)

**Career key:** `frcds_career_v1`.

```js
// load once at startup (place near line ~284 with the other loads)
let careerSave = (()=>{ try{ const c=JSON.parse(localStorage.getItem('frcds_career_v1')||'null');
  return (c && typeof c==='object') ? c : null; }catch(e){ return null; } })();
function careerStore(){ try{ localStorage.setItem('frcds_career_v1', JSON.stringify(career)); }catch(e){} }
```

`careerSave` is the *persisted* campaign (or null). `career` is the *active* in-memory object. On entering
the career hub: if `careerSave` exists → offer CONTINUE (load it into `career`); else NEW (`careerNew()` →
`careerStore()`). **Call `careerStore()` after every meaningful change** (match end, choice made, concept
taught, unlock granted) so progress survives a refresh — same discipline as `achSave()`/`saveBBLoadout()`.
One save slot is the default (single `frcds_career_v1`); slots = wrap in an array later (§7).

---

### 4.4 The personalized end-of-journey RECAP (the finale payoff)

The campaign ends on a generated **"your journey" summary** — the emotional payoff and the natural place to show
what you *learned*. It reads the saved history and narrates **your** specific run:
- **What it stitches:** `career.choices` (the forks you took), `career.log` (a small append-only list — each stage's
  result + margin, modifiers picked, the ending reached), the `skill` arc (started shaky and climbed? dominated
  throughout?), `taught[]` (the drive concepts you mastered, tank → … → heading), `mods` (e.g. "ran budget motors
  all season"), `unlocks`, and **which ENDING** your choices + performance landed you on.
- **Output:** a `careerRecap()` returning ordered narrated lines (a couple of short paragraphs), on a dedicated
  **`'p2crecap'`** finale screen (reuse `drawCareerBeat`'s text layout). Warm, FRC-flavored — *"You started barely
  able to keep the tank straight. By the end you read the field-centric stick like a second language. Ran the cheap
  motors the whole way and still took the rumble."*
- **Data needed:** a tiny `career.log = [{stage, result, margin, mods, choice}]` appended in `careerMatchEnd` and at
  each choice — that's all the recap needs, no new systems.
- **Why it matters:** the gametypes are common, but story + ending + mods + how-you-did differ, so the recap is what
  makes two runs feel like genuinely different journeys — the "different stories & endings" promise on one screen.

## 5. Screens / phases needed

Career adds a small set of new `phase` values. **Each reuses the existing draw/click chrome and dispatch
pattern** — there is one `draw()` switch that early-returns per phase and one click dispatcher that routes
per phase (the tournament's `p2t*` phases are the template; the click dispatcher is around line 6628's
neighborhood, the draw dispatch near the tour draw entry). Career follows the identical shape, reusing
`p2Chrome` (line 6851) for header/ESC.

| New phase | Screen | Draw fn (new) | Click fn (new) | Models on |
|---|---|---|---|---|
| `'p2career'` | **Career HUB / INTRO** — NEW/CONTINUE; a journey readout (concepts learned, current skill, stages cleared); back to splash. | `drawCareerHub()` | `careerHubClick()` | `drawTourBracket` (line 6360) for "overview of a journey"; `p2Chrome`. |
| `'p2cbeat'` | **CYOA BEAT screen** — the heart of the between-match layer: title + `lines[]` + **2–3 choice buttons**. Also renders `coach` cards (concept badge + "try it") and `outro`/`finale`. | `drawCareerBeat()` (shared) | `careerBeatClick()` | A full-screen text card; `p2Chrome` + `btn()` for choices. |

Notes:
- **One shared beat renderer** `drawCareerBeat(beat)` handles `story` / `coach` / `outro` / `finale` by
  branching on `beat.kind`. Story = lines + choice buttons; coach = a "HERE'S THE CONCEPT… try it" card
  with one or two buttons (usually a single "drive" plus maybe "explain more"); outro/finale = celebrate +
  CONTINUE. **Keep the draw code single** — the data drives the variation.
- **Coaching cards are the tutorial.** Before a concept's first stage, its `coach:<C#>` beat delivers the
  short teaching ("here's what bot-centric vs field-centric means, try it"). Mark the concept in
  `career.taught` so it doesn't re-teach.
- Career needs **NO new in-match phases.** Matches run in the existing
  `p2race`/`p2ball`/`p2tank`/`p2bb` phases. Career just (a) configures `m2` + the drive-lock + the
  adaptive tier before calling the existing start fn, and (b) intercepts the result on the way out (§5.1).
- **Front-door tile:** add a CAREER button to the splash (the SINGLE/MULTIPLAYER split lives near the
  splash draw/click around line ~978/994). Clicking it sets `phase='p2career'` and ensures
  `career`/`careerSave` are initialized.

### 5.1 The match-end interception (the keystone — win OR loss advances)

The tournament shows EXACTLY how. After a match, `drawP2Nav` (line 3976) shows a "▶ CONTINUE…" button iff
`tour` is active, and `p2NavClick` (line 4003) reads the result and calls `tourMatchEnd(w)`. The result is
read uniformly across modes at **line 4009**:

```js
const w = r2 ? r2.result : tf2 ? tf2.result : bb2 ? bb2.result : b2.result;   // 0 | 1 | 'draw'
```

**Career mirrors this — but advances on win OR loss.** Add a parallel branch:
- In `drawP2Nav`: `if(career && career.active){ show "▶ CONTINUE STORY"; return; }` (place alongside the
  `if(tour && (tour.cur||tour.qual))` branch, before the `p2Series`/REMATCH default).
- In `p2NavClick`: when that button is clicked, read `w` the same way and call **`careerMatchEnd(w)`** —
  and DON'T early-return on a non-win; even a loss routes onward.

`careerMatchEnd(side)` (the new router, modeled on `tourMatchEnd`, line 6172):

```js
function careerMatchEnd(side){
  const playerWon = (side === 0);             // career player is always RED / side 0
  const isDraw    = (typeof side !== 'number');
  // 1) PERFORMANCE → skill rating + story flag (§3)
  const perf = isDraw ? 0.5 : playerWon ? (0.75 + 0.25*careerDominance()) : (0.25*careerCloseness());
  career.skill = clamp(career.skill + (perf - 0.5)*1.2, 0, 4);
  career.flags.lastResult = isDraw ? 'won'
      : playerWon ? (perf>0.9?'dominated':'won')
      : (perf<0.1?'blown_out':'lost');
  // 2) mark the stage cleared (WIN OR LOSS — progression is by completion, not winning)
  const st = career.stage;
  if(st && !career.cleared.includes(st)) career.cleared.push(st);
  careerGrantUnlock(careerStageUnlock(st));   // any unlock tied to *finishing* the stage (§6)
  // 3) tear the match down (same as the tournament) and go to the NEXT beat
  career.active=false; career.stage=null; r2=tf2=bb2=null; b2Teardown(); applyLayout('land2p');
  career.node = careerNextNode(st);           // e.g. 'after:tank_hook' (a branch beat that reads lastResult)
  careerStore();
  phase='p2cbeat';                            // → the CYOA beat that forks on win/loss
}
```

(`career.active` is the transient "a career match is in flight" flag — same role `tour.cur` plays.
`careerDominance()`/`careerCloseness()` read the just-finished mode's margin where cheap — race time gap,
`bb2` HP, ball goal diff — else return a neutral default. `careerNextNode(stageId)` returns the
`after:<stage>` beat id from the stage table.)

### 5.2 Launching a career match (drive-lock + adaptive tier)

A small launcher `startCareerMatch(stageId)` configures `m2` then calls the existing start fn:

```js
function startCareerMatch(stageId){
  const st = CAREER_STAGES[stageId];          // the stage row (§2.3 as a data table)
  career.stage = stageId; career.active = true;
  m2.mode = st.mode;
  m2.set  = {...M2_SET_DEFAULTS};              // sane per-mode defaults (line 5986); tweak per stage if needed
  m2.claim = [ {type:'human', name:'YOU'}, {type:'cpu', tier: careerTier()} ];   // ADAPTIVE tier (§3.2)
  if(st.drive) careerSetDrive(0, st.drive);   // DRIVE-LOCK the lesson (set m2.drive[0]); see p2cSetDrive (line 6694)
  if(st.absHeading!=null) absHeading = st.absHeading; // C6 stage can pre-set the heading mode to demo it
  switch(st.mode){
    case 'race':       startP2Race(); break;   // line 5869
    case 'normal':
    case 'shooter':    startP2Ball(); break;   // line 2559 (mode read from m2.mode)
    case 'tankfight':  startP2Tank(); break;   // line 3339
    case 'battlebots': startP2BB();   break;   // line 4331
  }
}
```

`careerSetDrive(0, driveId)` resolves a drive id (`tank`/`arcade`/`botSwerve`/`fieldSwerve`/`mecanum`/…)
to the `m2.drive[0]` `{kind,idx,...}` shape via `DGROUPS` (line 6690) + `p2cSetDrive` (line 6694) — which
ALSO calls `absHeadingCouple(driveFieldCentric(...))`, so picking a field-centric drive *automatically*
turns on absolute heading, exactly mirroring the lesson in C4→C6. The career player occupies side 0
(RED); the CPU is side 1 (BLUE).

(`CAREER_STAGES` is the §2.3 table as data — keyed by stage id — so adding/reordering stages is a data
edit, like `M2_MODES` at line 5972.)

---

## 6. Unlocks

Unlocks are **additive widenings of systems that already exist**, gated by reading `career.unlocks`.
Nothing about free-play breaks if career is never played — the arrays start empty and gates fall through
to "everything available." Keep free-play fully open unless Sam wants it gated (§7).

| Reward type | Existing system it feeds | Where defined / consumed |
|---|---|---|
| **Drive types** | `DRIVES` (line 87), `HOLO_DRIVES` (98), `STEER_DRIVES` (113), grouped in `DGROUPS` (6690) | **Unlocked two ways, early (Sam):** (1) **answer questions about the drives' DIFFERENCES** (tank vs arcade vs bot- vs field-centric, holonomic, heading) to unlock them, and (2) **complete hands-on TASKS** that prove you can drive them. Order builds to a climax — **FIELD-CENTRIC SWERVE unlocks LAST**, after you've earned the others (it's the brain-bender). |

**Early game = QUESTIONS + TASKS (Sam).** Onboarding pairs *understanding* with *doing*: a quick question about a
drive's difference, then a **hands-on task** in that drive to demonstrate. Tasks are mini-objectives, not
win-a-match — e.g. the early TANK and ARCADE stages are **task-based** (navigate the course, hit the gates), and a
delightful one Sam floated: **parallel-park a STEER drive** (`carSteer`) to learn car-style steering. **Drive
unlock/teach order (climax = field-centric):** tank → arcade → *(steer detour: parallel park)* → bot-centric →
holonomic → relative-vs-absolute heading → **field-centric swerve (LAST)**. *(Update §2's curriculum table to this
ordering — field-centric moves from the middle to the final concept.)*
| **RoboRumble weapons** | `BB_WEAPONS` (4039), armory chips `BB_ARMORY_W` (4118) | Capstone + late rewards; unlocked weapons appear in the armory rail. The CANNON precedent (hidden-until-unlocked) is the mechanism to copy. |
| **RoboRumble armor / perks** | `BB_ARMOR` (4054) / `BB_PERKS` (4150), chips `BB_ARMORY_A` (4119) / `BB_PERKS_PICK` (4162) | Same — armory/perk chips. |
| **Paint / cosmetics** | `PAINT_JOBS` (4473), the 🎨 paint picker | Cosmetic-only rewards (a "campaign livery" for finishing a stage/the story). |

**Loadout tie-in:** the player's RoboRumble loadout persists in `frcds_bbload_v1`
(`saveBBLoadout`/`loadBBLoadout`, lines 6714/6715). For the **capstone** stage, seed `m2.bbLoadout` from
the campaign's earned weapons so the finale feels like "use the kit you built."

Because progression is by completion (not winning), unlocks are tied to **finishing** a stage, not winning
it — losing still earns the trophy/livery and still teaches the concept.

### 6.1 Tools & training → your RoboRumble ARSENAL (the workshop skill-tree)

The richest unlock hook (Sam): **what you learn/do in the story decides which RoboRumble WEAPONS you can field**
in the capstone. Training, classes, and hobbies map to weapons — and because **earlier choices limit later ones**
(time, budget, interests), you can't learn everything, so your endgame arsenal *is* your build path.

**How you unlock a weapon: ANSWER ITS QUESTION (Sam — it's a real learn-robotics quiz).** Each tool/weapon has a
short **knowledge question** (e.g. *"A jet engine makes thrust mainly by…"* → JET; a kerf/teeth question → BUZZSAW).
Answer correctly → you've "learned the tool" → its weapon is added to `career.unlocks.bbWeapons`. The **story
experiences are how you LEARN the answers**: take the aviation / RC-plane path earlier and the jet-engine question is
a gimme; do the welding scene and the blowtorch→flamethrower question lands. **You can theoretically earn
EVERYTHING** on an ideal run (know — or learn — every answer). **Looking it up / googling is WELCOME** — the whole
point is to actually teach robotics + engineering, not to gotcha. **Wrong answers don't block progress** (you still
advance, §4.0) — you just **miss that unlock/bonus**. So the campaign doubles as a real STEM tutorial: the more you
learn (in-story or IRL), the bigger your arsenal — and the bonuses — you carry into the rumble.

**Bonuses, not just unlocks.** A correct answer can also grant a small **performance bonus** (the §4.0 modifier
layer): *"you clearly know your pneumatics"* → a piston-tuning buff; a wrong answer → you lose that edge. Knowledge =
power, literally.

**The workshop screen** is the "shop class / build season" beat where the relevant questions are posed — a quiz hub
that reads which story paths you took (to set difficulty / offer a hint) and writes unlocks + bonuses. The
**capstone** seeds `m2.bbLoadout` from what you earned; the armory rail shows only your unlocked weapons (the CANNON
*hidden-until-unlocked* precedent is the exact mechanism).

**Topic / story-source → weapon** (✓ = Sam's; each weapon's *question* is themed to this topic):

| Story source | → Weapon (`BB_WEAPONS`) |
|---|---|
| ✓ power **drill** training | DRILL |
| ✓ **blowtorch** / welding torch | FLAMETHROWER |
| ✓ **circular saw** training | BUZZSAW |
| ✓ **flight interest / RC-plane** hobby | JET ENGINE |
| angle-grinder / flywheel / machining | SPINNER |
| pneumatics / air-ram class | PISTON |
| pneumatic flipper / linear actuator | PUSHER (`flipper`) |
| heavy fab / sheet-metal / plow build | DOZER (`wedge`) |
| gripper / claw / end-effector club | PINCER |
| welding + pit-crew / "support" path | REPAIR TORCH |
| chemistry / pyro / a reckless streak | KAMIKAZE |
| marksmanship / launcher hobby | CANNON (special) |

**Earlier-limits-later** examples: an "academics-heavy semester" → fewer shop picks; "part-time job at the machine
shop" → +picks but a fatigue modifier (§4.0); pick up **RC planes** at the hobby beat → JET unlocked but you skipped
the welding scene → no FLAMETHROWER that run. This is the "different choices, different build, **same gametypes**"
promise cashed out, and it feeds the recap ("…you graduated a DRILL-and-PINCER grappler").

Armor & perks can extend the same idea later (a **materials** class → HARDPLATE; a **fitness/driving** focus →
LIGHT; a **medic/pit-crew** arc → the PIT STOP perk) — weapons are the headline; armor/perks are a stretch.

### 6.2 The question bank — REAL, learnable robotics (Sam: "if you're paying attention you should learn real things")

The quiz is **genuinely educational**: pay attention to the story and you actually learn; the questions check that
and reward it. Topics span real FRC / robotics / engineering — propulsion, cutting & kerf, pneumatics, **power &
batteries**, materials, and the drive kinematics from §2. Examples Sam called out:
- *"Sealed lead-acid (AGM) vs lithium-ion battery — what's the real difference?"* (energy density, weight, voltage
  sag under load, charging/safety) — taught in a "wiring the robot / pit electronics" beat.
- *"Cells in SERIES vs PARALLEL — what does each do?"* (series adds **voltage**, parallel adds **capacity/current**).
  Answer right → you build a **better power source** → a **speed boost or damage boost** carried into the match (a
  §4.0 modifier). This is the template for *power knowledge → performance bonus*: more voltage ≈ more speed, more
  parallel current ≈ more sustained punch.
- *"A jet engine produces thrust mainly by…"* → unlocks JET.
- A holonomic / field-centric / absolute-vs-relative-heading question → confirms the §2 driving lessons landed.

**Data:** a table `CAREER_QUIZ` — id → `{reward (bbWeapon/armor/perk/bonus/none), topic, prompt, options[], answer,
taughtBy (the story beat/path that teaches it), hint, explain}`. **Show the `explain` text either way** — right or
wrong, you leave knowing the real answer (that's the "learn real things" payoff). Authoring is pure content; it's all
real and googleable. Right → unlock/bonus; wrong → you still advance, just without that reward. Example row:

```js
{ id:'batt_chem', topic:'power', reward:{ bonus:'powerTuned' },
  prompt:"Vs a sealed lead-acid (AGM) pack, a same-weight Li-ion pack mainly gives you…",
  options:["more energy for the weight + steadier voltage under load","more weight but cheaper",
           "no real difference","only a physically bigger pack"],
  answer:0, taughtBy:'beat:pit_electronics',
  explain:"Li-ion ≈ 3–4× the energy density of lead-acid and holds voltage better under load → a lighter, "+
          "longer-running bot. AGM is cheap and robust but heavy and sags under high current." }
```

**Shop factoids / safety tips (patience-gated discovery, Sam).** Every tool you click on in the workshop shows a
short **factoid or safety tip** — so simply *exploring* teaches you (and primes the quiz answers). The "effort"
bonus (§4.0) is measured by this kind of in-game learning engagement, not the clock. It's **all educational**: the
amount you get **right on the quizzes is what grants bonuses; wrong answers lose out** (which adds light replay
value — or you just look it up, which is fine, because you learn either way).

**Content pipeline — Sam's lectures (offered, yes please).** The question bank + per-tool factoids should be sourced
from **Sam's actual lecture material** (Li-ion vs SLA, cells in series/parallel, drivetrains, etc.). Workflow: Sam
pastes the text or drops the files → distill into `CAREER_QUIZ` rows (`prompt`/`options`/`answer`/`explain`) + shop
factoid/safety-tip strings. Keep it authentic and real — that *is* the point. (A correct power-chemistry answer →
the speed/weapon-damage bonus, per §4.0.)

### 6.3 You have a NAME (Sam)

At the **start** of career mode, prompt for the player's **name** (reuse the existing `nameEntry` system — the
on-screen text box used for best-times/grid names) and store it as `career.name`. The story **refers to you by
name** throughout: beat `lines` already support `({c})=>string` functions (§4.1), so any line can read
`c.name` — e.g. ``({c})=>`"Nice driving, ${c.name}. Now try it field-centric."` ``. A default ("ROOKIE"/"DRIVER")
covers a skipped prompt. This is the cheap touch that makes the recap (§4.4) read as truly *your* story.

### 6.4 Grant money — the budget (Sam: optional WRITING exercises fund your robot)

Real FRC flavor: a **grant-money** budget (`career.money`) funds your build. You earn it through **optional WRITING
exercises** — a mock **grant-application essay/paragraph** prompt (write a short answer: why fund your team / your
robotics journey). **You can SKIP it** — but skipping the writing exercises means **less grant money**, so you can
afford fewer / lower-tier parts. This is the economy behind "couldn't afford the nicest motors" (§4.0): **money
gates the *equip/upgrade* side, the §6.2 quiz gates the *knowledge/unlock* side.** Knowledge unlocks the OPTION;
grant money lets you actually field the better-tier version (a stronger power source → the speed/damage bonus, a
premium weapon tier, more ally support).

**Grading the essay** stays low-friction and encouraging — it's writing *practice*, not a pass/fail gate. Award
money for **effort/length + hitting a couple of keywords** (safety, budget, outreach, sustainability…); skipping =
$0 from that exercise (you still progress). Store `career.money`; spend it in the workshop alongside the quiz
unlocks, and feed it to the recap ("…wrote every grant and rolled in on premium motors" vs "…skipped the essays,
ran it lean"). **Open Q for Sam:** auto-grade by keywords/length, or pure participation ("you wrote something →
grant awarded")?

---

## 7. Phased build plan

Each phase is **independently shippable** (a green `./battery.sh`) and listed in dependency order. For
each: key functions to add + integration points (file = the single HTML `<script>`; line anchors are
v5.1.251).

### Phase ① — Career shell: state + storage + HUB + the CYOA BEAT screen
*Goal: a NEW/CONTINUE front door, a hub, and a working choose-your-own-adventure beat screen (text + 2–3
choices). NO matches yet — the `goto:'stage:…'` just stubs/logs.*
- **Add:** `let career=null;` (near 5997), `let careerSave=…` loader + `careerStore()` (near 284),
  `careerNew()` (init §4.2), the `CAREER_STAGES` table (near 5972) and `CAREER_BEATS` map (§4.1).
- **Add phases** `'p2career'` (+ `drawCareerHub` / `careerHubClick`) and `'p2cbeat'` (+ shared
  `drawCareerBeat` / `careerBeatClick`). `careerBeatClick` evaluates a choice's `when`, applies `effect`,
  and follows `goto`/`then` (beat→beat; `stage:` stubbed this phase).
- **Integrate:** splash gets a CAREER tile (~978/994); `draw()` dispatch gets `p2career`/`p2cbeat`
  branches (alongside the tour branches); click dispatcher routes them (alongside the `p2t*` route).
- **Tests:** new smoke — `careerNew()` shape; `careerStore`/load round-trip through a stubbed localStorage
  (as the map-editor/ach tests do); a beat renders; choosing a choice advances `career.node` and records
  it in `career.choices`; a `when`-gated choice hides when its condition is false.

### Phase ② — Stage 1 = TANK end-to-end (the hook), win/loss both advance
*Goal: from the hub/intro beat, get coached on TANK, play a real `tankfight` match, and land on the next
beat whether you win or lose.*
- **Add:** `startCareerMatch(stageId)` (§5.2), `careerSetDrive()` (wraps `p2cSetDrive`/`DGROUPS`),
  `careerTier()` (§3.2 — fixed at this phase; adaptive in ④). Wire `goto:'stage:tank_hook'` to call
  `startCareerMatch('tank_hook')`.
- **Coaching:** the `coach:C1` card ("tank drive: left stick = left track…") shows before the match;
  mark `career.taught.push('C1')`.
- **Integrate:** `startCareerMatch` sets `m2.mode='tankfight'`, drive-locks `tank`, claim = human vs cpu,
  calls `startP2Tank()` (line 3339).
- **Tests:** smoke — `careerNew` → follow `intro` → `stage:tank_hook` → assert `phase==='p2tank'`, `tf2`
  exists, `m2.drive[0]` is tank, `m2.claim[1].type==='cpu'`.

### Phase ③ — Wire match-end → next beat (the router)
*Goal: finishing the tank match (win OR loss) routes to the right `after:tank_hook` fork.*
- **Add:** `careerMatchEnd(side)` (§5.1), `careerNextNode(stageId)`, `careerGrantUnlock()` (push into
  `career.unlocks`), `careerStageUnlock()`.
- **Integrate:** `drawP2Nav` (3976) gets a `if(career&&career.active)` branch → "▶ CONTINUE STORY";
  `p2NavClick` (4003) reads `w` (the existing **line-4009** expression) and calls `careerMatchEnd(w)` for
  BOTH win and loss (and `'draw'`).
- **Tests:** smoke — simulate `tf2.result=0` (win) and `=1` (loss); BOTH push `tank_hook` to
  `career.cleared` and set `phase==='p2cbeat'`; `career.flags.lastResult` differs; round-trips via
  `careerStore`.

### Phase ④ — Adaptive difficulty (skill rating → tier; story nudge)
*Goal: difficulty + story tone respond to performance.*
- **Add:** the §3 skill update inside `careerMatchEnd` (perf from result + `careerDominance`/
  `careerCloseness`); make `careerTier()` read `career.skill`; set `career.flags.lastResult` for beats.
- **Integrate:** the per-mode margin readers (race time gap, `bb2` HP remaining, ball goal diff) feed
  `careerDominance`/`careerCloseness`; `BB_TIER_DMG` (2249) gives the capstone its free damage ramp.
- **Tests:** smoke — a string of wins raises `skill` and bumps `careerTier()`; a blowout loss lowers it;
  `skill` clamps to [0,4]; a dominant result sets `lastResult==='dominated'` and a `when:{flag…}` choice
  appears.

### Phase ⑤ — Remaining stages + their drive-concept teaching beats
*Goal: the full curriculum C2→C7 playable, each stage launching the right mode + drive + coaching card.*
- **Mostly DATA:** add the `CAREER_STAGES` rows (arcade_course, strafe_intro, field_centric, holo_shooter,
  heading_advanced, capstone_rumble, optional steer_detour) and their `coach:C#` + `after:<stage>` beats.
  `startCareerMatch`'s switch already routes every mode.
- **Integrate:** verify per-mode `m2.set` is sane for each stage (ball `format`, RoboRumble
  `bbmode:'ko'`, lives); the C4 field-centric stage relies on `careerSetDrive` auto-coupling absolute
  heading (via `p2cSetDrive`→`absHeadingCouple`); the C6 stage pre-sets `absHeading` to demo rel-vs-abs.
- **Tests:** extend the smoke to walk the whole curriculum to the finale (assert mode + taught concept +
  drive per stage; `career.taught` contains C1..C6; final node is the finale beat).

### Phase ⑥ — Branching/choices depth + unlocks + polish
*Goal: the CYOA forks feel meaningful; unlocks land; a finale + achievement; coaching self-skips on
replay.*
- **Add:** the optional `steer_detour` fork + any flex choices gated on `dominated`; `careerGrantUnlock`
  populates `unlocks.{drives,bbWeapons,bbArmor,bbPerks,paints}` and the capstone seeds `m2.bbLoadout`; a
  finale beat + an `ACH_DEFS` entry (e.g. `{id:'careerwin', name:'First Driver'}`) fired via
  `achUnlock('careerwin')` (line 298, self-guards); coaching cards skip when the concept is in
  `career.taught` (a SKIP button + remember).
- **Integrate:** outro/finale reveals unlocks with the achievement-toast flourish (`drawAchToast`, line
  8229); the hub shows concepts learned + current skill + stages cleared.
- **Tests:** beats/forks render; a gated choice appears only under its condition; the achievement fires
  once (idempotent); SKIP marks the concept taught.

### Phase ⑦ — In-game modifiers, multiple endings + the personalized RECAP
*Goal: choices carry mild gameplay weight; the journey ends on a generated "your story" summary.*
- **Add:** `career.mods` applied in `startCareerMatch` with save/restore around the match (the `tour._qsave`
  pattern) — a few authored modifiers (late-night build → +HP / a free perk; budget motors → a SENS cap; etc.);
  `career.log` appended in `careerMatchEnd` and at each choice; a small set (~3–5) of **endings** chosen by
  flags + performance; `careerRecap()` + the `'p2crecap'` finale screen that narrates the run (§4.4).
- **Integrate:** the finale routes the skill arc + choices + mods + which ending into the recap lines; the recap
  reveals unlocks + fires the achievement.
- **Tests:** a modifier changes the next match's setup then RESTORES (never leaks to free-play); `careerRecap()`
  produces ending-appropriate lines from a mocked `career.log`/flags; every ending is reachable from its conditions.

---

## 8. Narrative tone samples

Fun, FRC-robotics-flavored, lightly self-aware (matching the in-game voice — "push the rear, guard your
front", "Autobots, Roll Out"). Coaching beats teach for real; story beats branch.

**Sample 1 — the HOOK (stage-1 intro, `kind:'story'`):**
> **FIRST DRIVE**
> Someone shoves a controller into your hands and points at a squat little robot.
> "It's a tank. Left stick runs the left track, right stick runs the right track. Both up = forward.
> One up, one down = spin. That's the whole manual. Go win."
> There's another bot across the field. It does not look friendly.
> — ▶ Drive the tank
> — ▶ Wait, how do tracks even work? *(→ a 10-second coaching card, then drive)*

**Sample 2 — a COACHING beat (`kind:'coach'`, concept C6 — the advanced heading lesson):**
> **HEADING: TURN-SPEED vs POINT-TO-FACE**
> Your right stick can mean two different things.
> **Relative (default):** how far you push = how *fast* you spin. Like steering with a throttle.
> **Absolute:** the *direction* you push the stick = the direction the robot snaps to face. Point the
> stick north, the bot turns north and holds it. Twin-stick shooter energy.
> Field-centric quietly switched you to Absolute back when you learned "up is always up-field." Now you
> know why. We turned it ON for this fight — flick it back anytime with the toggle.
> — ▶ Let's aim something

**Sample 3 — a POST-MATCH branch beat (`kind:'story'`, reads `flags.lastResult`):**
> **...okay, that was awesome** *(loss variant: "you got wrecked — and you were grinning")*
> You won your first duel / You ate the floor, but you learned the bot. Either way: you're a driver now.
> Where to?
> — ▶ Teach me to go FAST (an obstacle course) *(→ coach C2 arcade → race)*
> — ▶ Wait — can these things move SIDEWAYS? *(→ coach C3 strafe → race/ball)*
> — ▶ *[only if you DOMINATED]* Hot shot, huh? Try driving like a CAR. *(→ coach C7 steer → detour)*

---

## 9. Risks / open questions for Sam

Resolved by the reframe (dropped): the school-grade structure; one-mode-per-grade ordering; win-gated
progression. New/carried-forward:

1. **How many stages total?** §2.3 lists 7 core + 1 optional detour. More = more thorough tutorial + more
   story; fewer = snappier. Lock a count before Phase ⑤.
2. **How heavy is the branching?** Plan keeps it modest (a near-linear graph with a couple of forks + one
   detour, all condition-gated). Want richer branching (multiple endings, more detours), or even leaner?
3. **Can a stage be replayed?** Plan lets you re-enter a cleared stage from the hub (coaching auto-skips
   via `career.taught`). Confirm — and whether replay re-rolls the adaptive tier or pins it.
4. **Is the tutorial skippable for veterans?** Likely yes — a "I know how to drive, take me to free-play"
   option on the hub, or a per-concept skip. Confirm the shape.
5. **Do free-play unlocks tie in?** Plan keeps free-play fully open; career unlocks are additive
   trophies/cosmetics + seed the capstone loadout. If you'd rather free-play *gate* behind career, that's
   a bigger, more controversial change — say the word.
6. **Adaptive aggressiveness:** `STEP=1.2`, start `skill=0.5`. Should a single great run be able to jump
   you ~half a tier (current), or should it move slower/faster? Should it ever *cap* below CHAMPION?
7. **Drive-lock vs free pick per stage:** plan locks the taught drive so the lesson lands. Want a "you can
   override the drive" escape hatch on coaching cards (more agency, risks muddying the lesson)?
8. **One save vs slots?** Default one (`frcds_career_v1`). Slots = wrap in an array later (self-contained
   per-campaign shape makes this easy).
9. **Map variety:** force themed arenas per stage (career flavor) or use defaults/RANDOM? `bbMapObj`
   already resolves per-match maps if we want themed fields.
10. **Splash placement:** CAREER as a third top-level tile next to SINGLE/MULTIPLAYER, or nested under
    SINGLE PLAYER? Plan assumes a peer tile.

---

## 10. Why this is low-risk to build

- **Zero new engine systems.** Every match runs in an existing phase via an existing start function; the
  result is read by the existing line-4009 expression; the meta-shell is a near-copy of `tour*`.
- **Additive only.** A null `career`/empty `unlocks` means free-play behaves exactly as today.
- **Data-driven.** Stages, beats, choices, and unlocks are tables/maps — most "more content" is editing
  data, not code, so each increment is a small, green diff.
- **Reuses persistence + achievements + tiers + drive-coupling + loadouts verbatim** — it inherits their
  tests and conventions (the `frcds_*` JSON pattern, `achUnlock` idempotency, `modeTiers()` routing,
  `p2cSetDrive`/`absHeadingCouple` coupling, `saveBBLoadout`).
- **The tutorial leans on systems the game already explains itself** — e.g. field-centric already
  auto-couples absolute heading (`driveFieldCentric`/`absHeadingCouple`), so the C4→C6 lesson is teaching
  a behavior the engine already implements, not new mechanics.

---

### Appendix: key code anchors (drive_showdown_v5.1.251.html)

| What | Line | Use in career |
|---|---|---|
| `phase` declared (`'splash'`) | 155 | add `p2career` / `p2cbeat` |
| splash SINGLE/MULTIPLAYER split (draw ~978 / click ~994) | ~978/994 | add the CAREER tile + click |
| **DRIVE CATALOG** `DRIVES` / `HOLO_DRIVES` / `STEER_DRIVES` | 87 / 98 / 113 | the C1–C7 curriculum drives |
| `tank` / `arcade` (C1/C2) | 88 / 90 | hook + point-and-go lessons |
| `botSwerve` / `fieldSwerve` (C3/C4) | 92 / 94 | strafe + bot-vs-field lessons |
| `driveFieldCentric(d)` (frame test) | 164 | the literal "is this field-centric?" check |
| `absHeading` + `toggleAbsHeading` | 162 / 163 | C6 relative-vs-absolute heading |
| `absHeadingCouple` / `absHeadingVr` | 170 / 172 | auto-couple + the snap-to-angle math |
| `DGROUPS` (drive groups) + `p2cSetDrive` | 6690 / 6694 | resolve a drive id → `m2.drive` (auto-couples heading) |
| `CPU_TIERS` (+ per-mode clones) | 2232 (2245–2248) | adaptive tier target |
| `modeTiers()` (per-mode tier routing) | 2253 | picks the right tier table per mode |
| `BB_TIER_DMG` | 2249 | capstone damage ramp (free) |
| `m2.claim` cpu shape `{type,tier}` | ~2557 | career CPU claim |
| `M2_MODES` (mode ids + colors) | 5972 | model `CAREER_STAGES` near here; mode ids match |
| `M2_SET_DEFAULTS` / `m2.set` | 5986 | per-stage match config |
| `startP2Ball` | 2559 | stages: `normal` / `shooter` (reads `m2.mode`) |
| `startP2Tank` | 3339 | stage 1 (the TANK hook) + C6 stage |
| `startP2BB` | 4331 | capstone RoboRumble stage |
| `startP2Race` | 5869 | arcade / strafe / steer course stages |
| `drawP2Nav` (CONTINUE button) | 3976 | add the "CONTINUE STORY" branch |
| `p2NavClick` (result read `w`) | 4003 / **4009** | call `careerMatchEnd(w)` on win OR loss |
| `tourMatchEnd` (result→advance) | 6172 | template for `careerMatchEnd` |
| `tour` state declared | 5997 | template for `career` global |
| `drawTourBracket` | 6360 | template for the career hub layout |
| tournament click route (in dispatcher) | ~6628 nbhd | add the career click route |
| `p2Chrome(title,sub)` | 6851 | header/ESC chrome for all career screens |
| achievements `ACH_DEFS` / `achUnlock` | 267 / 298 | `careerwin` achievement |
| `frcds_ach_v1` load + `achSave` | 284 / 296 | storage pattern to copy |
| custom-map storage `frcds_maps_v1` | 4859 / 4860 | storage pattern to copy |
| loadout `frcds_bbload_v1` save/load | 6714 / 6715 | seed capstone loadout from unlocks |
| `BB_WEAPONS` / `BB_ARMOR` / `BB_PERKS` | 4039 / 4054 / 4150 | RoboRumble unlocks |
| armory chips `BB_ARMORY_W/A` / `BB_PERKS_PICK` | 4118 / 4119 / 4162 | career-aware armory pool |
| `PAINT_JOBS` | 4473 | cosmetic unlocks / campaign livery |
| `drawAchToast` (toast style) | 8229 | unlock-reveal flourish |
