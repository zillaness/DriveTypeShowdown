# CLAUDE.md — DriveShowdown

## 🪢 BRANCH POLICY — where work lives

Claude Code on the web mints a *new* auto-generated working branch for every
session (`claude/<random-words>-<id>`) and injects a per-session instruction
telling that session to develop there and to "never push to a different branch
without explicit permission." That's **platform behavior and cannot be turned
off from inside this repo.**

`dev` is the integration branch for the main game's ongoing release line (tip
currently v6.5.2 — see below) and `main` is what GitHub Pages actually serves.
There is **no requirement to consolidate every session's work onto `dev` before
ending the thread.** That requirement existed 2026-06-16 through 2026-07 as a
response to *many short-lived parallel chats* all touching the main game at
once, which scattered work across `eager-sagan`, `epic-tesla`, `jolly-hawking`,
etc. and made `dev`'s state unclear. Sessions now run fewer and longer, so:

- **Default to your session's own `claude/*` branch.** It's fine to leave work
  there as the durable record of a thread — especially for side-projects and
  tools that aren't part of the main game build (e.g. the AI Lab, which lives
  at `adversarial-ml/` on `dev`/`main` but was built and iterated on its own
  session branch for a long stretch before being promoted).
- **Merge into `dev`** — and, once verified, into `main` — when work is
  actually ready to join the main-game release line or go live at
  `zillaness.github.io/DriveTypeShowdown/`. Treat that as a deliberate
  promotion step, not an every-session chore.
- Still useful before starting main-game work: `git fetch origin dev` to see
  what's currently live, so you don't build against a stale mental model.

> History: work previously lived on `claude/eager-sagan-5wehy1` with a manual
> "push to both branches" ritual and a "stale-branch trap" warning; `dev` was
> cut 2026-06-16 to stop that scatter. The mandatory-every-session-consolidation
> rule that followed is retired as of 2026-07-25 — see this file's git history
> for the old wording if you need it.

## 🧪 FRESH-CONTAINER SETUP — run before tests

The container is ephemeral. The test harness reads an extracted copy of the game
source at `/tmp/g.js`, which does **not** exist on a fresh clone. Always run
`./extract.sh` first:

```sh
./extract.sh && ./battery.sh    # battery.sh prints "ALL GREEN" when healthy
```

Without `extract.sh`, every smoke test errors with `ENOENT … /tmp/g.js` — that is
**missing setup, not a real test failure.** (`battery.sh` now exits non-zero when a
suite actually fails, so trust its exit code once `extract.sh` has run.)

## 📍 Project context lives here

- **`MIGRATION.md`** — read first: full project state, current focus, constraints.
- **`HANDOFF_2026-06-25.md`** — LATEST thread handoff (tip **v5.1.297**, since renumbered **v6.0.0** — same build): the EXPERIMENTAL FEATURES pass (gate rename + 280→297 haul: TASER · STUN-MINE · TIMED MINE · pincer-escape · give-up · respawn-delay · parting-gift rework · arena-edge hazards→HAZARD MASTER · push-ball ∞ · career gamepad-nav · SP-menu back · real P&M logo) + a **2026-06-25 design session** (specs only, awaiting Sam): SMOKE SCREEN (perk vs bot), balloon-battle = MAIN type, and a mode-taxonomy reorg (merge ball modes + shooter toggle · **BATTLE BALL** 3v3 escort "protect your pusher", cheat-mode first · **KIDS MODE**). **Start here when resuming.**
- **`HANDOFF_2026-06-20.md`** — prior thread handoff (tip v5.1.279): Career COMPLETE, CREDITS, flame nerf + kill-race scoring, FFA fixes (270–271), pause-menu/Settings polish (272), STORY-MODE soft-lock fixes (273/278), MINELAYER (277), EXPERIMENTAL BOTS gate (279) + the full idea bank.
- **`HANDOFF_2026-06-19.md`** — prior handoff (tip v5.1.245/251): map editor (done) + the Tournament v2 locked design.
- **`OVERNIGHT_PLAN.md`** — the F1–F5 backlog + the 🏆 Tournament v2 LOCKED DESIGN block.
- **`HANDOFF_2026-06-16.md`** — the in-depth narrative (weapons / perks / easter eggs / cheats vision).
- **`CAREER_PLAN.md`** — buildable spec for the CAREER / STORY MODE (v2.0 reframe: the FUN TUTORIAL — a CYOA
  meta-shell over the existing modes, modeled on `tour*`, teaching every drive concept). **PLAYABLE end-to-end:**
  splash CAREER tile → difficulty lane → hub → story/coach/**quiz** beats → drive-locked matches (all 5 modes) →
  win/loss routing (with rematches) → finale. Shipped: v5.1.252 shell/HUB/CYOA · v5.1.253 real matches + adaptive
  difficulty · v5.1.254 the QUIZ (inlined `career/quiz_bank.js`) + the battery-chemistry→FLAMETHROWER hook ·
  v5.1.255 difficulty LANE · v5.1.256 multiple ENDINGS + RECAP · v5.1.257 curriculum quizzes · v5.1.258 lanes=CPU
  tiers · v5.1.259 Phase ⑥ (achievements/coach-skip/bonus tuning) · v5.1.260 the FINALE bracket · v5.1.261 playtest
  polish · v5.1.262 finale sequence + favor economy · v5.1.263 universal controls + solo time-trial races. **Career
  is functionally COMPLETE.** Remaining: mobile-touch polish for career matches + a live browser playtest. (All
  career logic is in one block after `let tour=null;`; the inlined question bank is `CAREER_QUIZ`; tests in
  `harness/tests/smoke83.js` — 107 asserts.)
- PRDs: `frcds_roborumble_v2_prd_v1.0.md`, `frcds_online_prd_v1.1.md`, `frcds_tournament_v2_prd_v1.0.md`.
- Build: latest is `drive_showdown_v6.5.2.html` (single self-contained HTML). **v6.0.0 = v5.1.297 renumbered (2026-07-03 VERSION EPOCH BUMP, zero code changes)** — the 5.1.x line ran ~250 ships because v5.2 was informally reserved by the online sandbox; **ONLINE MULTIPLAYER is formally TABLED** (sandbox branch `claude/online-net-5wehy1` frozen as history, its v5.2 reservation retired). **Versioning now: MAJOR = new era (online / engine rework) · MINOR = each feature pass / new mode (e.g. Battle Ball→6.1, Balloon Battle→6.2) · PATCH = per-ship within a pass.** (Overnight 2026-06-24 haul 280→297 — see `HANDOFF_2026-06-20.md` Changelog v1.9: TASER, push-ball ∞-timed, career gamepad nav, respawn delay, parting-gift buff + draw-defer, give-up button, EXPERIMENTAL FEATURES gate, pincer escape, arena-edge hazards folded into HAZARD MASTER, STUN-MINE, TIMED MINE. New specs: `SPEC_2026-06-24_balloon_battle.md`, `SPEC_2026-06-24_combat_ideas.md`.)
- Balance sim: `./extract.sh && node harness/tests/bbbalance.js /tmp/g.js`.
- **GitHub Pages:** `index.html` is a stable redirect to the current build; the game plays at `https://zillaness.github.io/DriveTypeShowdown/` and the AI lab at `/adversarial-ml/`. **RELEASE RITUAL ADDITION:** each ship must also bump the redirect target — `sed -i 's|drive_showdown_vN.html|drive_showdown_vN+1.html|g' index.html` (two references) — alongside the existing `sed` into `extract.sh`. `.nojekyll` disables Jekyll. Pages serves from **`main`** (root). **Licensing:** code = GPL-3.0-or-later WITH Commons Clause (`LICENSE`), assets = CC BY-NC-SA 4.0 (`LICENSE-ASSETS`), © Projects and Mods; source files carry a 2-line header (re-apply to the git-mv'd build file each ship).
