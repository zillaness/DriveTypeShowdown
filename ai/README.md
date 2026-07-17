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
| **Inputs (10–12)** | nearest un-scored ball (position, closeness), 2nd-nearest ball, the direction that ball must travel to reach the gap, robot position, fraction scored. Sensors are **frame-consistent with the drive's controls**: robot-frame for tank/arcade/bot-swerve, field-frame for field-swerve (which alone also sees its heading sinθ/cosθ, since heading still aims the scoop) |
| **Brain** | MLP `10–12 → 12 → 8 → 2 or 3`, `tanh` (in/out sized to the drive type) |
| **Outputs** | steer/throttle (tank, arcade), or forward/strafe/rotate (swerve) |
| **Fitness** | **lexicographic**: balls scored dominates absolutely (10,000/ball), then per-ball speed (12/s discount), ball progress toward the gap, and a big finish bonus that grows the faster the full clear — so evolution can never prefer a fast 6-ball run over any 7-ball run |
| **Evolution** | elitism (top ~8%) + front-biased tournament selection + uniform crossover + Gaussian mutation + fresh "immigrant" genomes each generation (to escape plateaus) |

Gradient-free **neuroevolution** — no training data, no backprop, no GPU.

### Drive types & sensitivity — the theoretical run changes with the controls

Cycle **🚗 Drive type** through the 4 original DriveShowdown controls, each with faithful kinematics:

- **Tank** — two tracks; can't floor-and-turn-max at once. (Surprise: the *fastest learner* — first
  full clear around generation 13–18 in seeded tests.)
- **Arcade** — single stick; throttle and turn are independent.
- **Swerve · bot** — omnidirectional, robot-relative (strafe any way + rotate). Trains reliably
  (3/3 seeds) — its sensing frame, control frame, and scoop frame all coincide, so "chase the
  ball forward" automatically leads with the scoop.
- **Swerve · field** — omnidirectional, field-relative with heading hold (scoop locked up-field,
  like a real FRC heading-lock). **The big finding:** it's *physically* just as capable — a
  hand-coded controller clears all 8 in ~28s under the exact same physics — but it is **by far
  the hardest for evolution to learn**. In field frame, a random neural net is a near-constant
  function, i.e. a straight-line plow that caps out at 3 balls; the tool counters with Fourier
  phase inputs, wall-danger fitness shaping, and route-diversity elites, which get it to 7/8 and
  climbing. Expect it to need long runs (and POP 120) for a full clear — watching the *same
  robot* train at wildly different rates purely because of its control frame is the point.

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
