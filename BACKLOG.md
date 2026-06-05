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
- [ ] BACKLOG-102 [ai] Brain model upgrade: Qwen2.5 → Qwen3.5 (edge-class jump for emergence) — retarget the `MODELS` table in `game/src/ai/deviceProbe.ts` to the newer Qwen3.5 ladder (tiny `Qwen3.5-0.8B-q4f16_1-MLC` / small `Qwen3.5-2B-q4f16_1-MLC` / medium `Qwen3.5-4B-q4f16_1-MLC`; `Qwen3.5-9B` reserved for native/desktop). All confirmed present in WebLLM prebuilt config (verified 2026-06-01). Re-tune `pickTier` score thresholds — new ladder is heavier per tier (0.8/2/4B vs 0.5/1.5/3B), so an old PC/phone must not get shoved onto 4B and OOM. Update labels + tests asserting old model IDs. **GATE:** Qwen3.5 drops the `/think` `/no_think` inline tokens — thinking is on by default, toggled only via the `enable_thinking` param (`chat_template_kwargs`). Confirm WebLLM exposes `chat_template_kwargs`/`extra_body` on its chat-completion call. If yes → Qwen3.5 (param toggle is cleaner; set `enable_thinking:false` for chitchat, `true` for big decisions). If no → fall back to **Qwen3-4B**, where the inline `/think` tokens are plain prompt text and always work. Payoff: per-call thinking depth unlocks BACKLOG-030 (religion) / -031 (governance) reasoning. Keep the `NPCBrain` boundary intact — no WebLLM leak past `brain.ts`.
- [ ] BACKLOG-103 [ai] Per-dino persona authored from lore (CHARTER "Living minds") — replace the shared one-line roster `personality` string with a real per-dino **persona**: backstory, quirks, speech tics, fears, wants. Source per CHARTER: **LLM-authored from world lore** (`studio/lore/`) where the device tier allows, **deterministic procedural fallback** (extend `personality.ts` name-seeding) on tiny-tier / no-WebGPU / Node tests. **Generate once** — at first spawn/first meet — then **cache + persist in the save** (reuse the IndexedDB save + memory-store pattern); never regenerate per message. Feed the stored persona into `buildMessages` in place of today's `ctx.personality`. Tests assert the **pipeline** (generated → cached → persisted → fed to prompt → fallback fires with no model), **not** the generated prose. Inference stays behind `NPCBrain`/`brain.ts`. Makes Rex unmistakably Rex; kills cross-dino sameness at scale.
- [ ] BACKLOG-104 [emergent] Action-prompt layer — dinos *act* from their persona, not only reply (CHARTER "Living minds": minds act). A per-dino prompt path that turns persona + memory + world state into a chosen **action/intent** (where to go, what to do, how to react to an event), consumed by the world tick — not just dialogue. Spine for BACKLOG-012 (daily plan), -014 (reflection), -032 (roles persist). With Qwen3/3.5 thinking (BACKLOG-102), big choices can run in thinking mode, chitchat without. Start small: one persona-driven intent per dino per tick window, observable in-world. Deterministic fallback intent for no-model devices. Behind `NPCBrain`.
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

## Art (procedural vector pipeline — Artist fires per character)

> Medium is **code, not an image API** (CHARTER v2 / STYLE-GUIDE): flat-vector rigs in
> `game/src/art/`, baked to animated Canvas textures, one character per sub-agent. No keys.

- [x] BACKLOG-117 [art] Procedural vector art pipeline — pure shape rigs (`art/dinoArt.ts`) + Phaser bake/animation glue (`art/bake.ts`), `hasArt()` graceful fallback to flat shapes, colour-keyed idempotent bakes; sub-agent-per-character workflow defined in STYLE-GUIDE + routine 7. Unblocks all art after 29 dark cycles.  *(shipped: operator, 2026-06-03)*
- [x] BACKLOG-118 [art] Proof dino — Rex the triceratops rendered via the pipeline: frill + brow/nose horns silhouette, derived 7-colour palette, 4-frame amble loop. Replaces his rectangle; other species stay on fallback until drawn.  *(shipped: operator, 2026-06-03)*
- [~] BACKLOG-034 [art] Remaining dino species rigs — vector walk loops for stegosaurus / brontosaurus / compsognathus / parasaurolophus (one sub-agent each), distinct silhouettes  *(in progress: brontosaurus/Sunny shipped cycle 31-art via `SPECIES_ART` registry — long-neck silhouette; stegosaurus/compsognathus/parasaurolophus still on flat fallback)*
- [ ] BACKLOG-035 [art] Player avatar — vector idle + walk loop, paleontologist-y
- [ ] BACKLOG-033 [art] Grass / path / water tiles — flat-vector, seamless 32×32
- [ ] BACKLOG-036 [art] Dialog box frame — soft rounded vector border (replace the current flat panel)

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
- [x] BACKLOG-058 [pokemon] The Plaque — engraved nameplate under the bowl: "VIVARIUM — Pocket Cretaceous", live population, day count, oldest lineage  *(shipped: cycle 24 — title + day + population + family-tree generations, 2026-05-30)*
- [x] BACKLOG-059 [social] Feeding hatch — drop food from the top of the bowl; it falls and the cast swarms it (reframes gifting as keeping)  *(shipped: cycle 25 — H drops 🍖, eager in-range dinos swarm, first to reach eats; pure world/feeding.ts, 2026-05-31)*
- [x] BACKLOG-060 [infra] Idle / ambient mode — no input for a while → HUD fades + camera slowly drifts; the bowl as a quiet desktop companion  *(shipped: cycle 26, 2026-05-31)*

## Cycle 25 lore additions — feeding (2026-05-31)

- [x] BACKLOG-061 [emergent] Food favorites — each dino prefers a food (from personality, like gifts); grabbing its favorite at the hatch = extra-happy (bigger bump, 😋) and remembered. Builds on 059.  *(shipped: cycle 27 — typed hatch feed 🍖🌿🐟🍓, per-dino favorite via reused giftScore, favorite eat = +9/😋/"favorite" memory and rushed harder, 2026-06-01)*
- [ ] BACKLOG-062 [emergent] Scramble standoff — two dinos reaching dropped food the same tick: the bolder wins, the loser sulks (memory + 😤), a low-bond pair loses a little bond.
- [ ] BACKLOG-063 [social] Begging at the glass — a long-unfed dino drifts to the front wall and looks up at the keeper (📣), nudging a food drop.
- [ ] BACKLOG-064 [emergent] Hoarder role — the dino that wins the food scramble most often emerges as the `hoarder` role tag, derived from feed tallies.
- [ ] BACKLOG-065 [pokemon] Feeding log in the book — per-dino "fed Nx · last Day M" line in the collection book.

## Cycle 27 lore additions — taste (2026-06-01)

- [ ] BACKLOG-066 [emergent] Taste talk — a dino that just ate its favorite can let it slip in dialogue/gossip ("oh, I love fish"); learn a palate by chatting, not only by the 😋. Builds on 061.
- [ ] BACKLOG-067 [social] Keeper-loaded hatch — choose which food to drop (cycle the loaded feed, shown in HUD) instead of a random handful; the mirror of the `[`/`]` gift selector, for the hatch.
- [ ] BACKLOG-068 [emergent] Acquired taste — a dino fed the same non-favorite food many times slowly warms to it (tiny capped preference drift in memory); palates aren't fixed forever.
- [ ] BACKLOG-069 [pokemon] Menu in the book — the collection book reveals each dino's favorite food, but only after you've fed it that food once. A "fill in the menu" sub-goal.
- [ ] BACKLOG-070 [emergent] Picky vs. gobble — prickly (low-agreeableness) dinos refuse non-favorite food and leave it; warm dinos eat anything. Personality shapes who'll settle, not just who rushes.

## Realtime fishbowl (2026-06-01 — operator: "make time realtime so I can just leave it running")

- [x] BACKLOG-105 [core] Wall-clock-anchored time + configurable scale — *(shipped: cycle 28 — see closed log, 2026-06-01)*
- [x] BACKLOG-106 [emergent] Offline catch-up ("while you were away") — *(shipped: cycle 29, 2026-06-02)*
- [ ] BACKLOG-107 [ai] Inference budget for continuous life — realtime + persona-driven action (BACKLOG-104) means dinos would think 24/7 and peg the GPU. Add a global inference governor: sparse cadence, procedural actions by default, LLM reserved for notable beats / on-screen dinos / player interaction; pause/slow generation when the tab is idle or backgrounded (`visibilitychange`). Mandatory before continuous action ships — protects battery/thermals. Behind the `NPCBrain` boundary.

## Cycle 28 lore additions — realtime rituals (2026-06-01)

- [ ] BACKLOG-108 [emergent] Dawn stretch — at the in-game dawn boundary, idle dinos play a visible wake beat (a little ⤴ stretch + a "woke at dawn" memory). Turns realtime's slow day into a daily ritual you can catch. Builds on 105.
- [ ] BACKLOG-109 [emergent] Diurnal vs. nocturnal temperament — a dino's energy/curiosity seeds whether it's a day-dino or a night-owl; night-owls wander at night while the rest huddle, day-dinos doze. With a 24h realtime day, *who's up when* becomes a personality tell. Builds on 105 + huddles (041).
- [ ] BACKLOG-110 [social] Hour-aware greeting — a dino's first player line of the real day leans on the hour (a yawn near dawn, a sleepy note at night) layered onto the existing context prompt. Small living touch that realtime makes meaningful.
- [ ] BACKLOG-111 [pokemon] Real-age on the plaque — the plaque/book shows a lineage's age anchored to wall-clock days ("founded 3 days ago"), reading the realtime clock so leaving it running visibly accrues history.

## Cycle 29 lore additions — the keeper goes away (2026-06-02)

- [x] BACKLOG-112 [emergent] Homecoming nuzzle — after a long away gap, the dino with the highest player-friendship plays a small "welcome back" beat (👋 bubble) on return, reading the BACKLOG-106 away duration. Builds on 106.  *(shipped: cycle 30, 2026-06-03)*
- [ ] BACKLOG-113 [emergent] Drift apart while away — the away fast-forward isn't all warmth: a low-bond pair that never huddles loses a little bond over a long absence (capped decay), so the homecoming digest can carry a falling-out, not just companionship. Builds on 106.
- [ ] BACKLOG-114 [pokemon] Away-log in the book — the collection book keeps the last "while you were away" digest so you can re-read what the bowl got up to. Builds on 106 + 021.
- [ ] BACKLOG-115 [emergent] Night-owl absence — once diurnal/nocturnal temperament (109) lands, feed it into the away fast-forward: night-owls rack up more shared nights while away, so *who* grew closer becomes a personality tell. Cross-links 106 + 109.
- [ ] BACKLOG-116 [social] Missed-you memory — a long absence leaves each dino a faint "the keeper was gone a while" memory that can color the very next greeting (layers onto 110's hour-aware line). Builds on 106.

## Cycle 30 lore additions — the keeper's comings and goings (2026-06-03)

- [ ] BACKLOG-119 [emergent] Goodbye glance — the inverse of the homecoming: as the tab leaves (`visibilitychange` → hidden) after a real session, the closest dino throws a brief 👀 toward the keeper before the bowl goes quiet. A living bookend to 112.
- [x] BACKLOG-120 [social] Jealous nuzzle — when two dinos are nearly tied for closest, the runner-up sulks (😒) the moment the homecoming dino gets its welcome-back beat. Distinctness through a little rivalry. Builds on 112.  *(shipped: cycle 31, 2026-06-04)*
- [ ] BACKLOG-121 [emergent] Keeper-shaped routine — a very-high-friendship dino learns the real hour you usually come back (from save timestamps) and drifts to the glass front around then, anticipating you. Anticipation as emergence. Builds on 112 + realtime (105).
- [ ] BACKLOG-122 [pokemon] Homecoming streak — returning on consecutive real days builds a "visit streak" surfaced on the plaque; miss a day and it resets. A gentle Stardew daily pull.

## Cycle 31 lore additions — the keeper's little court (2026-06-04)

- [ ] BACKLOG-123 [emergent] Sulk shakeoff — a dino left sulking (😒 jealous / 😤 standoff loser) clears its funk after a short while *or* a kind keeper gesture (greet/feed), logging a "got over it" memory; negative moods resolve instead of sticking. Builds on 120 / 062.
- [ ] BACKLOG-124 [emergent] Homecoming chorus — when several dinos are near-tied at the top of player-friendship, the homecoming beat becomes a small staggered chorus (top 2–3 each throw a 👋), scaling the welcome with how many dinos you've truly befriended. Builds on 112.
- [ ] BACKLOG-125 [social] Greeting the runner-up — greeting the jealous runner-up right after a homecoming gives an outsized affinity bump and flips 😒 → 😊 ("you noticed me"); jealousy is repairable through attention. Builds on 120.
- [ ] BACKLOG-126 [emergent] Eavesdropping envy — a low-friendship dino that *witnesses* another get a homecoming/favorite beat files a faint "the keeper likes them more" memory that can wistfully colour its next line; only fires when its own friendship is low. Distinctness through insecurity. Builds on 112 / 120.
- [ ] BACKLOG-127 [pokemon] Inner-circle ladder — the collection book ranks your top-3 closest dinos ("inner circle"), making the homecoming selection legible to the player and turning friendship into a visible standing. Builds on 112 / 016 / 021.

## Cycle 32 lore additions — the attention economy (2026-06-05)

- [ ] BACKLOG-128 [emergent] Forgiving heart — a dino repaired before (125) files "the keeper always makes it right"; next time it's the jealous runner-up, its sulk softens (quicker/warmer turn). Repaired bonds learn to trust. Builds on 125.
- [ ] BACKLOG-129 [emergent] Festering slight — a runner-up left un-repaired across multiple homecomings lets the slight harden into a tiny capped bond-cooling toward the *favored dino* (not the keeper), so chronic neglect curdles into dino-vs-dino rivalry. Builds on 120 / 125 / 113.
- [ ] BACKLOG-130 [social] Comforting nuzzle — when a dino sulks (😒), its closest dino-friend (highest bond) drifts over and throws a 🫂, nudging the funk down; friendship between dinos blunts jealousy. Builds on 120 / 013.
- [ ] BACKLOG-131 [pokemon] Fondest memory — the collection book surfaces each dino's single happiest logged beat (favorite eaten, repaired, homecoming): a "what this dino treasures" line. Builds on 011 / 021.

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

### Cycle 29 — 2026-06-02
- BACKLOG-106 shipped — Offline catch-up ("while you were away"): pure `world/away.ts` reads the real gap since `savedAt` × scale and fast-forwards cheaply (no per-tick, no LLM) — bonded pairs drift closer + gain a "kept each other company" memory, a "While you were away…" digest greets the player; span capped at 7 in-game days; additive save. 13 unit + 2 e2e; 9/9 AC pass. Spine for 112–116.

### Cycle 31 — 2026-06-04
- BACKLOG-120 shipped — Jealous nuzzle: when the homecoming 👋 fires, a near-tied runner-up (within 10 pts / one heart of the closest) sulks `Hmph. 😒` and keeps a "the keeper fussed over X" memory; clear gap or lone favorite → no sulk. Pure additive `jealous` field on `homecoming.ts` (generalized `closest`→`topBy(exclude?)`, shared alpha tie-break, exact-top-tie pinned); WorldScene glue floats the 2nd bubble + folds the memory via `applyHomecomingMemory`; no points change; additive save. 8 unit + 2 e2e; 9/9 AC pass. Keystone for 123/125/126.

### Cycle 30 — 2026-06-03
- BACKLOG-112 shipped — Homecoming nuzzle: after a long absence, your closest dino (highest player-friendship) gets a heart-graded 👋 "welcome back" bubble on return + a faint "keeper came home" memory. Pure `world/homecoming.ts` (max-friendship, alpha tie-break, gated at 6 in-game hours), WorldScene glue only; reuses heartsFromPoints + remember; no hearts change; additive save. 8 unit + 2 e2e; 9/9 AC pass. First personal beat on the cycle-29 spine; unblocks 119–122.
