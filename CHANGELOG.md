# Changelog

Append-only. Validator adds an entry on APPROVED verdicts. Format:

```
## Cycle NNN — YYYY-MM-DD
- BACKLOG-NNN: <title> — <one-line outcome>
```

---

## Cycle 002 — 2026-05-29

- BACKLOG-008: Day/night palette shift — APPROVED. Full-map tint overlay lerps color + alpha across the day off the cycle-1 clock: midnight blue, warm dawn/dusk, clear noon. Pure `dayNight.ts` (`tintFor`, `dayPhase`); 6 new unit + 2 new e2e; 8/8 AC pass. Lights the runway for hour-keyed features (012 dawn plans, 014 dusk reflection, 041 night huddles).
- BACKLOG-046: Vite `host: true` — APPROVED. Fixed BUG-001 (IPv6-only bind); e2e now runs on the default Playwright config, retiring the cycle-1 `.qa-override` crutch.

## Cycle 001 — 2026-05-26

- BACKLOG-007: World tick clock — APPROVED. `WorldClock` class ships; 1 real second = 1 in-game minute; HUD `Day N — HH:MM` top-left; `onTick` / `onHour` listener API; 8/8 unit tests + 3/3 e2e green. Unblocks BACKLOG-008, -012, -041+.

## Cycle 000 — 2026-05-25 — Bootstrap

- Repo initialized
- CHARTER, BACKLOG, STYLE-GUIDE, CHANGELOG written
- Game scaffolded (Phaser 3 + TS + Vite, empty scene, placeholder dino)
- Studio scaffolded (7 routine prompts, state.json, chronicle, RE-ARM)
- CI workflow written
- Cron schedule created
