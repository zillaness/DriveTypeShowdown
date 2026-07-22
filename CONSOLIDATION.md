<!-- Copyright (C) 2026 Projects and Mods -->
<!-- GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE. -->

# Repo consolidation — status & the steps only you can do

_Last updated: 2026-07-07. Repo: `github.com/zillaness/DriveTypeShowdown`._

This captures the branch cleanup so it's ready when you're at the GitHub UI. It
exists because the sandbox's git proxy **rejects all destructive git operations**
(branch deletion, tag pushes, force pushes, default-branch changes all return
HTTP 403 — only additive pushes work), and the GitHub MCP has no Pages / repo-
settings tool. So the items in **§3** must be done by you via the GitHub website
(or a local terminal with a full-access token).

## 1. What was done (from the sandbox)
- **`main` created** from `dev` (identical; `dev` held the latest, v6.5.2). `main`
  is intended as the new canonical / default + the GitHub Pages source.
- **`legacy-sp-portrait` created** at the repo's root commit `bc6304b`
  (`frc_drive_showdown_v5.0.1.html`, the earliest build in git). See §4.
- **Licensing, README, GitHub Pages files, and the `/adversarial-ml/` AI lab**
  landed on `dev` + `main` (see the main `README.md` / `CLAUDE.md`).

## 2. Branch inventory (unique commits **not** in `main`)
| Branch | Unique commits | Disposition | Why |
|---|---:|---|---|
| `dev` | — | **keep** | canonical (mirror of `main`) |
| `main` | — | **keep (make default)** | new canonical + Pages source |
| `legacy-sp-portrait` | 1 | **keep** | earliest-build rollback point (§4) |
| `claude/adversarial-ml-game-player-skmsth` | 157 | **keep — excluded** | the AI-lab branch; you said leave it out of the merge |
| `claude/eager-sagan-5wehy1` | **145** | **keep** | old revisions NOT in `main` — real history |
| `claude/epic-tesla-754ri8` | **121** | **keep** | old revisions NOT in `main` — real history |
| `claude/online-net-5wehy1` | **137** | **keep** | the online-multiplayer sandbox (tabled, but unique code) |
| `claude/dreamy-johnson-ybnqwi` | **57** | **keep** | diverged old work NOT in `main` |
| `claude/inspiring-turing-a8yfss` | 0 | **delete** | fully merged into `main` — nothing lost |
| `claude/pensive-brown-molvpy` | 0 | **delete** | fully merged into `main` — nothing lost |
| `claude/driveshowdown-migration-handoff-adwla2` | 0 | **delete after this session** | this session's mirror of `main` |

> ⚠️ **Correction to the old docs.** `MIGRATION.md`/`CLAUDE.md` claimed `dev`
> losslessly *superseded* `eager-sagan`/`epic-tesla`/etc. That is **false** — each
> holds 100+ commits that are **not** reachable from `main`. Deleting them WOULD
> lose history. Only the three `0-unique` branches are safe to delete.

## 3. Do these in the GitHub UI (Settings)
1. **Set the default branch → `main`.** Settings → *Branches* → switch default from
   the old `claude/eager-sagan-5wehy1` to `main`.
2. **Enable GitHub Pages.** Settings → *Pages* → Build and deployment →
   Source = *Deploy from a branch*, Branch = **`main`**, folder = **`/ (root)`** → Save.
   - Game: **https://zillaness.github.io/DriveTypeShowdown/**
   - AI lab: **https://zillaness.github.io/DriveTypeShowdown/adversarial-ml/**
3. **Delete only the three fully-merged branches** (0 unique commits):
   `claude/inspiring-turing-a8yfss`, `claude/pensive-brown-molvpy`, and
   `claude/driveshowdown-migration-handoff-adwla2` (this one only after the current
   session ends). Do it in Settings/branches or:
   ```sh
   git push origin --delete claude/inspiring-turing-a8yfss claude/pensive-brown-molvpy
   # after this session ends:
   git push origin --delete claude/driveshowdown-migration-handoff-adwla2
   ```
   **Do NOT delete** eager-sagan / epic-tesla / online-net / dreamy-johnson
   (unique history), adversarial-ml (excluded), or legacy-sp-portrait.

### Optional — tidy naming for the kept history branches
If you want the kept-but-stale branches to read as archives without losing them,
rename each (this preserves every commit; the sandbox can't do it, but you can):
```sh
git branch -m claude/eager-sagan-5wehy1 archive/eager-sagan     # etc.
git push origin archive/eager-sagan && git push origin --delete claude/eager-sagan-5wehy1
```
Or leave them as-is — they're harmless.

## 4. About `legacy-sp-portrait` (the "portrait single-player" ask)
You wanted a branch that stops at the classic portrait single-player game. Two
findings:
- **No truly pre-multiplayer build exists in git.** The pure SP portrait era
  (versions ~v1–v2.2) predates this repository and survives only as changelog
  prose inside the HTML. The **earliest commit** (`bc6304b`, v5.0.1) already ships
  the full 1v1 two-player family. `legacy-sp-portrait` points there — it's the
  earliest, least-multiplayer snapshot git can offer.
- **The portrait SP game was never removed.** It's still the default layout
  (`curLayout='legacy'`, 400×720) in *every* build, including today's v6.5.2 — so
  you can already play it without any rollback. A "SP-only, no multiplayer UI"
  build doesn't exist anywhere and would have to be *constructed* (strip the 2P/
  mode code out), not checked out.

## 5. Preserving all old revisions
Every historical game version is preserved because its commit is reachable from a
kept branch (mostly `eager-sagan`/`epic-tesla`, plus `main`'s own history). Nothing
in §3 deletes a unique commit. If you later want quick rollback tags per version,
those must be pushed from a full-access terminal (the sandbox proxy blocks tag
pushes).
