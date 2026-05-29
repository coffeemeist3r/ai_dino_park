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
- [ ] BACKLOG-005 [ai] WebLLM-backed brain — implement NPCBrain with WebLLM + Qwen2.5-0.5B, lazy-loaded on first dialog
- [ ] BACKLOG-006 [ai] Device probe — detect VRAM and pick 0.5B / 1.5B / 3B, write to `config.json`
- [x] BACKLOG-007 [core] World tick clock — in-game minute every real second, hour event broadcast  *(shipped: cycle 1, 2026-05-26)*
- [x] BACKLOG-008 [core] Day/night palette shift — tint overlay based on in-game hour  *(shipped: cycle 2, 2026-05-29)*
- [x] BACKLOG-009 [core] Save / load via IndexedDB — auto-save every in-game hour, manual export to JSON  *(shipped: cycle 3, 2026-05-29)*

## NPC depth

- [x] BACKLOG-010 [ai] NPC personality traits — 5 axes (curious/cautious, social/solitary, etc.), seeded at spawn, fed into brain prompt  *(shipped: cycle 4, 2026-05-29)*
- [ ] BACKLOG-011 [ai] NPC memory store — observation log (last N events), reflection summary built daily
- [ ] BACKLOG-012 [ai] NPC daily plan — at dawn, NPC generates a list of intended activities; world tick consults it
- [ ] BACKLOG-013 [ai] NPC relationships — pairwise affinity, updated by interactions
- [ ] BACKLOG-014 [ai] Reflection pass — at dusk, NPC summarizes day → memory
- [ ] BACKLOG-015 [social] Gift system — give item to NPC, affinity changes based on personality fit
- [~] BACKLOG-016 [social] Friendship hearts UI — 0–10 hearts per NPC, visible in collection book

## Multi-NPC world

- [x] BACKLOG-017 [core] Spawn 5 NPCs with distinct species + names + personalities  *(shipped: cycle 5, 2026-05-29)*
- [ ] BACKLOG-018 [ai] NPC-to-NPC interaction — when two NPCs adjacent at a tick, they may converse (LLM dialog), affinity updates
- [ ] BACKLOG-019 [emergent] Gossip propagation — NPC who sees event tells next NPC they meet
- [ ] BACKLOG-020 [emergent] Role emergence — chef / guard / artist / gossip surfaces from behavior, displayed in collection book

## Pokemon flavor

- [ ] BACKLOG-021 [pokemon] Collection book UI — list every NPC met, hearts, role, last-seen, sprite
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

- [ ] BACKLOG-037 [infra] GitHub Actions CI — npm run build, vitest, playwright on every push
- [ ] BACKLOG-038 [infra] Vitest scaffold — at least one passing unit test
- [ ] BACKLOG-039 [infra] Playwright scaffold — at least one passing e2e test (game loads)
- [ ] BACKLOG-040 [infra] Save format versioning — `save.version` field + migration hook
- [x] BACKLOG-046 [infra] Vite host bind — `host: true` so Playwright reaches `127.0.0.1` (was IPv6-only)  *(shipped: cycle 2, 2026-05-29)*

## Cycle 1 lore additions (2026-05-25)

- [ ] BACKLOG-041 [emergent] Sleeping huddles — at night, NPCs with affinity ≥ 3 gather at a fixed tile and form a stacked sprite pile until morning. Small affinity boost each shared night.
- [ ] BACKLOG-042 [pokemon] Egg phase — when two high-affinity NPCs share a sleeping huddle on a clear night, an egg sprite may appear nearby. Hatches into a new NPC after 3 in-game days with traits blended from the parents.
- [ ] BACKLOG-043 [ai] Personality drift — over many in-game weeks, an NPC's personality traits can shift toward those of the NPC they spend most ticks adjacent to. Very slow (cap: one trait swap per in-game month).
- [ ] BACKLOG-044 [emergent] Lost-item lore — when the player drops an item and an NPC picks it up later, the NPC's brain may invent a story about its origin. Story is stored in NPC memory and may surface in unrelated dialog later.
- [ ] BACKLOG-045 [social] Catchphrase emergence — first non-trivial line an NPC speaks each in-game morning is logged. If the same line surfaces 3+ days running, it becomes that NPC's catchphrase, shown in the collection book.

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
