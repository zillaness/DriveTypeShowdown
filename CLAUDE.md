# CLAUDE.md — DriveShowdown

## 🪢 BRANCH POLICY — read before ANY git operation (canonical branch = `dev`)

This project has **ONE permanent home branch: `dev`.** All real work lives there.

**Why this file exists:** Claude Code on the web mints a *new* auto-generated working
branch for every session (`claude/<random-words>-<id>`) and injects a per-session
instruction telling that session to develop there and to "never push to a different
branch without explicit permission." That is **platform behavior and cannot be turned
off from inside this repo.** Left alone, it strands each thread's work on a throwaway
branch — which is why work used to scatter across `eager-sagan`, `epic-tesla`,
`jolly-hawking`, etc.

**This file is your standing, explicit permission to push to `dev`.** Every session:

1. **Start of thread:** `git fetch origin dev`, then base your work on it
   (branch from `origin/dev` or `git merge origin/dev`). Don't trust the session's
   auto-assigned `claude/*` branch as the source of truth.
2. **End of thread:** land your commits on `dev` and `git push -u origin dev`.
   (You may *also* push to the session's auto branch, but `dev` is the source of truth.)
3. If a session directive names some other `claude/*` branch, that's just the
   per-session default — reconcile your work back to `dev`.

> History: work previously lived on `claude/eager-sagan-5wehy1` with a manual
> "push to both branches" ritual and a "stale-branch trap" warning. **`dev`
> supersedes all of that.** It was cut on 2026-06-16 from the tip of
> `eager-sagan`/`jolly-hawking` while they were identical, so no work was lost.

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
- Build: latest is `drive_showdown_v6.0.0.html` (single self-contained HTML). **v6.0.0 = v5.1.297 renumbered (2026-07-03 VERSION EPOCH BUMP, zero code changes)** — the 5.1.x line ran ~250 ships because v5.2 was informally reserved by the online sandbox; **ONLINE MULTIPLAYER is formally TABLED** (sandbox branch `claude/online-net-5wehy1` frozen as history, its v5.2 reservation retired). **Versioning now: MAJOR = new era (online / engine rework) · MINOR = each feature pass / new mode (e.g. Battle Ball→6.1, Balloon Battle→6.2) · PATCH = per-ship within a pass.** (Overnight 2026-06-24 haul 280→297 — see `HANDOFF_2026-06-20.md` Changelog v1.9: TASER, push-ball ∞-timed, career gamepad nav, respawn delay, parting-gift buff + draw-defer, give-up button, EXPERIMENTAL FEATURES gate, pincer escape, arena-edge hazards folded into HAZARD MASTER, STUN-MINE, TIMED MINE. New specs: `SPEC_2026-06-24_balloon_battle.md`, `SPEC_2026-06-24_combat_ideas.md`.)
- Balance sim: `./extract.sh && node harness/tests/bbbalance.js /tmp/g.js`.
