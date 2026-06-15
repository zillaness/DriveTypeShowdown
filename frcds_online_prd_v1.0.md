---
file: frcds_online_prd_v1.0.md
version: 1.0
author: Sam Cao
created: 2026-06-15
last_updated: 2026-06-15
description: Concept/plan PRD for adding ONLINE (over-the-internet) play-with-a-friend to FRC Drive Showdown — free, serverless-first, host-authoritative over WebRTC; Parsec as the zero-effort interim. NOT started.
ai_update: Update last_updated and version. Rename file to match. Append changelog at bottom.
---

# FRC Drive Showdown — Online Multiplayer (PRD, NOT started)

Status: concept / plan only. No online code exists. This is a multi-version feature and is hard to verify in the headless harness. The first real milestone is small on purpose.

## Problem
Today the game is **local-only**: multiple humans share ONE machine (one keyboard, gamepads, two touch halves), and the claim grid fills up to 6 seats (2 sides x 3) with humans (each a device) or CPUs. There is no way to play with a friend who is not in the room. This PRD adds **online play-with-a-friend over the internet**, for free, while respecting the project's defining constraint.

## The single-file constraint (called out up front)
The game is one self-contained file (`frc_drive_showdown_v5.1.62.html`): all code in one inline `<script>`, no external assets, no build step, no server, works offline. Constraint: **single file, no assets, no external deps.**

Online play tensions with this, because connecting two browsers normally wants a server. Resolution, in priority order:
- **Keep it pure.** WebRTC is built into every browser (free, peer-to-peer data channels, no server for the actual gameplay). The only thing it needs is *signaling* — a one-time exchange of an offer/answer blob to connect. We can do that with **manual copy-paste** (the players paste two text blobs to each other once). Zero server, zero deps, still one offline-capable file. Clunky UX, but it preserves purity.
- **Optional, opt-in helper.** For nicer "type a room code" UX, an inlined tiny signaling client (Trystero / PeerJS over their free public infra) can be added behind a flag. This is the one place we may relax "no external deps" — and only for the brief handshake, never for gameplay. Gameplay always stays peer-to-peer. Document the tradeoff explicitly; default build can ship copy-paste-only to stay fully pure.
- **Never** add a backend we host. No accounts, no servers, no recurring cost.

## Goals
- Two people in different locations play a match together over the internet, **free**.
- Start with **1v1** (one human per side) in **one mode**, then generalize to **NvN** using the existing 6-seat grid.
- Stay serverless for gameplay (WebRTC P2P). Keep the single-file build shippable as the default.
- Reuse as much of the existing sim as possible (host runs it; minimal rewrite).

## Non-goals (initially)
- Matchmaking / lobbies / browse-a-server. (Friend-to-friend only.)
- Accounts, logins, persistence, leaderboards online.
- Anti-cheat. (Casual play with a friend; host is trusted.)
- Mobile-perfect online. (Desktop-first; mobile later if cheap.)
- Spectators, in-game voice, reconnect-mid-match (later phases).
- Determinism for all five modes at once (only if/when we choose lockstep).

---

## Option 0 — ZERO-DEV interim (works TODAY, no code): game-streaming "play together"
Before writing any netcode, there is a free path that works **right now** by leveraging the existing **local** multiplayer.

- **Parsec (recommended interim).** Host runs the HTML file locally, opens Parsec, invites the friend. The friend joins and their **controller becomes a second player** — exactly as if they were sitting on the couch. Because the game already supports a friend's controller as a separate seat, *no game code changes are needed.* Parsec has a free tier and works for an arbitrary local file (no store/launcher required) — the best free fit here.
- **Steam Remote Play Together.** Same idea, but requires the game to be added to Steam (non-Steam shortcut). More setup; works but Steam-bound. Secondary option.

How it works: these tools stream the host's screen/audio to the friend and stream the friend's controller input back. The game thinks both players are local.

Tradeoffs (be honest):
- The **host's machine runs everything**; if the host quits, the session ends.
- **Video-stream latency** (encode + network + decode) on top of any input lag — fine for this casual game, not for twitch-perfect play.
- Quality depends on the host's upload bandwidth.
- Keyboard-vs-keyboard sharing is awkward; **controllers are the clean path** for the remote player.

This interim covers "I want to play with my friend tonight" with zero engineering. Native online (below) is the durable answer.

---

## Native online architecture — sync model (compare two, pick one)

### A. Host-authoritative (RECOMMENDED)
- **Host** runs the existing `update(dt)` sim each frame and **broadcasts a state snapshot ~20-30 Hz** over the data channel.
- **Remote player** runs no sim: it **sends only its inputs** to the host and **renders the latest received snapshot** (with interpolation/smoothing between snapshots).
- Pros: smallest retrofit. The sim already runs exactly as today on the host; we don't have to make anything deterministic. We add (1) a "remote input source" so a seat reads inputs off the wire, and (2) snapshot serialize/apply for **one mode at a time**.
- Cons: the **remote side has mild input lag** (its inputs round-trip to the host, then come back in the next snapshot). Acceptable for this game with light interpolation. Bandwidth is higher than lockstep (we ship state, not just inputs) but trivially small for our object counts.

### B. Deterministic lockstep
- Peers exchange **inputs only**; both run the identical sim in step and arrive at the identical state.
- Pros: minimal bandwidth; both sides feel equally responsive.
- Cons: requires the sim to be **fully deterministic** — today it is NOT. There are 39 `Math.random` call sites (CPU brains, ball/pickup spawns, tie-break) plus reliance on consistent float math and iteration order. We'd have to seed a shared PRNG, route every random draw through it, and guarantee identical update ordering across machines. Any divergence desyncs the match. Much bigger, riskier retrofit; also needs input-delay or rollback to hide latency.

### Decision: **A. Host-authoritative.** It fits a one-file canvas game we want to retrofit cheaply. Lockstep is a possible later optimization if bandwidth or fairness ever matters, and the determinism work (seeded RNG) is tracked as a risk/option below.

---

## Transport + signaling (free / serverless angle)

**Transport: WebRTC `RTCDataChannel`** (unordered, optionally unreliable for state; reliable+ordered for control messages). Built into browsers, free, peer-to-peer once connected. This is the gameplay pipe in every option.

**Signaling (the one-time handshake to connect):**

| Option | Server? | Deps? | UX | Single-file impact |
| --- | --- | --- | --- | --- |
| **Manual copy-paste** of offer/answer (+ICE) blobs | None | None | Clunky (paste 2 blobs once) | **Fully pure.** Recommended first. |
| **Trystero** (serverless, free public infra: torrent/Nostr/etc.) | None we run | One small inlined lib | "Type a room code" | Mild: adds a vendored lib, used only for handshake |
| **PeerJS** (free PeerServer cloud) | Their free cloud | Small client lib | Room/peer IDs | Mild: external free service dependency |
| **Firebase free tier** | Google (free tier) | SDK | Easy | Heaviest dep; avoid unless needed |

**TURN (NAT traversal):** most home connections connect P2P via STUN (free public STUN is fine). Some strict/symmetric NATs need a **TURN relay**. Free/low TURN tiers exist (e.g. Open Relay-style). Make TURN optional/configurable; warn the user if direct connect fails. This is the main "it just won't connect" risk.

**Plan:** ship **copy-paste signaling first** (pure, proves the netcode), then add **optional room-code signaling** (Trystero is the best fit for serverless + free + minimal dep) behind a flag for nicer UX. Gameplay stays P2P in all cases.

---

## What specifically must change in THIS codebase
Touch points reference real symbols in `frc_drive_showdown_v5.1.62.html`.

1. **Input-source abstraction (so a seat can be "remote").**
   - Today input is read per player via `getInp(bind)` (line ~1106), where `bind` maps to a device: keyboard / gamepad index / touch, plus `type:'cpu'` which already pulls from `cpuH2H[s].inp`. `playerBind` (line ~145) holds the per-player bind.
   - Add a new bind type `'remote'` whose input comes from the latest packet received over the wire, mirroring how `'cpu'` already returns a synthesized `{vx,vy,vr,fire,...}` object. This is the cleanest seam: one new branch in `getInp`, no change to per-mode movement code.
   - The remote peer's local input is captured the same way today, then **sent** (not applied locally) each frame.

2. **State snapshot: serialize + apply (one mode first).**
   - Pick **TANK FIGHT (`tf2`, variable roster `tf2.tanks[]`)** or **NORMAL ball+shooter (`b2`)** as the first mode (tank is a clean candidate: clear per-tank state, fewer spawn-driven randomness surprises mid-frame; ball mode is the marquee mode — pick during P2).
   - Host: a `serializeState()` that emits the minimal authoritative state for that mode's state object (positions, velocities, headings, health/score, ball/pickup positions, timer). Remote: `applyState(snapshot)` that writes it back onto the local copy of `tf2`/`b2` for `draw()`.
   - Keep snapshots small (quantize floats; send deltas later if needed). One mode at a time keeps this tractable.

3. **Netcode layer (new, self-contained module in the inline script).**
   - Connection lifecycle: create/accept offer, ICE gathering, open data channel, ready/handshake (agree on mode, seats, version), teardown.
   - Send/recv loop: host broadcasts snapshots ~20-30 Hz (decoupled from the 60 Hz render); remote sends inputs each frame; both handle control messages (start, pause, mode, disconnect).
   - Lag handling on the remote: **interpolation** between the last two snapshots, small buffer, and clamp. (The loop already guards dt: `dt=Math.min((ts-lastTs)/1000,0.05)` at line ~7165 — net hitches won't explode the sim.)
   - Version guard so mismatched builds refuse to connect.

4. **Main-loop integration.**
   - `loop(ts)` (line ~7164) runs `try{update(dt);draw();}`. On the **remote**, skip `update` for the netted mode and instead `applyState` + interpolate, then `draw()`. On the **host**, run `update` as today, then push a snapshot on the net tick. Drive this off the existing bind/role so single-machine play is untouched when no peer is connected.

5. **Connection UI.**
   - A small Host / Join screen reachable from the existing setup/claim flow. Host shows its offer blob (copy) and a paste box for the answer; Join pastes the offer and returns an answer; later, a **room-code** field when optional signaling is enabled.
   - In the 6-seat claim grid, allow a seat's controller to be set to **REMOTE** (maps to the new bind type). 1v1 = one remote seat on the far side; NvN later = multiple remote seats.

6. **RNG seeding — ONLY if we ever choose lockstep.**
   - Not needed for host-authoritative. If lockstep is pursued later: replace the 39 `Math.random` sites with a single seeded PRNG shared at match start, and audit update ordering. Tracked as a risk, not in the first milestones.

**Existing systems touched:** `getInp` / `playerBind` (new bind type), the claim/seat grid (REMOTE option), `loop` (host vs remote branch), and the chosen mode's update/draw + state object (`tf2`/`b2`). CPU (`cpuH2H`), the other modes (`bb2`, `r2`), and single-machine local play stay as-is until later phases.

---

## Bandwidth / latency — what's "good enough"
- **Object counts are tiny** (a handful of robots + a few balls/pickups). A snapshot is on the order of a few hundred bytes to ~1-2 KB.
- At ~20-30 Hz that's roughly **tens of KB/s** down to the remote, plus a trivial input upstream. Comfortably within any home broadband; fine even on modest mobile.
- **Latency target:** under ~80-120 ms round-trip feels good for this casual game; up to ~150-200 ms is playable with interpolation. Host-authoritative means the **host always feels native**; the remote tolerates a bit of lag.
- "Good enough" = matches stay in sync, the remote player can drive and score without rubber-banding being distracting, and no desync/NaN over a full match.

---

## Testing strategy (this is the hard part)
The headless harness uses a no-op canvas and a single JS context — it **cannot** exercise two real WebRTC peers or render. So:
- **Unit-test the seams in the harness:** `serializeState`/`applyState` round-trip (serialize -> apply -> compare) on a constructed `tf2`/`b2`; the new `getInp` `'remote'` branch returning fed inputs; snapshot encode/decode; interpolation math. No real network needed for these.
- **Loopback / 2-tab test:** wire a "local loopback" transport (two in-page endpoints, or two browser tabs via `BroadcastChannel`/`localStorage`) so host+remote run on one machine for an **echo** test — prove the send/recv loop and that the remote renders host state — without a real peer. This is the P1 deliverable's success check.
- **Real two-browser manual test:** two machines (or two profiles + a phone) actually connecting over WebRTC. Required to validate signaling, NAT/TURN, and real latency. Manual, since it can't run headless.
- **Sam's eyeball pass** for feel (lag, interpolation smoothness), as with prior visual/audio items in the backlog.

---

## Suggested phases (each shippable)
- **P1 — Net layer + loopback.** Build the netcode module, the `'remote'` input source, and a 2-tab/loopback transport. Success: host tab drives, remote tab renders the echoed state. No real internet yet. Harness unit tests for serialize/apply/getInp.
- **P2 — Host-authoritative 1v1, ONE mode, copy-paste signaling.** Real WebRTC between two browsers. Pick tank OR ball. Seat grid gets a REMOTE option. Success: two real machines play a full 1v1 match, no desync. Fully single-file/pure.
- **P3 — Nicer connect (free signaling).** Add optional room-code signaling (Trystero recommended) behind a flag; keep copy-paste as the pure default. Optional TURN config for strict NATs.
- **P4 — More modes / NvN / spectators.** Generalize snapshot+remote seats across modes (`b2`, `tf2`, then `bb2`/`r2`); support multiple remote seats (NvN) via the 6-seat grid; optional read-only spectator.
- **P5 — Polish.** Lag compensation tuning, delta/quantized snapshots, reconnect-mid-match, disconnect handling, connection-quality HUD. (Evaluate lockstep + seeded RNG here only if warranted.)

---

## Open questions / risks
- **NAT / TURN:** strict/symmetric NATs may block direct P2P; needs a (free-tier) TURN relay and a graceful "couldn't connect" fallback. Main reliability risk.
- **Determinism:** host-authoritative dodges it; lockstep would need all 39 `Math.random` sites seeded + ordering audited. Keep host-authoritative unless proven necessary.
- **Single-file purity tradeoff:** copy-paste signaling stays 100% pure; room-code UX requires a small inlined signaling lib / free service — decide whether the default build includes it or ships copy-paste-only.
- **Cheating:** host is authoritative and trusted (friend-to-friend); out of scope to defend against. Note that a malicious host could cheat — acceptable for casual play.
- **Who is host?** Host runs the sim and must stay connected; if host drops, the match ends. Pick host explicitly at connect time. (Host also bears the bandwidth.)
- **Build matching:** peers must run the same game version; enforce a version handshake.
- **Mobile/touch online:** touch input over the wire is fine in principle but untested; defer.

---

## RECOMMENDATION
1. **Today, free, zero effort:** use **Parsec** — the friend's controller becomes a player via the existing local multiplayer, no code changes.
2. **First real milestone:** build **host-authoritative 1v1 in ONE mode (tank or ball) over WebRTC**, with **copy-paste signaling first** (fully single-file/pure) and **optional free room-code signaling (Trystero)** as a fast follow. Add the `'remote'` input source, one mode's snapshot serialize/apply, the netcode layer, and a REMOTE seat option — leaving local play, CPUs, and the other modes untouched until later phases.

## CHANGELOG
- v1.0 (2026-06-15): Initial concept/plan draft. Online play not started. Recommends Parsec interim + host-authoritative WebRTC 1v1 (copy-paste then optional free signaling) as the first milestone.
