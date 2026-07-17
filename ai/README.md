# DriveShowdown · AI Lab 🧠🏎️

Adversarial **machine learning that plays DriveShowdown** — the "AI learns to play this
game" spectacle you see on YouTube, built into single offline HTML files (no build, no
libraries, no server).

There are two tools here:

| File | What it does |
|------|--------------|
| **[`drive_showdown_ai_speedrun.html`](./drive_showdown_ai_speedrun.html)** | **⭐ The main one.** Evolves an AI to play the **real single-player portrait game** and find the *ideal path to score the fastest*. |
| [`ai_drive_showdown.html`](./ai_drive_showdown.html) | A general "AI learns to drive" racing demo on procedural tracks (great for the classic neuroevolution look). |

---

## ⭐ AI Speedrun — the fastest path through the real single-player game

The original single-player portrait mode of DriveShowdown (the byte-identical **"legacy"
400×720 layout**) is a **time trial**: push all **8 balls** through the center gap as fast
as possible. The game even saves your best time and records a **ghost** of your best run.

`drive_showdown_ai_speedrun.html` turns that into a machine-learning problem:

> A population of ~60 neural-network drivers all attempt the run at once. The fittest
> (fastest, most balls scored) breed each generation. Over a few dozen generations the AI
> teaches itself to herd all 8 balls through the gap — and then keeps **shaving its time
> down** toward the optimal racing line.

In a headless run it finds its first full 8/8 clear around **generation 16**, then optimizes
**42s → 22s → ~19.7s** as evolution refines the path.

### It plays the *real* game

The field geometry, robot physics, and scoring rule are **ported faithfully** from
`drive_showdown_v5.1.98.html` (the legacy single-player layout), so the AI is solving the
actual game, not a lookalike:

- exact field `380×628`, wall at `y=118`, goal gap `x∈[125,255]`, all 8 ball spawn positions;
- the game's **kinematic robot** (`SPD=180`, `TSP=2.85`) with the real **scoop-arm plow** + body-push ball handling;
- ball drag/bounce and ball-ball collisions;
- the real scoring rule — a ball counts when it crosses the wall line (`y < 103`) through the gap.

### 👻 Export the ideal path back into the real game

This is the payoff. Hit **👻 Export Ghost** and you get a `frc_ghosts_AI_*.json` file in the
game's own **`frcds-ghosts`** format (keyed to whichever drive type the champion used). In real
DriveShowdown: **Single Player → high scores → Ghosts → import**, then drive that course — and you
race against the translucent ghost of the **AI's optimal line**. The ML's answer becomes a ghost you
can actually chase — and you can go the other way too, importing *your* ghost to race the AI here.

### How the AI works

| Piece | Detail |
|-------|--------|
| **Inputs (12)** | nearest un-scored ball (local x, y, closeness), 2nd-nearest ball (x, y), the direction that ball must travel to reach the gap (robot frame), robot position (x, y), fraction of balls scored, and the robot's absolute heading (sinθ, cosθ) |
| **Brain** | MLP `12 → 12 → 8 → 2 or 3`, `tanh` (output size = the drive type's degrees of freedom) |
| **Outputs** | steer/throttle (tank, arcade), or forward/strafe/rotate (swerve) |
| **Fitness** | `1000 × balls scored` (earlier = more) + progress of un-scored balls toward the gap − a small time penalty + a large bonus for a full 8/8 clear that grows the faster you finish |
| **Evolution** | elitism (top ~8%) + front-biased tournament selection + uniform crossover + Gaussian mutation + fresh "immigrant" genomes each generation (to escape plateaus) |

Gradient-free **neuroevolution** — no training data, no backprop, no GPU.

### Drive types & sensitivity — the theoretical run changes with the controls

Cycle **🚗 Drive type** through the 4 original DriveShowdown controls, each with faithful kinematics:

- **Tank** — two tracks; can't floor-and-turn-max at once, so a touch slower than arcade.
- **Arcade** — single stick; throttle and turn are independent.
- **Swerve · bot** — omnidirectional, robot-relative (strafe any way + rotate).
- **Swerve · field** — omnidirectional, field-relative — *same capability* as bot-centric, so a
  similar best time, but it has to learn to account for its heading, so it often **trains at a
  different rate**. Watch the COMPUTE stat and the Compare table.

**⚙ Sensitivity** (1× / 1.5× / 2×) is the real game's speed & turn lever — 2× is twice as fast and
turny, so the theoretical best time is faster. Analog input + 2× sensitivity = the outright fastest.

### Controls, telemetry & analysis

Hover any control for a tooltip, or hit **❔ Help** for the full reference. Highlights:

- **⏸ / ▶** pause · **▶ 1× … ⏩ MAX** speed · **↺ Reset** · **🏁 Replay Best** (deterministic re-run)
- **🎮 Analog ↔ ⌨ Keyboard** — analog is continuous (the theoretical fastest); keyboard quantizes to
  W/A/S/D on-off like a keyboard player (usually a bit slower). The **telemetry** panel shows *both*
  representations of whatever the AI is doing — an analog stick **and** the mapped keys lighting up —
  plus per-output bars, speed/heading/position, and a steer/throttle oscilloscope.
- **📈 Telemetry** on/off — pure observation; off just trains a hair faster (the real lever for a
  faster best is Analog + 2× sensitivity).
- **OPTIMAL path** — the champion's ideal racing line, coloured by speed (red slow → green fast).
- **💾 Save Run / ⚖ Compare / 📊 Export Data** — snapshot champions, overlay every saved run's ghost
  and **rank them by finish time and training compute** (agent-steps) to find the most efficient
  settings, and export everything (drive, sensitivity, compute, full 30 Hz telemetry) to CSV.
- **👻 Export Ghost / 📥 Import Human** — export the AI line into the real game, or **import a ghost
  you played in the game** and watch it **play back in real time** on the field, ranked head-to-head
  against the AI in Compare.
- Keys: `Space` play · `R` replay · `T` telemetry · `I` input · `C` compare · `D` export · `?` help

### Recording it for YouTube

Set speed to **⏩ MAX**, let it run until the best-time curve flattens, then hit **🏁 Replay Best**
at **1×** to show the clean, optimal run. Screen-record the generation counter and the dropping best
time. For an extra beat: import your own human ghost and race it against the AI's line.

### Roadmap

- **Car / Ackermann steering** — a 5th drive type where turn rate scales with speed and there's no
  pivot-in-place (queued).

---

## The general racing demo — `ai_drive_showdown.html`

The same neuroevolution engine on a **procedurally generated race track**: a fleet of
neural-net cars with raycast sensors learns to drive clean laps, with a head-to-head
**Showdown** between the two best evolved brains (car-to-car collisions, contact scrubs
speed, so blocking is real strategy). This is the classic "AI learns to drive" look; the
Speedrun tool above is the one that plays your actual game.

---

*Part of [DriveShowdown](../) — Team 2204 Rambots. Single-file, offline, no dependencies.*
