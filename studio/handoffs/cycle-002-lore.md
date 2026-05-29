# Cycle 2 — Lore Handoff

**Theme:** The world has a heartbeat (cycle 1 clock). Now give it a sky. Time should be *visible* — the park should look like morning, noon, dusk, night. Day/night palette is the smallest next step that makes time felt, and it unblocks every later feature that keys off the hour (sleeping huddles 041, dawn daily-plans 012, dusk reflection 014).

**Cycle status:** Lore-smith bumped cycle 1 → 2. Cycle 1 closed BACKLOG-007 (world tick clock), APPROVED.

**Operator note:** This cycle is being run by hand by the watcher on a Friday with fresh weekly budget, rather than waiting for the Monday cron. The full chain (designer → codeplan → coder → qa → validator) still runs in order; only the clock is different.

**Added to BACKLOG:**
- BACKLOG-046 [infra] Vite host bind — `host: true` so Playwright reaches `127.0.0.1` (was IPv6-only). *Filed and fixed this cycle by operator; was the BUG-001 infra note from the cycle-1 validator. Closed.*

**Suggested next-up: BACKLOG-008 [core] Day/night palette shift.**

Why: the clock from cycle 1 already broadcasts `onTick` (every in-game minute) and `onHour`. A tint overlay driven off `clock.now()` is small, contained, fully testable as a pure function, and turns invisible time into visible atmosphere. It is the natural second course after the clock.

Fallbacks if blocked: BACKLOG-006 (device probe) or BACKLOG-010 (personality traits). Do **not** pick BACKLOG-005 (WebLLM) yet — still too big.

**Mood note:** keep it atmospheric but cheap. No per-tile relighting, no shaders. One overlay rectangle, lerped color + alpha across the day. Gen3 dusk-orange and midnight-blue are the references.
