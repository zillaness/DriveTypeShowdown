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
- **`HANDOFF_2026-06-19.md`** — LATEST thread handoff (tip v5.1.247): map editor (done), Tournament v2 locked design + the agreed next build. **Start here when resuming.**
- **`OVERNIGHT_PLAN.md`** — the F1–F5 backlog + the 🏆 Tournament v2 LOCKED DESIGN block.
- **`HANDOFF_2026-06-16.md`** — the in-depth narrative (weapons / perks / easter eggs / cheats vision).
- PRDs: `frcds_roborumble_v2_prd_v1.0.md`, `frcds_online_prd_v1.1.md`, `frcds_tournament_v2_prd_v1.0.md`.
- Build: latest is `drive_showdown_v5.1.247.html` (single self-contained HTML).
- Balance sim: `./extract.sh && node harness/tests/bbbalance.js /tmp/g.js`.
