<!-- Copyright (C) 2026 Projects and Mods -->
<!-- GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE. -->

# Drive Type Showdown

A single-file HTML5 canvas game that demonstrates every FRC robot **drive type**
(tank, arcade, swerve, holonomic, steering) — and has grown into a full arcade:
head-to-head ball, SHOOTER, TANK FIGHT, **RoboRumble** combat, OBSTACLE RACE, a
story-driven **CAREER** tutorial, a map editor, tournaments, and a deep
experimental-features layer. Built for **Team 2204 Rambots**.

**▶ Play:** https://zillaness.github.io/DriveTypeShowdown/
**🤖 AI lab (neuroevolution learns to play):** https://zillaness.github.io/DriveTypeShowdown/adversarial-ml/

Everything is one self-contained `drive_showdown_vX.Y.Z.html` — no build step, no
server, no external assets. Just open it in a browser (works offline).

## Modes
BALL (push / shooter) · TANK FIGHT · ROBORUMBLE · OBSTACLE RACE · CAREER / STORY ·
plus experimental modes behind the EXPERIMENTAL FEATURES toggle (Battle Ball,
Smoke Screen, Kids Mode, Balloon Battle).

## Develop / test
The container is ephemeral and the test harness reads an extracted copy of the
game at `/tmp/g.js`, which does not exist on a fresh clone — always extract first:

```sh
./extract.sh && ./battery.sh   # prints "ALL GREEN" when healthy
```

`extract.sh` pulls the inline `<script>` out of the current build into `/tmp/g.js`;
`battery.sh` runs the smoke suites under `harness/tests/` plus the balance sim.

## License

[![Code License: GPLv3 + Commons Clause](https://img.shields.io/badge/Code-GPLv3%20%2B%20Commons%20Clause-blue.svg)](LICENSE)
[![Asset License: CC BY-NC-SA 4.0](https://img.shields.io/badge/Artwork-CC%20BY--NC--SA%204.0-lightgrey.svg)](LICENSE-ASSETS)

**Drive Type Showdown** — Copyright © 2026 Projects and Mods.

- **Code** is licensed under the [GNU General Public License v3.0 or later **WITH the Commons Clause**](LICENSE). You may use, study, modify, and share the source freely, and any distributed derivative must remain open under the same terms — but the Commons Clause forbids **selling** the software or any service whose value derives substantially from it. In short: **non-commercial use only.**
- **Artwork** — the original icons, diagrams, and other visual assets created for this project — is licensed under [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](LICENSE-ASSETS).

Third-party or reference material bundled with or referenced by this project retains its own separate license.
