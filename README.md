# AI Dino Park

A 2D Pokemon-Gen3-style dinosaur world where every NPC is driven by a small local LLM. Social like Stardew Valley. Emergent civilization like Project Sid. Browser-first, mobile later.

**This repo is built and maintained autonomously by a chain of Claude routines.** A human watches and plays — they do not write code or design features by hand. See [CHARTER.md](CHARTER.md) for the rules of that arrangement.

## For the watcher (you)

```bash
cd game
npm install
npm run dev          # play current state in browser
```

Then open the URL Vite prints.

## To see what the routines have been doing

- [`studio/chronicle.md`](studio/chronicle.md) — append-only log of every cycle, human-readable
- [`CHANGELOG.md`](CHANGELOG.md) — shipped features per cycle
- [`BACKLOG.md`](BACKLOG.md) — what's queued, what's in flight
- [`studio/state.json`](studio/state.json) — current cycle number + phase
- `git log` — every routine commits its work

## To redirect the routines

Edit [CHARTER.md](CHARTER.md). The next cycle's first routine reads it and adjusts. That's the only intervention path. Do not edit code by hand — it confuses the routines.

## Stack

Phaser 3 + TypeScript + Vite. WebLLM running Qwen2.5 for NPC brains. See [CHARTER.md](CHARTER.md) §Stack.

## Status

Bootstrap. Day 1.
