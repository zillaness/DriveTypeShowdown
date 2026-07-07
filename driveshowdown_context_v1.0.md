---
file: driveshowdown_context_v1.0.md
version: 1.0
author: Samuel Cao
created: 2026-07-07
last_updated: 2026-07-07
description: Portable context export of this project for harness migration.
ai_update: Update last_updated and version. Rename file to match. Append changelog at bottom.
---

# DriveShowdown — Portable Context

## 1. Project identity
**DriveShowdown** (Drive Type Showdown) is a single-file HTML5 canvas game built for **FRC Team 2204 Rambots** by **Sam Cao**. Everything — game code, inline `<script>`, and a changelog comment block — lives in one self-contained `drive_showdown_vX.Y.Z.html` with no external assets, no build step, and no server (it works offline). It started as a teaching tool that demonstrates every FRC robot **drive type** (tank, arcade, swerve, holonomic, steering) with CPU opponents, and has grown into a multi-mode arcade game: 2P/3v3 head-to-head ball, SHOOTER, TANK FIGHT, **ROBORUMBLE** (combat), OBSTACLE RACE, a full CAREER/STORY tutorial mode, a map editor, tournaments, and a deep cheat/experimental-features layer. It's distribution-scrubbed of third-party trademarks so it can be shared publicly.

## 2. Current state
Tip is **`drive_showdown_v6.5.0.html`** on the canonical `dev` branch, full test battery **ALL GREEN**. The most recent work (2026-07-03, this session) was a version-epoch bump plus five spec'd features, each shipped as its own MINOR version and each gated so mainline behavior is byte-identical when the gate is off:
- **v6.0.0** — version epoch bump (renumber of v5.1.297, zero code changes). See §3 for the reasoning.
- **v6.1.0 — Battle Ball** (its own `BATTLE BALL` cheat toggle): RoboRumble push-ball becomes a VIP "protect your pusher" escort format.
- **v6.2.0 — Smoke Screen perk** (EXPERIMENTAL): auto panic-smoke that breaks enemy CPU targeting + auto-aim.
- **v6.3.0 — Ball-merge** (EXPERIMENTAL): NORMAL + SHOOTER fold into one BALL tile with a BALL TYPE toggle, implemented as an alias (internal mode strings unchanged).
- **v6.4.0 — Kids Mode** (EXPERIMENTAL): a no-fail simplified-ball splash mode for young children.
- **v6.5.0 — Balloon Battle** (EXPERIMENTAL): a new main mode — pop enemies' rear balloons with your front spikes; last robot standing wins. Shares the RoboRumble engine.

All five remain **gated / experimental-first** — none has been promoted to mainline yet (that's an explicit pending step, see §5/§6). CAREER mode is functionally complete. Online multiplayer is formally tabled (see §3).

## 3. Standing decisions & constraints
These are locked; don't re-open them without Sam.

- **Canonical branch is `dev`.** Claude Code on the web mints a fresh throwaway `claude/<words>-<id>` branch per session and injects an instruction to develop there — that's unavoidable platform behavior. The standing rule: start each thread from `origin/dev`, and land + push all real work to `dev` (`git push -u origin dev`). Pushing to the session branch too is fine, but `dev` is the source of truth. History reason: work used to scatter across throwaway branches (`eager-sagan`, `epic-tesla`, `jolly-hawking`) before `dev` was cut on 2026-06-16.
- **Commit author `Claude <noreply@anthropic.com>` is fine** (Sam confirmed 2026-06-16, superseding an older "must be Sam Cao" rule). No history rewrite needed.
- **Versioning scheme (set 2026-07-03): MAJOR = a new era (online, an engine rework) · MINOR = each feature pass / new mode · PATCH = per-ship within a pass.** Reasoning: the previous line sat on 5.1.x for ~250 patch bumps because the release ritual only ever incremented the patch digit, and v5.2 was informally reserved by the online sandbox. Sam wanted the version to reflect how much had actually shipped.
- **Online multiplayer is TABLED** (2026-07-03). The sandbox branch `claude/online-net-5wehy1` (build `v5.2.0`, netcode seams only) is frozen as history; its v5.2 reservation is retired. If ever resumed, it re-baselines against the then-current build — no reserved version numbers.
- **Single-file constraint is inviolable:** one HTML file, all code in one inline `<script>`, no external assets/deps/build step, works offline.
- **"When in doubt, gate behind EXPERIMENTAL FEATURES."** New/in-development features hide behind the `expFeatures` flag (a cheat-menu toggle) so the shippable build, CPU rolls, and the balance sim stay clean until a feature is proven. Gate OFF must be byte-identical to mainline. Promotion to always-visible is a separate, later, deliberate step done live with Sam.
- **FEEL-FIRST balance.** Sam hand-tunes weapon/movement feel by live playtesting. The CPU-vs-CPU balance sim (`bbbalance.js` etc.) is a coarse, jumpy *directional* tool only — do **not** chase its win-rate band unattended as a tuning target.
- **Never put the model identifier** (or any "I am running on model X" string) in a committed artifact — commits, code, comments, changelog, PRs. Chat only.
- **Don't open a PR unless Sam explicitly asks.**
- **Trademark scrub is permanent:** displayed text uses no third-party marks ("BattleBots" → "ROBORUMBLE", "Ultimate Ascent" → "DISC MODE", "FRC"/"FIRST" stripped from metadata). Internal code ids (e.g. mode id `'battlebots'`, `bb*` functions) are unchanged. Kept: "Team 2204 Rambots", rambots.org, @frc2204.

## 4. Recurring workflows
- **Fresh-container setup (always, before any test):** the container is ephemeral and the harness reads an extracted copy of the game at `/tmp/g.js` which does NOT exist on a fresh clone. Run `./extract.sh && ./battery.sh` — it must print **ALL GREEN**. An `ENOENT /tmp/g.js` error is missing setup, not a real failure. `battery.sh`'s exit code is only trustworthy after `extract.sh`.
- **Release ritual per ship:** edit the HTML → `git mv drive_showdown_vN.html drive_showdown_vN+1.html` → update the hardcoded filename in `extract.sh` **and** in `CLAUDE.md` / `MIGRATION.md` → `./extract.sh && ./battery.sh` green → commit "vN+1 …" → push `dev` + the session branch. **After a `git mv`, you must Read the renamed file before you can Edit it.**
- **Tests:** `harness/tests/smoke*.js` are auto-discovered by `battery.sh`'s glob — a new `smokeNN.js` needs no wiring. Each suite's body is an **eval'd template string**, so **no apostrophes in `ok(...)` labels and no backticks inside the block** (they break parsing). The **mock canvas is a no-op**, so a real-browser-only render crash only surfaces if a test *actually calls* the draw function — every new draw path needs a no-throw test that draws.
- **Balance sim:** `./extract.sh && node harness/tests/bbbalance.js /tmp/g.js` (directional only; see §3).
- **Gotcha — hit-location classification:** a blast/ram hit is classified front/side/rear vs the victim's heading, and **side hits drain MOBILITY, not HP** — position test foes at the rear to assert HP damage.
- **How Sam works:** live-playtests fast on desktop + phone; brain-dumps ideas rapidly (often one idea per message, several in a row). Wants terse status, real `battery.sh` results, and one shippable green increment per fix, with a build dropped at milestones. Often steps away and asks for autonomous build sessions ("go as far as you can, gate/table if blocked").
- **Doc map:** `MIGRATION.md` (read first — current state + facts) → the latest `HANDOFF_*.md` (thread narrative + backlog) → `CLAUDE.md` (branch policy + setup, auto-loaded). Specs live in `SPEC_*.md`; PRDs in `frcds_*_prd_*.md`; the career spec in `CAREER_PLAN.md`.

## 5. Open threads
- **Promotion of all five 2026-07-03 features** from gated/experimental to mainline — the single biggest open thread. Each feature's spec now carries a `✅ BUILT (gated)` banner with its specific promote step. This is explicitly meant to be done **live with Sam**, not blind. Waiting on Sam.
- **Ball-merge promote step:** flip the merge unconditional, migrate the internal `m2.mode` to a real `'ball'` string behind the existing `b2Shooter()`/`p2BallMode()` funnel, merge the tournament + career mode cyclers, then guard the 3 `M2_MODES.find` label sites. (Currently safe only because `m2.mode` never stores `'ball'`.)
- **Kids Mode placement:** currently a compact gated splash entry; the intended end state is a prominent, always-visible tile (a parent handing over a phone shouldn't need the Konami code). Waiting on Sam's OK.
- **Balloon Battle follow-ups (deferred, per spec):** a spike **editor** (place spikes on the chassis, like the map editor), chariot/side spikes, a timed "most balloons survive" variant, a true mutual-KO draw, and possibly per-drive grip. All were deliberately scoped out of v1.
- **Two design decisions I locked unattended this session, flagged for Sam's review:** (1) Balloon Battle's 5 open spec questions were locked to the spec's own recommendations (3 balloons, spikeHp 3, reuse impact-mag for grip, main gated tile, fixed layout v1). (2) Kids Mode base = simplified ball as a splash entry. Both are reversible if Sam disagrees.
- **Longer-standing backlog (needs Sam in the loop):** FFA CPU anti-dogpile target-spread; CAREER mobile-touch controls + a live browser playtest; tournament per-match lineup swaps (Sam deferred); STOCK → 6-player FFA (~10h refactor, wants a playtest not an unattended build).
- **Brainstormed but NOT decided (do not treat as settled):** CPU-brain tuning items Sam explicitly *tabled* — kamikaze-0%-in-3v3 behavior, tier-difficulty lapse/react depth, jet dash-through counter, and a repair heal↔buff cycle redesign. A smoke-screen *weapon* variant (vs the shipped perk) was floated as a possible follow-up, not committed.

## 6. Next actions
1. **Sam playtests the five gated features** (Konami → cheats → EXPERIMENTAL FEATURES ON; Battle Ball has its own toggle) and decides which to promote.
2. On his go-ahead, **promote features to mainline** one at a time, following each spec's promote step (Ball-merge is the most mechanical; Kids the smallest).
3. **Review the two unattended design calls** (Balloon Battle decisions, Kids Mode base) — confirm or adjust.
4. Pick up the standing backlog when Sam wants it: FFA anti-dogpile, career mobile-touch + playtest.

## 7. Flag for exclusion
Do **not** carry these into a general/main harness context — they're project-specific or sensitive and would confuse other work:
- The `dev`-branch policy and the throwaway `claude/*`-branch reconciliation ritual — specific to this repo's web-session platform behavior.
- The "commit as `Claude <noreply@anthropic.com>`" and "never put the model id in artifacts" rules — DriveShowdown-specific conventions.
- The exact release ritual (`extract.sh`/`battery.sh`, `git mv` + Read-before-Edit, the eval'd-template-string test format, the no-op mock canvas) — bespoke to this single-file game's harness.
- Sam's email address (present in the project config) — personal; exclude from any shared context.
- Environment/harness plumbing seen in this session (the outbound HTTPS proxy + CA bundle, MCP server auth states) — infrastructure noise, not project knowledge.
- The frozen online sandbox branch details and its retired v5.2 reservation — dead history unless online is ever revived.

## CHANGELOG
- v1.0 (2026-07-07): Initial export for harness migration.
