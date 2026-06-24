# Combat ideas — spec & log (2026-06-24)

Four RoboRumble combat features Sam raised in playtest.

> **STATUS UPDATE — ALL FOUR BUILT:** #1 GIVE-UP (v5.1.288), #2 PARTING-GIFT BUFF
> (v5.1.287, delayed-fuse; + v5.1.293 defers match-end so a fused bomb can still
> DRAW), #3 PINCER ESCAPE (v5.1.291, damage-to-break grip + soft cap, gated behind
> EXPERIMENTAL FEATURES per the recommendation below), #4 RESPAWN DELAY (v5.1.286,
> mode-aware: objective inf-life modes use the longer `BB_RESPAWN_OBJ`). See those
> changelog entries for final tuning. The original spec text is kept below as the
> design record.

Captured here with current-behavior refs + a buildable design + tuning + tests so
any thread can pick one up cleanly.

Code refs are against `drive_showdown_v5.1.282.html` (extract with `./extract.sh`).

---

## 1. GIVE-UP button (press-and-hold to concede when disabled) — NOT mainline yet

**Sam:** "a give-up button for when you're in an infinite-lives mode, disabled,
mobility gone, can't move any more. Press and hold to give up. And maybe you blow
up too, like a parting-gift explosion? Unsure if that kills the advantage the
other team gets from disabling you. Do you already get counted out if you don't
move for long enough?" → **Sam: don't implement as a mainline feature yet.**

**Answer to the embedded question — the count-out:** YES there is a stalemate
count-out (`updateBB`, ~line 5472; `BB.countOut = 6s`), **but it only fires when
the *enemy* side has no mobile bot left** (`if(b.mob<=0 && !sideMobile[1-b.side])`).
So in the exact scenario Sam describes — you're disabled (mob 0) but the enemy can
still move — you are **NOT** counted out. You sit there indefinitely until an
enemy finishes you (or, in inf-lives/timed, until the clock runs out). That dead
time with no agency is the gap this feature fills.

**Why it matters:** in an inf-lives game (deathmatch / timed / push-ball) a
mobility-killed bot is a sitting duck with nothing to do and no way to respawn
faster. A concede lets the player skip the dead time and get their next life.

### Proposed design
- **Trigger:** hold FIRE (or a dedicated bind) for `giveUpHold` (~1.2s) while
  **immobilized** (`b.mob<=0`) **and** in an **infinite-lives** mode
  (`bbInfLives()`), human-controlled bot only. A radial "GIVE UP" meter fills
  around the bot (reuse the count-out ⚠ HUD slot / a ring like the LAST STAND
  aura). Releasing early cancels.
- **On confirm:** `bbKill(b, null)` — same path as a normal death, so it respawns
  on the inf-lives timer and credits no kill to the enemy (owner=null). This is
  the key call to make sure it does NOT hand the enemy a kill credit (see the
  "advantage" question below).
- **Optional boom (Sam's "maybe you blow up"):** spawn a parting-gift-style blast
  on concede so giving up isn't purely passive — a small area-denial nudge that
  lets you trade your disabled hull for some space. Gate behind whether the bot
  has the PARTING GIFT perk, OR always-on but weaker than a real parting gift.
  See feature #2 — ideally share the blast helper.

### The "does this kill the disabling team's advantage?" question (Sam's worry)
Disabling a foe in an inf-lives mode currently earns the attacker: (a) a free,
defenseless target to farm for a **kill** (deathmatch scoring), and (b) map
control while the foe is helpless. A give-up that **denies the kill credit**
(owner=null) removes (a) — which may be too generous to the victim (you escape a
deserved kill by conceding). Options to keep it fair:
- **A — concede = a kill for the last attacker.** Track `b._lastHitBy` (the most
  recent enemy to damage it within ~5s); concede credits that bot the kill. The
  enemy keeps their reward; the victim only saves *time*, not the death. **(Recommended
  — preserves the disabling advantage, just skips the dead-air.)**
- **B — concede costs an *extra* life / a respawn-timer penalty.** You get agency
  back but pay for the early out.
- **C — concede is free (owner=null), but only allowed after a grace** (~4–5s
  immobilized) so the enemy gets a window to farm the kill first.
- Decision is Sam's; lean A.

### Tuning (`BB_W` or a small const)
`giveUpHold:1.2` (hold seconds) · concede-boom radius/damage = reuse parting (#2)
or a weaker fixed `giveUpBoomRK/Dmg`.

### Edge cases / tests
- Only offered when `bbInfLives()` AND `b.mob<=0` AND human. (Finite-lives: a
  concede = throwing the match; out of scope.)
- Cancels if mobility is restored (repair/medic) before the hold completes.
- Headless: immobilize a human bot in a timed match, hold fire `giveUpHold`,
  assert it dies + respawns + (per chosen rule) the kill credit.
- Render: the give-up ring draws without throwing (mock-canvas `drawBB()`).

---

## 2. PARTING GIFT buff — more powerful + telegraphed + maybe a mine — NOT yet

**Sam:** "parting gift isn't effective enough. Maybe it needs to be more
powerful, larger range, but give people time to run away. Maybe it drops a mine,
like the new MINELAYER in experimental mode." → **spec & log, don't implement.**

### Current behavior (`bbKill`, ~line 4447)
On death, if `perk==='partinggift'`: an **instant** gold blast — `partingRK 6.0`
(radius ×RR), `partingDmg 480` with distance falloff (min 0.6), applied
immediately to all enemies in radius (FF-aware). **No telegraph** — enemies
already next to you eat it with no chance to react, but anyone a step away is
already safe, so it rewards proximity-at-death rather than zoning. It also feels
weak because it's a one-frame instant hit, not an area you must clear.

### Proposed design — pick one (or combine)
**Option A — DELAYED FUSE (telegraphed boom).** On death, drop an armed charge at
the death spot that detonates after `partingFuse` (~1.2–1.6s) with a **growing
warning ring** (reuse the KAMIKAZE shockwave FX `{kami:true}` / the mine ARMED
blink). Bigger radius (`partingRK 6 → ~8`) and/or higher damage, but the delay
**gives foes time to run** (Sam's ask) — it becomes **area denial** (zoning the
spot where you died) instead of a guaranteed proximity nuke. Cleanest, most on-
brief. Implementation: push a pending-blast onto a new `bb2.partings[]` list
updated in `updateBB` (mirror `bbMinesUpdate`); detonate via the existing blast +
`bbApplyHit`/`bbKill` chain.

**Option B — DROP A MINE (Sam's MINELAYER idea).** On death, drop one armed
proximity MINE at the death spot (reuse `bbMines()` + `bbMinesUpdate` wholesale —
arm delay, enemy-trip, AoE blast, ally-safe, fizzle). The corpse leaves a hazard
foes must avoid/clear. Naturally "gives time to run" (it only blows when someone
trips it) and reuses shipped code. Could even drop a small **field** (2–3 mines)
for a stronger version. **Note:** the MINELAYER is currently behind the
EXPERIMENTAL BOTS gate (`expBots`); a parting-gift-drops-a-mine perk would surface
mine behavior in mainline play — confirm that's desired, or keep it experimental-
gated too.

**Option C — just bigger + knockback.** Keep it instant but widen radius + add a
real shove (ring-out potential), accept it stays a proximity nuke. Lowest effort,
doesn't address "time to run away."

**Recommendation:** A (delayed fuse, telegraphed, bigger) as the default buff —
it directly answers "more powerful, larger range, but give time to run." Offer B
as a separate perk variant / experimental ("DEATH MINE") if Sam likes the mine
flavor.

### Tuning (`BB_W`)
A: `partingFuse:1.4, partingRK:8.0, partingDmg:520 (falloff), partingKnock:~12`.
B: reuse `mine*` consts; `partingMines:1` (count).

### Tests
- A: on a perk death, a pending blast exists, does NOT damage immediately, and
  detonates after the fuse (a foe that left the radius during the fuse is spared;
  one still inside is hit). B: a mine is dropped on death, arms, enemy trips it.
- Balance: parting gift is a PERK (not in the weapon sim); confirm no CPU-roll /
  balance-sim drift. Render: blast/fuse ring + mine draw no-throw.

---

## 3. PINCER escape — struggle / damage-to-release; pincer-vs-pincer — NOT yet

**Sam:** "How does a pincer counter a pincer pinning them? Should they be able to
grab each other? They can't currently — so they can't make the pincer let go by
damaging them. Maybe we need to revisit struggling or damage to get the pincer to
let go." → offer suggestions; spec & log, don't implement.

### Current behavior
- **Clamp** (`bbGrabUpdate`, ~line 4897): a PINCER holds **as long as the trigger
  is held** — no forced timer (removed v5.1.198). The holder lets go only by
  releasing fire (its *choice*).
- **Intended counter — FIGHT BACK** (~line 4896): a held captive that **turns to
  face the captor and fires** grinds it down (`heldFightDps 40`). The idea: make
  holding *risky* so the holder *wants* to let go. **But** a **CPU** holder keeps
  firing (its pincer brain fires while a foe is in range, and the captive is in
  range) → **a CPU never voluntarily releases**, so vs a CPU the fight-back is an
  attrition race, not an escape.
- **Reliable counter — RESCUE** (~line 5416): a **different** enemy bashing the
  captor frees the captive. Only exists in team modes (needs a 3rd bot); useless
  in 1v1.
- **Pincer-vs-pincer:** a **held** bot can't initiate a grab — every grab path
  requires `!attacker.held` / `!victim.held` (lines ~4799, ~5427). So the pinned
  pincer **cannot clamp back**. Whoever clamps first locks the other out.
- **Damage does NOT force release.** `pincerGripDR 0.3` even *reduces* damage the
  captive takes while clamped, so chipping the captor is slow and never pops the
  grip. Confirmed: you can't "make the pincer let go by damaging them."

### Suggestions (Sam asked for these)
1. **Grip-integrity → damage-to-break (Recommended).** Give the clamp a grip
   meter (`grabGrip`, e.g. 100). Damage dealt to the **captor** (the captive's
   fight-back, an ally's hits, hazards) drains it; at 0 the clamp **pops**,
   releasing the captive + a brief `grabCd` on the captor (can't immediately
   re-clamp). Tune so a focused captive breaks free in ~2–3s. Directly answers
   "make the pincer let go by damaging them," and crucially **works vs CPU** (no
   reliance on the holder choosing to release). For **pincer-vs-pincer**, the
   pinned pincer firing its own pincer counts as the fight-back attack that chews
   the grip — no need to actually grab back. Draw a shrinking grip ring on the
   captor.
2. **Struggle / mash-to-break.** The captive builds a struggle meter by mashing
   fire / dash / wiggling the stick; at threshold the clamp breaks. Fun + skill-
   based for humans; needs a CPU "struggle" analog (auto-builds over time). Pairs
   well with #1 (struggle + damage both feed the same break meter).
3. **Let pincers grab each other (mutual lock).** Allow a held bot to also clamp
   its captor → a two-way lock both must struggle/break out of. More complex (the
   two "glue to my front" positions fight each other — needs a shared midpoint),
   but it's the literal answer to "should they be able to grab each other?"
4. **Soft clamp cap.** Re-introduce a max clamp duration (~2.5–3s) after which the
   grip auto-weakens and releases — a simple anti-lock backstop, esp. vs CPU.
   Lowest effort; combine with #1 as a ceiling.

**Recommendation:** #1 (damage-to-break grip) + #4 (soft cap as a ceiling). It
makes damage *mean something* against a clamp, fixes the CPU-never-releases
problem, gives pincer-vs-pincer a real interaction (out-grind the grip), and
needs no new two-way-glue physics. #2 (struggle) is a nice human-feel addition on
top. Hold #3 unless Sam specifically wants mutual grabs.

### Tuning (`BB_W`)
`grabGrip:100, gripDrainPerDmg:1.0, grabCdOnBreak:~1.0` (+ optional
`clampMaxT:3.0` soft cap). Keep `pincerGripDR 0.3` but consider raising it
slightly if damage now also breaks the grip (so the captive doesn't both survive
*and* escape too easily).

### Tests
- Captive fight-back drains the grip to 0 → auto-release + captor grabCd set.
- Pincer-vs-pincer: pinned pincer firing breaks the grip in ~2–3s (vs a CPU
  holder that never releases on its own today).
- Soft cap: a clamp with no fight-back still releases by `clampMaxT`.
- Render no-throw with the grip ring drawn.

---

## 4. RESPAWN DELAY / death penalty in objective inf-life modes — NOT yet

**Sam:** "In some infinite-life modes — push-ball, CTF — respawn should take you
out longer. Respawning too soon makes it too easy to rejoin the fight with fresh
health. Death needs to be punished competitively." → spec & log, don't implement.

### Current behavior (`bbModeUpdate` respawn block, ~line 5186)
**Every** mode respawns a KO'd bot after a **flat `BB_STOCK_DELAY = 1.2s`**
(line 5187) — including the objective inf-life modes (push-ball, CTF, domination,
KOTH) and deathmatch. So a killed bot is back in the fight in ~1.2s at full HP +
mobility + fresh wheels (line 5188 resets all of it). There is **no extra cost to
dying** in an objective mode — you can int into a fight, die, and be back almost
immediately, which (as Sam says) makes death not matter competitively. (Tank Fight
has the same shape: `tf2Respawn` is effectively immediate, ~line 3468/3747.)

### Proposed design
Replace the flat constant at the respawn site with a small helper
`bbRespawnDelay(b)` so the delay can vary by **mode** and (optionally) by **how
many times this bot has died**:

**Option A — mode-based base (Recommended, simplest).** Objective inf-life modes
get a longer base respawn than deathmatch/elimination:
- deathmatch / STOCK / elimination: keep `1.2s` (kill-race feel; fast is fine).
- push-ball / CTF / domination / KOTH: `respawnObjective` ~`4–5s` — long enough
  that a death cedes real tempo (the enemy gets a push / a flag run / point time
  while you're out), so trading your life for nothing is punished.

**Option B — escalating per-death (MOBA/Overwatch-style).** Each death raises your
own respawn timer: `base + perDeath * b.deaths`, capped (e.g. `1.2 + 1.5×deaths`,
cap ~8s). Punishes *repeated* feeding harder than the first death and naturally
helps a losing team's killer snowball — but can feel bad / runaway; gate to
objective modes and cap conservatively. Needs a per-bot `deaths` counter
(`bbKill` already credits `kills`; add the symmetric `victim.deaths++`).

**Option C — penalized respawn instead of (or with) a delay.** Respawn at reduced
HP, or farther from the objective, or with a brief speed debuff. More mechanics,
more to tune; A/B are cleaner and read more clearly to the player.

**Recommendation:** A as the baseline (mode-aware longer respawn for objective
modes), with B as an optional escalator if Sam wants harsher punishment for
repeat deaths. Show the respawn countdown on the dead bot's HUD panel / a "RESPAWN
IN Ns" tag so the player understands the penalty.

### Tuning (`BB_W` or consts near `BB_STOCK_DELAY`)
`respawnFast:1.2` (deathmatch/elim) · `respawnObjective:4.0` (push-ball/CTF/dom/
koth) · (B) `respawnPerDeath:1.5, respawnCap:8.0`.

### Edge cases / tests
- A killed bot in push-ball waits `respawnObjective`, not 1.2s, before returning;
  a deathmatch bot still returns in `respawnFast`.
- The respawn countdown is visible (HUD tag / panel), so the penalty is legible.
- (B) repeated deaths lengthen the timer up to the cap; counter resets per match.
- Interacts with the GIVE-UP button (#1): conceding starts this same (longer)
  respawn clock — so giving up early just removes dead-air, it doesn't refund the
  respawn penalty.
- Headless: KO a bot in push-ball, assert respawnT ≈ respawnObjective; in
  deathmatch, ≈ respawnFast.

---

### Backlog status — ALL BUILT (2026-06-24 overnight)
- **TASER stun bot** — ✅ DONE v5.1.280 (experimental-gated).
- **Give-up button** (#1) — ✅ DONE v5.1.288. Kill-credit rule = **A** (concede
  credits the last attacker via `victim._lastHitBy`); small blast; respawns on the
  normal (longer, objective) clock.
- **Parting-gift buff** (#2) — ✅ DONE v5.1.287 = **A** (delayed-fuse, telegraphed,
  bigger). v5.1.293 defers the match-end so a fused bomb can still trade for a DRAW.
  (B "death mine" not taken — A answered the brief.)
- **Pincer escape** (#3) — ✅ DONE v5.1.291 = **#1 + #4** (damage-to-break grip pool
  `grabGrip` + steady decay soft-cap → pops the clamp; works vs CPU + pincer-vs-
  pincer). Gated behind EXPERIMENTAL FEATURES until Sam flips it on.
- **Respawn delay / death penalty** (#4) — ✅ DONE v5.1.286 = **A** (mode-aware
  `bbRespawnDelay()`: objective inf-life modes use `BB_RESPAWN_OBJ`=7s, others keep
  the fast `BB_STOCK_DELAY`). B (escalating per-death) not taken.

---

## 5. MINE TYPE — how the MINELAYER "changes / cycles" mines (Sam Q, 2026-06-24)

**The question:** "how does minelayer change or cycle mines?"

**Current answer: it does NOT cycle.** The three mine bots are **separate
equippable weapons**, each dropping ONE fixed kind — you choose the *type* by which
weapon you pick in the loadout (armory rail / ◀▶ cycler), not in-match:
- **MINELAYER** (`mine`) — proximity-trip → **damage** blast (`mineDmg` 150).
- **STUN-MINE** (`stunmine`) — proximity-trip → **stun + chip** (control). *(gated)*
- **TIMED MINE** (`timemine`) — **fuse**, no trip → zones a spot on a clock. *(gated)*

Within a single mine weapon, what's "dynamic" is the **drop lifecycle**, not the
type (`bbWeaponPre` drop block ~line 4888 + `bbMinesUpdate` ~line 5429):
- RT drops a mine **behind the nose** on a cooldown (`mineCd` 1.4s).
- Capped per owner at `mineMax` (4) — **over the cap the OLDEST mine disarms** (so
  you can't flood the arena). That's the only "cycling" today: old → new.
- Each mine **arms** after `mineArm` (0.7s, so you drive clear), then trips
  (proximity, `mineTrigK`) or detonates on its `fuse` (timed); unused proximity
  mines **fizzle** at end of `mineLife` (14s).

### If Sam wants an actual in-match mine SWITCH (spec — not built)
Two ways to let ONE "MINELAYER" adapt its mine type:
- **A — pre-match TYPE sub-pick (recommended, simplest).** Collapse the three into
  one MINELAYER weapon with a **mine-type chip** chosen in the loadout
  (DAMAGE / STUN / TIMED), stored on `ld` (e.g. `ld.mineType`). No new in-match
  input, no HUD; the bot just lays the type you set. Cleaner roster (one "mine
  bot" instead of three) — but you commit to one type for the match.
- **B — in-match cycle.** Tap a button to rotate DAMAGE→STUN→TIMED between drops,
  with a tiny HUD pill showing the armed type. More tactical (adapt mid-fight) but
  **needs a free input** — RT is fire, LT is dash; the only unused contextual one
  is the give-up dash-hold. Would likely need a double-tap / a dedicated bind, and
  a HUD indicator. Higher complexity for a niche gain.
- **Recommendation:** keep the **three separate weapons** as shipped (each reads as
  its own "bot," zero input cost), OR do **A** if Sam wants a single tidy MINELAYER
  with a type selector. Hold **B** unless he specifically wants to switch mid-match.
