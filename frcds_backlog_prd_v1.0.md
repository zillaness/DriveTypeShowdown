---
file: frcds_backlog_prd_v1.0.md
version: 1.0
author: Sam Cao
created: 2026-06-13
last_updated: 2026-06-13
description: Backlog of future additions and deferred items for FRC Drive Showdown, flagged but not built as of v5.0.1 / the 3v3 (v5.1) pass.
ai_update: Update last_updated and version. Rename file to match. Append changelog at bottom.
---

# FRC Drive Showdown — Future Additions / Backlog

Items flagged during the v5.0 big build and the 3v3 planning that are deferred. The 3v3 work itself has its own PRD (`frcds_3v3_prd_v1.0.md`) and is the primary next build; this file is everything else.

## 1. Custom names in tank-fight and race modes
v5.0 wired custom robot names (`p2Name(pl)`) into the ball-mode HUD, results, and pin toast only. Tank-fight and race modes still print RED/BLUE literally. Extend `p2Name` into those modes' HUD and results when convenient. Low effort, low risk; names default to RED/BLUE so nothing is broken today.

## 2. Granular CPU tuning in the 2P setup (saved-preset selection)
Decision I for 3v3 locked CPU granularity to tier-only per spot (ROOKIE..CHAMPION) to avoid burying the six-card screen. The single-player `cpuSettings` screen already supports granular sliders and named presets (`frc_cpu_presets_v1`). Optional future add: let a CPU spot pick one of the saved SP presets instead of only a tier. Keep it lightweight (a preset dropdown on the card), separate from the core 3v3 build.

## 3. v5.0 setup-screen manual layout / contrast pass
The unified setup screen is logic-tested (smoke50, 22 asserts) but not pixel-tested. The two cards pack a lot onto 1280x720 (bot icon, three stat bars, tabs, arrows, description, controller box, slider). Needs a real eyeball check for contrast (light-on-light) and overlap/clipping, which Sam catches reliably. Quick fixes if anything crowds.

## 4. Timer visual + end-countdown audio real-play check
The HUD timer color states (amber <15s, red+pulse <5s) and the 5-4-3-2-1 end-countdown beeps are logic-verified only. Confirm the visual treatment and audio timing feel right in real play.

## 5. Ball-count AUTO tuning for 3v3 (watch-item)
Ball count AUTO scales as `4 + total robots` (clamped 4-14). With six robots in 3v3, confirm the field does not get choked into a pinball scrum. Keep AUTO conservative for 3v3 and tune during that phase's playtest rather than guessing the numbers now.

## 6. Distribution / packaging (if pursued)
Not started for this title. The game is a single self-contained HTML file, so web hosting (itch.io / Netlify) or an Electron wrapper (desktop / Steam) are both straightforward if Sam wants to distribute it later.

## CHANGELOG
- v1.0 (2026-06-13): Initial backlog captured at the v5.0.1 / 3v3-fork boundary.
