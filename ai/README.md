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
game's own **`frcds-ghosts`** format. In real DriveShowdown: **Single Player → high scores →
Ghosts → import**, then drive the `arcade` course — and you race against the translucent
ghost of the **AI's optimal line**. The ML's answer becomes a ghost you can actually chase.

### How the AI works

| Piece | Detail |
|-------|--------|
| **Inputs (10)** | nearest un-scored ball (local x, y, closeness), 2nd-nearest ball (x, y), the direction that ball must travel to reach the gap (in the robot's frame), robot position (x, y), and fraction of balls scored |
| **Brain** | MLP `10 → 12 → 8 → 2`, `tanh` (254 weights) |
| **Outputs** | steering and throttle |
| **Fitness** | `1000 × balls scored` (earlier = more) + progress of un-scored balls toward the gap − a small time penalty + a large bonus for a full 8/8 clear that grows the faster you finish |
| **Evolution** | elitism (top ~8%) + front-biased tournament selection + uniform crossover + Gaussian mutation + fresh "immigrant" genomes each generation (to escape plateaus) |

Gradient-free **neuroevolution** — no training data, no backprop, no GPU.

### Controls

- **⏸ / ▶** pause · **▶ 1× … ⏩ MAX** simulation speed (fast-forward training)
- **↺ Reset Evolution** — fresh random population
- **🏁 Replay Best** — deterministically re-run the champion so you can watch the ideal line (with the balls) at any speed
- **👻 Export Ghost** — download the game-compatible ghost of the ideal path
- **POP / MUT** sliders, **PATHS** toggle · keys: `Space` play/pause, `R` replay

### Reading the screen

- **Center** — the real portrait field. Bright mint robot = current best of the population;
  faint robots behind it = the rest of the fleet; yellow balls turn green when scored; the
  mint line is the leader's path and the dashed gold line is the champion's recorded ideal line.
- **Top of field** — the game's own **timer** and **N/8** ball counter.
- **Right** — the driver's **brain** (live activations), the **best-finish-time-per-generation**
  curve dropping over time, and the **leaderboard** (balls · time).

### Recording it for YouTube

Set speed to **⏩ MAX**, let it run until the best-time curve flattens (~40–60 generations),
then hit **🏁 Replay Best** at **1×** to show the clean, optimal run scoring all 8 balls.
Screen-record the generation counter and the dropping best time — that's the whole story.

---

## The general racing demo — `ai_drive_showdown.html`

The same neuroevolution engine on a **procedurally generated race track**: a fleet of
neural-net cars with raycast sensors learns to drive clean laps, with a head-to-head
**Showdown** between the two best evolved brains (car-to-car collisions, contact scrubs
speed, so blocking is real strategy). This is the classic "AI learns to drive" look; the
Speedrun tool above is the one that plays your actual game.

---

*Part of [DriveShowdown](../) — Team 2204 Rambots. Single-file, offline, no dependencies.*
