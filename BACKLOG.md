# Backlog

Format: `- [ ] BACKLOG-NNN [tag] short title — one-line description`

Tags: `[core]` (essential), `[social]` (Stardew vibes), `[emergent]` (Project Sid vibes), `[pokemon]` (collection/progress), `[ai]` (NPC brain), `[art]` (Artist routine), `[infra]` (tooling)

Status: `[ ]` open, `[~]` in flight, `[x]` shipped, `[a]` abandoned

Designer pulls from the top. Lore-smith appends to the bottom.

---

## Core loop (shipped first)

- [x] BACKLOG-001 [core] One walkable tile map — 20x15 grass map, player sprite, arrow-key movement, collision on edges  *(shipped: bootstrap, cycle 0)*
- [x] BACKLOG-002 [core] One NPC dino spawned on map — placeholder triceratops sprite, stands still  *(shipped: bootstrap, cycle 0)*
- [x] BACKLOG-003 [core] Talk-to-NPC dialog — press Z near NPC, opens Pokemon-style dialog box  *(shipped: bootstrap, cycle 0)*
- [x] BACKLOG-004 [ai] NPCBrain interface scaffold — `brain.ts` with `respond(observation): Promise<Reply>` signature, dummy implementation returns canned text  *(shipped: bootstrap, cycle 0)*
- [x] BACKLOG-005 [ai] WebLLM-backed brain — implement NPCBrain with WebLLM + Qwen2.5-0.5B, lazy-loaded on first dialog  *(shipped: cycle 7, 2026-05-30)*
- [x] BACKLOG-006 [ai] Device probe — pick 0.5B/1.5B/3B from `navigator.deviceMemory` + WebGPU buffer cap; surfaced via `window.__modelLabel`/`__modelInfo` (browser can't write config.json — exposed instead)  *(shipped: cycle 16, 2026-05-30)*
- [x] BACKLOG-007 [core] World tick clock — in-game minute every real second, hour event broadcast  *(shipped: cycle 1, 2026-05-26)*
- [x] BACKLOG-008 [core] Day/night palette shift — tint overlay based on in-game hour  *(shipped: cycle 2, 2026-05-29)*
- [x] BACKLOG-009 [core] Save / load via IndexedDB — auto-save every in-game hour, manual export to JSON  *(shipped: cycle 3, 2026-05-29)*

## NPC depth

- [x] BACKLOG-010 [ai] NPC personality traits — 5 axes (curious/cautious, social/solitary, etc.), seeded at spawn, fed into brain prompt  *(shipped: cycle 4, 2026-05-29)*
- [x] BACKLOG-055 [ai] Livelier character voice — feed the roster flavor + traits into the prompt, drop the negative-heavy framing, allow ~2 sentences, raise tokens/temp. Fixes bland/lifeless replies (operator-diagnosed).  *(shipped: cycle 15, 2026-05-30)*
- [x] BACKLOG-011 [ai] NPC memory store — per-dino ring buffer of recent events (greet/gift/meet), woven into the prompt ("Lately: …"), persisted in the save, daily dawn reflection  *(shipped: cycle 17, 2026-05-30)*
- [ ] BACKLOG-012 [ai] NPC daily plan — at dawn, NPC generates a list of intended activities; world tick consults it
- [x] BACKLOG-013 [ai] NPC relationships — pairwise bonds (0–100), strengthened on every meeting/huddle, persisted in the save  *(shipped: cycle 18, 2026-05-30)*
- [ ] BACKLOG-014 [ai] Reflection pass — at dusk, NPC summarizes day → memory
- [x] BACKLOG-015 [social] Gift system — give item to NPC, affinity changes based on personality fit  *(shipped: cycle 9, 2026-05-30)*
- [x] BACKLOG-016 [social] Friendship hearts UI — 0–10 hearts per NPC, visible in collection book  *(shipped: cycle 6, 2026-05-29)*

## Multi-NPC world

- [x] BACKLOG-017 [core] Spawn 5 NPCs with distinct species + names + personalities  *(shipped: cycle 5, 2026-05-29)*
- [x] BACKLOG-018 [ai] NPC-to-NPC interaction — movement + meeting spine (dinos wander, adjacency recorded); LLM dino-to-dino dialogue → BACKLOG-052  *(shipped: cycle 11, 2026-05-30)*
- [x] BACKLOG-019 [emergent] Gossip propagation — NPC who sees event tells next NPC they meet  *(shipped: cycle 20, 2026-05-30)*
- [x] BACKLOG-020 [emergent] Role emergence — chef / guard / artist / gossip surfaces from behavior, displayed in collection book  *(shipped: cycle 21 — gossip/homebody/socialite/wanderer derived from behavior tallies, shown as role tags + in the book, 2026-05-30)*

## Pokemon flavor

- [x] BACKLOG-021 [pokemon] Collection book UI — list every NPC met, hearts, role, last-seen, sprite  *(shipped: cycle 21 — book lens shows every dino incl. hatchlings, species, hearts, top bond, emergent role, lineage, rumors heard, 2026-05-30)*
- [ ] BACKLOG-022 [pokemon] Befriend ritual — feed favorite item N times → "caught" → entered in book formally
- [ ] BACKLOG-023 [pokemon] Evolution / molt — NPC grows up after X in-game days, sprite swap, personality may shift
- [ ] BACKLOG-024 [pokemon] Rivalry duels — two NPCs with low affinity may stage a non-lethal duel; player can watch
- [ ] BACKLOG-025 [pokemon] Gym landmarks — three named locations run by veteran NPCs; visit grants flavor lore

## Stardew flavor

- [ ] BACKLOG-026 [social] Festivals — once per in-game season, NPCs gather at a landmark, dialog tree
- [ ] BACKLOG-027 [social] Romance + pair-bonding — high-affinity NPC pairs may pair up; visible in collection book
- [ ] BACKLOG-028 [social] Seasons + weather — spring/summer/fall/winter, rain/sun/storm tints + NPC dialog hooks

## Project Sid flavor (emergent)

- [ ] BACKLOG-029 [emergent] Inventory + crafting — NPCs gather, trade, craft simple items
- [ ] BACKLOG-030 [emergent] Religion seed — one NPC may spontaneously start preaching; affinity-weighted spread
- [ ] BACKLOG-031 [emergent] Governance — at threshold population, NPCs vote on a simple rule (e.g., quiet hours)
- [ ] BACKLOG-032 [emergent] Roles persist across cycles — guard NPC keeps guarding even after the triggering event

## Art (Artist routine fires when these populate)

- [ ] BACKLOG-033 [art] Grass tileset — Gen3 palette, 16x16, grass + path + water-edge
- [ ] BACKLOG-034 [art] Triceratops sprite — 4-dir walk + idle, 32x32
- [ ] BACKLOG-035 [art] Player avatar — 4-dir walk + idle, 32x32, paleontologist-y
- [ ] BACKLOG-036 [art] Dialog box frame — Gen3-style border

## Infra

- [x] BACKLOG-053 [core] Sane controls — WASD movement, E to interact, F to give (Z/G/arrows kept as aliases; save-export moved to O). Operator feedback.  *(shipped: cycle 13, 2026-05-30)*
- [x] BACKLOG-054 [infra] Build stamp + fresh-restart script — vite injects `__BUILD_TIME__` (console + on-screen `build HH:MM:SS` label + `window.__buildTime`) so a restart is visible; `npm run dev:fresh` / `npm run kill` free port 5173 to prevent orphan dev servers serving a stale build.  *(shipped: operator, 2026-05-30)*
- [x] BACKLOG-047 [infra] Human spot-check WebLLM live inference — confirmed working (load lag → generated reply); surfaced persona bug → BACKLOG-048  *(confirmed: human, cycle 8)*
- [ ] BACKLOG-037 [infra] GitHub Actions CI — npm run build, vitest, playwright on every push
- [ ] BACKLOG-038 [infra] Vitest scaffold — at least one passing unit test
- [ ] BACKLOG-039 [infra] Playwright scaffold — at least one passing e2e test (game loads)
- [ ] BACKLOG-040 [infra] Save format versioning — `save.version` field + migration hook
- [x] BACKLOG-046 [infra] Vite host bind — `host: true` so Playwright reaches `127.0.0.1` (was IPv6-only)  *(shipped: cycle 2, 2026-05-29)*

## Cycle 1 lore additions (2026-05-25)

- [x] BACKLOG-041 [emergent] Sleeping huddles — at night, bonded dinos walk to the den tile and huddle (💤), strengthening the bond each shared night; disperse at dawn  *(shipped: cycle 18, 2026-05-30)*
- [x] BACKLOG-042 [pokemon] Egg phase — when two high-affinity NPCs share a sleeping huddle on a clear night, an egg sprite may appear nearby. Hatches into a new NPC after 3 in-game days with traits blended from the parents.  *(shipped: cycle 19, 2026-05-30)*
- [ ] BACKLOG-043 [ai] Personality drift — over many in-game weeks, an NPC's personality traits can shift toward those of the NPC they spend most ticks adjacent to. Very slow (cap: one trait swap per in-game month).
- [x] BACKLOG-048 [ai] In-character dino dialogue — strengthen the WebLLM system prompt (+ one-shot example) and clean the reply so dinos never speak as an AI assistant ("how can I assist?"). Surfaced by the BACKLOG-047 spot-check.  *(shipped: cycle 8, 2026-05-30)*
- [x] BACKLOG-049 [ai] Offload WebLLM to a Web Worker — model load/inference currently runs on the main thread and lags gameplay; move to `CreateWebWorkerMLCEngine`. (+ brain-status readout & per-reply source tag)  *(shipped: cycle 10, 2026-05-30)*
- [x] BACKLOG-051 [ai] Richer dialogue context — feed time-of-day (dayPhase), the dino's mood, and the player's friendship level into the prompt so replies vary beyond greetings.  *(shipped: cycle 12, 2026-05-30)*
- [x] BACKLOG-052 [ai] LLM-driven NPC↔NPC dialogue — dinos drift toward each other, and on meet one speaks a brain-generated line in a floating bubble (🧠-tagged); meeting tally bumps.  *(shipped: cycle 14, 2026-05-30)*
- [ ] BACKLOG-044 [emergent] Lost-item lore — when the player drops an item and an NPC picks it up later, the NPC's brain may invent a story about its origin. Story is stored in NPC memory and may surface in unrelated dialog later.
- [ ] BACKLOG-045 [social] Catchphrase emergence — first non-trivial line an NPC speaks each in-game morning is logged. If the same line surfaces 3+ days running, it becomes that NPC's catchphrase, shown in the collection book.

## Vivarium / fishbowl (2026-05-30 — operator: "treat this like a mini dino fishbowl"; see studio/lore/vivarium.md)

- [x] BACKLOG-056 [art] The Glass — vivarium frame: rounded glass rim, edge vignette, reflection glare; the world reads as enclosed in a bowl  *(shipped: cycle 22, 2026-05-30)*
- [x] BACKLOG-057 [core] Tap the glass — click the glass and nearby dinos startle (timid bolt, bold investigate); reads personality + bonds  *(shipped: cycle 23, 2026-05-30)*
- [ ] BACKLOG-058 [pokemon] The Plaque — engraved nameplate under the bowl: "VIVARIUM — Pocket Cretaceous", live population, day count, oldest lineage
- [ ] BACKLOG-059 [social] Feeding hatch — drop food from the top of the bowl; it falls and the cast swarms it (reframes gifting as keeping)
- [ ] BACKLOG-060 [infra] Idle / ambient mode — no input for a while → HUD fades + camera slowly drifts; the bowl as a quiet desktop companion

## Mobile (deferred, do not pick until charter clears)

- [ ] BACKLOG-100 [infra] Capacitor wrap — only after game is fun on desktop. Charter must clear.
- [ ] BACKLOG-101 [infra] Native LLM plugin swap on mobile

---

## Closed log

### Cycle 0 — 2026-05-25 — Bootstrap
- BACKLOG-001 shipped — walkable map
- BACKLOG-002 shipped — Rex spawned
- BACKLOG-003 shipped — dialog box (Z key)
- BACKLOG-004 shipped — NPCBrain interface + stub

### Cycle 1 — 2026-05-26
- BACKLOG-007 shipped — World tick clock (1 real second = 1 in-game minute; HUD display; hour event; 9/9 AC pass)

### Cycle 2 — 2026-05-29
- BACKLOG-008 shipped — Day/night palette (full-map tint overlay lerped across the day off the clock; 8/8 AC pass)
- BACKLOG-046 shipped — Vite `host: true` (fixed BUG-001 IPv6-only bind; default Playwright config now works)

### Cycle 3 — 2026-05-29
- BACKLOG-009 shipped — Save/load via IndexedDB (restore time + player on boot, auto-save on the hour, JSON export on E; pure serialize split from IDB I/O; 9/9 AC pass)

### Cycle 4 — 2026-05-29
- BACKLOG-010 shipped — NPC personality traits (5 axes seeded deterministically from name, `describePersonality` phrase, fed into NPCContext; stub mood now reflects personality; 9/9 AC pass)

### Cycle 5 — 2026-05-29
- BACKLOG-017 shipped — Spawn 5 NPCs (pure `ROSTER` of Rex/Mossback/Sunny/Twitch/Glade, distinct species/tiles/colors, name-seeded personalities; Rex anchored at index 0; 9/9 AC pass)

### Cycle 6 — 2026-05-29
- BACKLOG-016 shipped — Friendship hearts (greet raises affinity, **C** shows a 0–10 heart panel per dino, persisted in the save; gain scaled by warmth/sociability; 9/9 AC pass)

### Cycle 7 — 2026-05-30
- BACKLOG-005 shipped — WebLLM-backed brain (Qwen2.5-0.5B, lazy-loaded behind NPCBrain; graceful canned fallback while loading / without WebGPU; shared across all dinos; 9/9 automatable AC pass, live inference deferred to human spot-check BACKLOG-047)
- BACKLOG-047 confirmed — human spot-check: live WebLLM inference works (load lag → generated reply); surfaced the persona bug → BACKLOG-048

### Cycle 8 — 2026-05-30
- BACKLOG-048 shipped — In-character dino dialogue (hardened anti-assistant system prompt + one-shot example; pure `cleanReply` strips quotes/assistant-voice and keeps the first in-character sentence; 9/9 automatable AC pass, voice-check human-pending)

### Cycle 9 — 2026-05-30
- BACKLOG-015 shipped — Gift system (5 items, pure `giftReaction` by personality fit → loved/liked/neutral/disliked; affinity delta via existing friendship store; held-item HUD + G to give; 9/9 AC pass)

### Cycle 10 — 2026-05-30
- BACKLOG-049 shipped — WebLLM Web Worker offload (model runs off the render thread; build confirms web-llm in a separate worker chunk) + brain-status HUD (🧠 thinking/ready/offline) and per-reply source tag (🧠 on model-written lines); 8/8 automatable AC pass, smoothness human-pending

### Cycle 11 — 2026-05-30
- BACKLOG-018 shipped — NPC movement + meeting spine (dinos wander on a throttled tick, stay in bounds, adjacency recorded as a symmetric pairwise meeting counter with a label flash); LLM dino-to-dino dialogue deferred to BACKLOG-052; 8/8 AC pass

### Cycle 12 — 2026-05-30
- BACKLOG-051 shipped — Richer dialogue context (time-of-day, mood, and friendship level woven into the WebLLM prompt; greet line varies by relationship); reuses dayPhase/moodFromTraits/heartsFromPoints; `__greetPrompt` dev hook; 7/7 AC pass. Targets "mostly hellos".
