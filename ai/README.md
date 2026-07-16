# DriveShowdown · AI Lab 🧠🏎️

An **adversarial machine-learning system that learns to play DriveShowdown** — the
classic "AI learns to drive" spectacle you see on YouTube (MarI/O, Code Bullet,
"AI learns to park"), built into a single offline HTML file.

Open **[`ai_drive_showdown.html`](./ai_drive_showdown.html)** in any browser. No
build step, no libraries, no server, works offline.

![what it looks like](#) <!-- population of neural-net cars racing a procedural track,
with a live brain + fitness graph on the right -->

---

## What it does

A **population of ~60 cars, each driven by its own small neural network**, is
dropped onto a procedurally generated race track. At first they all crash
instantly. Through **survival-of-the-fittest** — the cars compete, the fittest
survive and breed, their offspring are mutated — the fleet teaches *itself* to
drive clean laps over a few dozen generations. You watch it happen live.

Then hit **⚔ Showdown** to put the two best evolved brains **wheel-to-wheel on
the same track**, with car-to-car collisions, and see who wins.

## Why it's "adversarial"

Two layers of competition:

1. **Selection pressure (the population is the adversary).** Every generation the
   cars are ranked against each other; only the top performers pass on their
   weights. A genome only survives by out-driving its peers. That competitive
   filtering *is* the learning signal — no hand-labeled data, no reward
   engineering beyond "get further around the track."
2. **Head-to-head Showdown.** The champion races a rival brain on one track.
   Contact scrubs speed, so **blocking and racing lines become real strategy** —
   a directly adversarial race, not just two independent time trials.

## How the AI works

| Piece | Detail |
|-------|--------|
| **Inputs** | 5 raycast distance sensors (the car "feels" the walls) + current speed → 6 numbers |
| **Brain** | Fixed-topology MLP `6 → 8 → 6 → 2`, `tanh` activations (124 weights) |
| **Outputs** | steering and throttle, each in `[-1, 1]` |
| **Genome** | the flat weight vector — this is what evolution mutates |
| **Fitness** | how far the car gets around the centerline (progress in track-segments; 110 = one lap), with a tiny survival bonus |
| **Selection** | elitism (top ~8% copied intact) + front-biased tournament selection |
| **Breeding** | uniform crossover of two parents' weights |
| **Mutation** | Gaussian creep on each weight at the mutation rate, with occasional full resets |

This is **neuroevolution** (a genetic algorithm optimizing neural-net weights) —
gradient-free, so there's nothing to differentiate and it's easy to watch and
understand. No training data, no backprop, no GPU.

## Controls

- **⏸ / ▶** pause & resume · **▶ 1× … ⏩ MAX** simulation speed (fast-forward the training)
- **⟳ New Track** — fresh procedural track (same brains, new challenge)
- **↺ Reset Evolution** — start from a random population
- **⚔ Showdown** — race the two best brains head-to-head
- **💾 Save Champion / 📂 Load** — export/import the best brain as JSON (also auto-saved to `localStorage`)
- **POP / MUT** sliders — population size and mutation rate · **SENSORS** toggle
- Keyboard: `Space` play/pause · `N` new track · `S` showdown

## Reading the screen

- **Left** — the track and the live fleet. Faded cars have crashed; bright cars are
  still driving; the leader wears a gold ring and shows its sensor rays.
- **Right, top** — the champion's **brain**, drawn live: green edges are positive
  weights, red negative, thickness = magnitude, node brightness = current activation.
- **Right, middle** — **fitness per generation** (green = best, blue = average), the
  learning curve going up and to the right.
- **Right, bottom** — the current **leaderboard**.

## Recording it for YouTube

Set speed to `⏩ MAX`, let it rip for ~30 generations until the fitness curve
plateaus, drop back to `▶ 1×` to show a clean lap, then hit **⚔ Showdown** for the
money shot. Screen-record the whole thing — the generation counter, the rising
curve, and the head-to-head finish tell the story on their own.

---

*Part of [DriveShowdown](../) — Team 2204 Rambots. Single-file, offline, no dependencies.*
