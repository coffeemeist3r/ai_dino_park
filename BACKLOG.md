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
- [x] BACKLOG-102 [ai] Brain model upgrade: Qwen2.5 → Qwen3.5 (edge-class jump for emergence) — retarget the `MODELS` table in `game/src/ai/deviceProbe.ts` to the newer Qwen3.5 ladder (tiny `Qwen3.5-0.8B-q4f16_1-MLC` / small `Qwen3.5-2B-q4f16_1-MLC` / medium `Qwen3.5-4B-q4f16_1-MLC`; `Qwen3.5-9B` reserved for native/desktop). All confirmed present in WebLLM prebuilt config (verified 2026-06-01). Re-tune `pickTier` score thresholds — new ladder is heavier per tier (0.8/2/4B vs 0.5/1.5/3B), so an old PC/phone must not get shoved onto 4B and OOM. Update labels + tests asserting old model IDs. **GATE:** Qwen3.5 drops the `/think` `/no_think` inline tokens — thinking is on by default, toggled only via the `enable_thinking` param (`chat_template_kwargs`). Confirm WebLLM exposes `chat_template_kwargs`/`extra_body` on its chat-completion call. If yes → Qwen3.5 (param toggle is cleaner; set `enable_thinking:false` for chitchat, `true` for big decisions). If no → fall back to **Qwen3-4B**, where the inline `/think` tokens are plain prompt text and always work. Payoff: per-call thinking depth unlocks BACKLOG-030 (religion) / -031 (governance) reasoning. Keep the `NPCBrain` boundary intact — no WebLLM leak past `brain.ts`.  *(shipped: operator, 2026-06-11 — GATE PASSED: web-llm 0.2.84 ships the full Qwen3.5 ladder prebuilt (verified in `prebuiltAppConfig.model_list`; 0.8B is `low_resource: true`) AND exposes `extra_body.enable_thinking` on chat completions. MODELS retargeted 0.8B/2B/4B; `pickTier` re-tuned — medium now also demands a 2GB storage-buffer bind so an 8GB machine with a modest GPU gets 2B, not a 4B OOM; chitchat calls send `enable_thinking: false` (thinking mode reserved for the 104 action layer); `cleanReply` drops `<think>` blocks, empty or populated. Boundary intact. 350 unit / 124 e2e green, full run. **Live spot-check CONFIRMED (operator phone, 2026-06-11): Qwen3.5-0.8B loads and generates on Android via WebGPU** — inference slow-but-usable; the voice runs vivid-to-unhinged at temperature 0.9 (acceptable per the emergence bias; a tier-aware temperature is a future knob). Spot-check surfaced token-cap truncation (mid-word cut-offs) — fixed same day in `cleanReply`: dangling fragments dropped when a complete sentence exists, lone fragments end at a word boundary with an ellipsis.)*
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
- [x] BACKLOG-034 [art] Remaining dino species rigs — vector walk loops for stegosaurus / brontosaurus / compsognathus / parasaurolophus (one sub-agent each), distinct silhouettes  *(shipped cycle 35-art — **5/5 cast drawn**: stegosaurus/Mossback added (staggered double-row dorsal plates + thagomizer), completing the set; the rectangle-fallback control was re-pointed off the real cast onto a genuine never-drawn species (`__hasArt('pterodactyl')===false`) across the cycle-030/031/032/033 art specs, per the 2026-06-07 operator policy. Earlier progress: brontosaurus/Sunny (cycle 31-art) + parasaurolophus/Glade (cycle 32-art, tube-crest) + compsognathus/Twitch (cycle 33-art, the cast's only biped) shipped via `SPECIES_ART` registry; only stegosaurus/Mossback remains on flat fallback — 3 of 4 drawn. Mossback is held as the deliberate rectangle control in the cycle-030/031/032/033 art e2e specs; drawing it must update those specs in the same fire. **Operator decision (2026-06-07): keep the rectangle-fallback control, but exercise it via a genuine no-art subject (e.g. assert `hasArt('<unknown-species>')===false` renders a rectangle), NOT by holding the real cast member Mossback rectangular forever. So a future art fire is free to draw Mossback (→ 5/5) as long as it re-points the fallback control to a never-drawn species in the same fire.**)*
- [ ] BACKLOG-035 [art] Player avatar — superseded by 158 (selectable robot observers); reframed **pixel** per CHARTER v4
- [ ] BACKLOG-033 [art] Grass / path / water tiles — **Gen3 pixel** (CHARTER v4), 16×16 grids baked ×2, seamless
- [ ] BACKLOG-036 [art] Dialog box frame — **Gen3 pixel box** (CHARTER v4): off-white fill, stepped rounded corners, dark frame line (replace the current flat panel)

## Infra

- [x] BACKLOG-053 [core] Sane controls — WASD movement, E to interact, F to give (Z/G/arrows kept as aliases; save-export moved to O). Operator feedback.  *(shipped: cycle 13, 2026-05-30)*
- [x] BACKLOG-054 [infra] Build stamp + fresh-restart script — vite injects `__BUILD_TIME__` (console + on-screen `build HH:MM:SS` label + `window.__buildTime`) so a restart is visible; `npm run dev:fresh` / `npm run kill` free port 5173 to prevent orphan dev servers serving a stale build.  *(shipped: operator, 2026-05-30)*
- [x] BACKLOG-047 [infra] Human spot-check WebLLM live inference — confirmed working (load lag → generated reply); surfaced persona bug → BACKLOG-048  *(confirmed: human, cycle 8)*
- [ ] BACKLOG-037 [infra] GitHub Actions CI — npm run build, vitest, playwright on every push
- [ ] BACKLOG-038 [infra] Vitest scaffold — at least one passing unit test
- [ ] BACKLOG-039 [infra] Playwright scaffold — at least one passing e2e test (game loads)
- [ ] BACKLOG-040 [infra] Save format versioning — `save.version` field + migration hook
- [x] BACKLOG-046 [infra] Vite host bind — `host: true` so Playwright reaches `127.0.0.1` (was IPv6-only)  *(shipped: cycle 2, 2026-05-29)*
- [x] BACKLOG-188 [infra] Mobile viewport scaling — the game now ships as a PWA (GitHub Pages, 2026-06-11) and the operator's first phone session found the canvas doesn't fit the screen: `main.ts` creates a fixed 640×480 canvas with no Scale Manager. Add Phaser scale config (`scale: { mode: Phaser.Scale.FIT, autoCenter: CENTER_BOTH }`) so the bowl letterboxes to any viewport, and verify the glass/HUD overlays and tap-glass pointer→world coordinates still land under a scaled canvas. Display-fit only — touch *controls* (virtual stick / tap-to-interact for the keyboard-only bindings) are a separate, larger item. Operator feedback, 2026-06-11.  *(shipped: operator, 2026-06-11 — `Scale.FIT` + `CENTER_BOTH` in main.ts, `#game` fills the viewport so FIT has a box; verified 549×412 / 412×309 / 960×720 letterboxing via `game/scripts/check-scale.mjs`; pointer worldX/Y untransform through the Scale Manager so tap-glass holds; 325 unit / 116 e2e green (1 catalogued cold-boot flake, green isolated). Follow-up same day from the operator's first live phone session: rotation didn't refit and landscape cut the bowl off — mobile `100vh` overshoot fixed with `100dvh`, explicit `scale.refresh()` on resize/orientationchange, manifest orientation `landscape`→`any` (the operator watches in portrait); rotation refit covered in check-scale.mjs; 325/116 green, no flake.)*
- [x] BACKLOG-189 [infra] Touch controls — the phone PWA was watch-only (every binding keyboard-only). Operator-chosen scheme: fixed virtual joystick bottom-left feeding the same movement path as WASD; Talk(E)/Feed(🍖)/More(⋯) buttons bottom-right; a More sheet covering the rest of the surface (gift, item-cycle, lens, hearts, observer, scan, time, export); and tap chips [1][2][3][✕] replacing the cluster while a tone/keeper menu or dialog is up — the number menus were unreachable on phones. Pure `input/touch.ts` (stick vector w/ deadzone+clamp, layout, hit tests); WorldScene glue only. Layer builds only when the primary pointer is coarse (`pointer: coarse` — touch-laptops keep the desktop view); `__setTouch`/`__touchVec`/`__touchLayout` hooks let desktop Playwright drive it by mouse. Taps on the layer are guarded out of the glass-tap path; a dialog opening mid-drag releases the stick. Operator request + scheme pick, 2026-06-11.  *(shipped: operator, 2026-06-11 — 10 unit + 4 e2e; 335 unit / 120 e2e green, full run, no flake.)*

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
- [ ] BACKLOG-107 [ai] Inference budget for continuous life — realtime + persona-driven action (BACKLOG-104) means dinos would think 24/7 and peg the GPU. Add a global inference governor: sparse cadence, procedural actions by default, LLM reserved for notable beats / on-screen dinos / player interaction; pause/slow generation when the tab is idle or backgrounded (`visibilitychange`). Mandatory before continuous action ships — protects battery/thermals. Behind the `NPCBrain` boundary. *(progress: the governor SPINE shipped as operator work 2026-06-11 with the mobile minds policy (BACKLOG-190): pure `ai/governor.ts` — ambient dino↔dino chatter pauses on `visibilitychange`-hidden and battery <20%, convo cooldown 8→24 steps on coarse-pointer devices, player interaction never gated. Remaining 107 scope — per-beat budgeting, on-screen-only inference — lands when the 104 action layer exists to budget.)*

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
- [x] BACKLOG-125 [social] Greeting the runner-up — greeting the jealous runner-up right after a homecoming gives an outsized affinity bump and flips 😒 → 😊 ("you noticed me"); jealousy is repairable through attention. Builds on 120.  *(shipped: cycle 32, 2026-06-05)*
- [ ] BACKLOG-126 [emergent] Eavesdropping envy — a low-friendship dino that *witnesses* another get a homecoming/favorite beat files a faint "the keeper likes them more" memory that can wistfully colour its next line; only fires when its own friendship is low. Distinctness through insecurity. Builds on 112 / 120.
- [ ] BACKLOG-127 [pokemon] Inner-circle ladder — the collection book ranks your top-3 closest dinos ("inner circle"), making the homecoming selection legible to the player and turning friendship into a visible standing. Builds on 112 / 016 / 021.

## Cycle 32 lore additions — the attention economy (2026-06-05)

- [ ] BACKLOG-128 [emergent] Forgiving heart — a dino repaired before (125) files "the keeper always makes it right"; next time it's the jealous runner-up, its sulk softens (quicker/warmer turn). Repaired bonds learn to trust. Builds on 125.
- [ ] BACKLOG-129 [emergent] Festering slight — a runner-up left un-repaired across multiple homecomings lets the slight harden into a tiny capped bond-cooling toward the *favored dino* (not the keeper), so chronic neglect curdles into dino-vs-dino rivalry. Builds on 120 / 125 / 113.
- [x] BACKLOG-130 [social] Comforting nuzzle — when a dino sulks (😒), its closest dino-friend (highest bond) drifts over and throws a 🫂, nudging the funk down; friendship between dinos blunts jealousy. Builds on 120 / 013.  *(shipped: cycle 33, 2026-06-06)*
- [ ] BACKLOG-131 [pokemon] Fondest memory — the collection book surfaces each dino's single happiest logged beat (favorite eaten, repaired, homecoming): a "what this dino treasures" line. Builds on 011 / 021.

## Cycle 33 lore additions — the court consoles itself (2026-06-06)

> Next-up this cycle is the already-queued **BACKLOG-130** (comforting nuzzle, in the cycle-32 block);
> these items extend it once it lands.

- [x] BACKLOG-132 [emergent] Gratitude echo — a dino that got consoled (130) files *who* consoled it; when that friend later sulks, the consoled dino is first to drift over. Reciprocity hardens into the bond graph. Builds on 130.  *(shipped: cycle 34, 2026-06-07)*
- [ ] BACKLOG-133 [social] Walk-it-off — instead of leaving after a 🫂, the comforter nudges the sulker back toward the cluster/den so it isn't left alone at the edge; comfort becomes a tiny procession. Builds on 130 / 041.
- [ ] BACKLOG-134 [pokemon] Closest-friend line in the book — the collection book shows each dino's highest-bond peer ("thick as thieves with Mossback"), making the dino↔dino graph legible at last. Builds on 013 / 021.
- [ ] BACKLOG-135 [emergent] The loner — a dino whose every bond sits below a floor drifts to the edge and mopes (🥀); poor social integration becomes a visible personality tell, and a keeper greet lands extra-hard on it. Builds on 013.
- [ ] BACKLOG-136 [emergent] Comfort is for friends — a would-be comforter only crosses the bowl if its bond with the sulker clears a bar; a near-stranger ignores the sulk. Makes *who* comes (and who doesn't) a sharp read on the graph. Builds on 130.

## Cycle 34 lore additions — the bond graph wakes up (2026-06-07)

> Cycle 33 shipped BACKLOG-130 (comforting nuzzle) and cycle 34 ships **BACKLOG-132**
> (gratitude echo) — the first time a dino↔dino bond does something *back*. These extend
> reciprocity once the echo lands.

- [ ] BACKLOG-137 [emergent] Comfort circle — if a sulker has *several* grateful debtors present (132), a small group (top 2) drifts over instead of one; consolation scales with how many friends you've helped. Builds on 130 / 132 / 124.
- [ ] BACKLOG-138 [emergent] Debt cleared — once a debtor returns the favor (echoes a comfort, 132), the gratitude entry is consumed; kindness is a one-shot ledger, not a permanent claim, so reciprocity keeps cycling rather than locking one pair forever. Builds on 132.
- [ ] BACKLOG-139 [social] Thankful line — a comforted dino, next time the keeper greets it, may name who was there for it ("Twitch sat with me"); gratitude surfaces in dialogue, not just selection. Builds on 132 / 011 / 051.
- [ ] BACKLOG-140 [pokemon] Owes-one in the book — the collection book shows each dino's outstanding gratitude debts ("owes Twitch one"), making the reciprocity graph legible alongside the closest-friend line. Builds on 132 / 134 / 021.
- [ ] BACKLOG-141 [emergent] Pay-it-forward — a dino comforted very recently, if it then witnesses *another* dino sulk, is primed to be that one's comforter even without the usual bond floor; warmth received spreads outward. Builds on 130 / 132 / 136.

## Cycle 35 lore additions — the operator's six nudges, seeded (2026-06-08)

> First cycle the Idea Box was processed. All six standing operator nudges seeded as
> *incremental foundation beats* (arcs split, governance/automation deferred), plus two
> native follow-ups extending the dialogue-tones foundation. Next-up is BACKLOG-142.

- [x] BACKLOG-142 [social] Player dialogue tones — when the keeper greets a dino (E), pick a **tone** (Warm / Tease / Honest) before the reply; each tone applies a personality-fit affinity delta (reuse the gift/greet scoring shape) and files a remembered "the keeper was <tone> with me" trace, persisted additively. The dino's *last* tone is recalled and surfaced on the next interaction, so a one-way greet becomes a consequential choice that leaves a mark. Deterministic core (delta + memory + last-tone trace) testable with no model; the LLM-coloured reply is split to 148. The first branching moment of the dialogue-choices arc (Idea Box). Builds on 011 / 016 / 051.
- [ ] BACKLOG-143 [core] Connected zone — the bigger-world foundation: one adjacent zone reachable by walking off a designated bowl edge, with a transition that moves the keeper (and tracks which zone each dino is in) between the two. Spine only — one extra area, edge-walk handoff, per-zone occupancy; multi-zone routing, biomes, and minimaps deferred. Idea Box arc, first beat. Builds on 001.
- [x] BACKLOG-144 [emergent] World-scale night event — a rare collective beat: on a clear night the sky lights up (meteor shower / aurora) and the whole cast drifts out to gather and gawp (✨ bubble + a shared "saw the sky burn" memory), reacting *together* rather than one-at-a-time. Distinct from the seasons/weather system (-028) — a discrete emergent moment. Idea Box (world-scale events), first beat. Builds on 008 / 011.  *(shipped: cycle 36, 2026-06-08 — pure `world/skyEvent.ts` (meteors/aurora, gather tile, rollSkyEvent/pickSkyEvent/atGather/skyExpired); shimmer overlay + top-priority gather override in forceStep; real-time roll cadence + one-per-in-game-day cap; shared memory rides the existing save (no version bump). Unblocks 150–154.)*
- [ ] BACKLOG-145 [emergent] Plantable plot — a Stardew-flavoured growing seed: one plot tile the keeper plants, a crop that grows over realtime-clock days (105) through visible stages, harvested into the existing food set so it feeds the hatch/favorites loop (059/061). One plot, one crop; automation, watering, and dino-run farms deferred. Idea Box (farming), first beat. Builds on 105 / 059 / 061.
- [ ] BACKLOG-146 [emergent] Resource gathering spine — foundations-first for the civilization arc: a raw resource (e.g. a fallen branch / shiny stone) occasionally appears in the bowl; a dino notices, walks to it, and picks it up (carries / banks it, with a tally). Gathering only — crafting, building, and governance stay deferred to 029/030/031/032/107. Idea Box (resources→crafting→civ), first beat. Builds on 018.
- [ ] BACKLOG-147 [infra] HUD polish pass — the chrome-polish nudge: lift the HUD/plaque/hint typography and framing a notch (consistent type scale, softer panel framing, clearer world-vs-chrome hierarchy) without changing behavior. Pairs with the open [art] dialog-frame item (036). Lowest-priority of the six (CHARTER emergence bias). Idea Box (UI). Builds on 058 / 036. *(Scope note 2026-06-12: the bottom-bar layout collision is gone — BACKLOG-201 shipped the [?] help panel + short gift line; what remains here is the typography/framing pass.)*
- [ ] BACKLOG-148 [ai] Tone-aware reply — feed the remembered tone (142) into the dino's greeting/reply context so a teased dino ribs back, a warmly-treated one is fonder, an honestly-treated one is franker; the consequence surfaces in *what the dino says*, not just affinity. Behind the NPCBrain boundary, deterministic fallback line per tone. Builds on 142 / 051 / 055.
- [ ] BACKLOG-149 [emergent] Tone reputation — a dino's accumulated tone-history settles into a read on the keeper (trusts / wary / playful), surfaced in the collection book; how you've *mostly* treated a dino becomes a visible standing. Builds on 142 / 021.

## Cycle 36 lore additions — the night the sky lit up (2026-06-08)

> Cycle 36 ships the queued **BACKLOG-144** (world-scale night event) — the first time the
> *whole cast* reacts to one thing at once. These extend that collective beat into distinct,
> personality-shaded reactions and tie it back into the existing loops.

- [ ] BACKLOG-150 [emergent] Stargazer's awe varies by temperament — a curious/bold dino rushes to the night-sky event and lingers right under it; a timid one hangs back at the cluster's edge and only peeks. Same spectacle, a different read per personality (gather radius / lingering shaped by traits). Builds on 144 / 010.
- [ ] BACKLOG-151 [emergent] Slept through the wonder — a low-energy dino (or one already deep in a huddle) may sleep through the sky event entirely and, next morning, only hear about it secondhand as gossip ("you should have SEEN the sky"). Distinctness through who-missed-it. Builds on 144 / 019 / 109.
- [ ] BACKLOG-152 [pokemon] Skywatch in the book — the collection book records which dinos witnessed the last sky event together ("watched the meteors with Sunny & Glade"); shared awe becomes legible standing. Builds on 144 / 021.
- [ ] BACKLOG-153 [emergent] Wish on a falling star — during a meteor shower a dino may make a quiet wish tied to its strongest want (a lonely one wishes for a friend, a long-unfed one for food); surfaces as a wistful line + a remembered "wished on a star" memory that can colour a later greeting. Builds on 144 / 011 / 051.
- [ ] BACKLOG-154 [social] Star-fragment keepsake — a rare sky event leaves a one-off collectible (a fallen ✨ "star fragment") on the ground the keeper can pick up and later gift; ties the cosmic beat back into the gifting loop as a treasured item every dino loves. Builds on 144 / 015.

## Cycle 37 lore additions — the watcher gets a face (2026-06-09)

> The operator's live-session steer: the player is a **time-traveling robot observer**, chosen from
> a small roster, each with its own history + a distinct ability. Seeded foundation-first per the
> operator's own steer. Cycle 37 ships **BACKLOG-155** (the select spine). GBA-pixel-style nudge
> declined (needs a CHARTER amendment, not a routine flip); seasons seeded foundation-only as 159.

- [x] BACKLOG-155 [core] Selectable keeper — the player isn't a faceless square but one of a small roster of **time-traveling robot observers**, chosen at the start and persisted. Each has its own designation/era/backstory and a **distinct passive ability that touches play**: the foundation ships the spine + one ability — a personality **affinity-fit** (the chosen observer makes dinos whose temperament matches it warm to you a little faster). Pure `keeper/keepers.ts` (roster + `keeperById` + `keeperBonus`, mirrors tones.ts/gifts.ts scoring); a `K` picker overlay (number-key select, like the tone menu); additive `keeperId` in the save (older saves default to the first observer); a non-blocking first-time prompt to choose (no modal on boot, to keep every existing e2e clean). The richer LLM-authored backstory (156), the other abilities (157), and avatars (158) split off. Idea Box arc, first beat. Builds on 010 / 016 / 142.  *(shipped: cycle 37, 2026-06-09 — 3 robot observers (AETHER-1/VANTA-9/LUMEN-3), `K` picker, affinity-fit bonus 0..+2 at the greet/tone/gift seams, additive `keeperId` save (default AETHER-1, no version bump); 9 unit + 4 e2e; 12/12 AC; 263 unit / 87 e2e green. Unblocks 156/157/158.)*
- [ ] BACKLOG-156 [ai] Per-keeper persona authored from lore — give each selectable observer a real **persona/backstory** authored the way dino personas are (CHARTER "Living minds"): LLM-authored-from-lore where the device allows, deterministic procedural fallback otherwise, generate-once/cache/persist. Mirrors BACKLOG-103's pipeline for the keeper. Builds on 155 / 103.
- [ ] BACKLOG-157 [emergent] More keeper abilities — beyond the affinity-fit of 155, the distinct per-observer powers the operator floated: one scans/reads dino stats, one sees the bond graph, one nudges the weather/sky event. One ability per cycle, each a real read on which observer you chose. Builds on 155 / 144 / 021. *(progress: 1/3 — LUMEN-3's **Field Scan** shipped cycle 38 (B reads a dino's axes/mood/favorite/role; Aki/Vix refuse in character). Note for the next fire: "sees the bond graph" is already public for every keeper via the V bonds lens (cycle 21) — pick a different power for AETHER-1; the sky-nudge fits VANTA-9.)*
- [ ] BACKLOG-158 [art] Keeper avatars — **pixel** idle + walk rigs for each selectable observer (CHARTER v4), robot-observer silhouettes distinct from the organic cast; supersedes the single-avatar framing of 035. Two shipped systems (the K picker, first contact) star observers who are still rectangles — highest-value art fire. Builds on 155 / 168. *(progress: 1/3 — the keeper-art FOUNDATION + **AETHER-1 "Aki"** shipped cycle 045-art: a non-square 16×20 keeper rig format (`art/keeperArt.ts`, distinct from the square dino `PixelRig`), a keeper-id-keyed bake path (`makeKeeperArt`/`hasKeeperArt`/`ensureKeeperWalk` in bake.ts, fixed per-observer palette not colour-keyed), and WorldScene swapping the player rectangle for a baked observer sprite via `renderKeeperAvatar()` — rebuilt in place on a K-pick or a save restore, undrawn observers (VANTA-9/LUMEN-3) gracefully on the original amber square (which IS the rectangle-fallback control). Aki: a front-facing brass diplomacy bot — cyan optic visor, antenna + chest glow, stub arms, two stepping legs (stand/step-L/step-R, [0,1,0,2]). Mirrors the 168 foundation+proof pattern. **Remaining: VANTA-9 "Vix" (a collapsed-timeline scout — leaner, sharper, a hostile red optic) + LUMEN-3 "Lux" (a deep-future cataloguer — a lens/scanner head) one per next art fire.** Progress 2/3 — **Vix shipped cycle 046-art** (2026-06-12): 16×20 `VIX_RIG`, gunmetal wedge head with twin sensor fins, a single-row hostile red optic slit (vs Aki's two-row calm visor), pencil neck into an 8px-wide chassis (vs Aki's 14) with a red scan-core, tight scout stance scissoring wide on the step; first draft's split hip-roots jogged ±1px against the moving legs — rev 2 closed the pelvis line, legs swing under it. The rectangle-fallback control re-pointed `vanta`→`lumen` in the cycle-045 spec per the 2026-06-07 policy. **Remaining: LUMEN-3 "Lux" (3/3) next art fire.**)*
- [x] BACKLOG-159 [social] Season foundation — a turning-year clock layered on the realtime day (105): the in-game date advances through spring/summer/fall/winter, each shifting a per-season palette tint and firing a one-off "the season turned to X" beat. Foundation only — the four-season *art* lift and weather (-028) stay deferred. Idea Box (seasons), first beat. Builds on 007 / 008 / 105.  *(shipped: cycle 40, 2026-06-09 — pure `world/seasons.ts`, week-long seasons / 28-day wrapping year DERIVED from the persisted clock day (zero save change); ≤0.12-alpha wash at depth 4; season on the clock HUD; once-only live turn beat (banner + 🍂 ticker + all-cast memory); boot/restore/away proven silent. 7 unit + 4 e2e; 9/9 AC +1 bonus; 283 unit / 99 e2e green. Unblocks 026/028/170-173.)*

## Cycle 38 lore additions — the observer observed (2026-06-09)

> Cycle 37 gave the watcher a face; these make the *bowl* notice. The dinos have lived under a
> faceless square for 36 cycles — now that the keeper is someone, the cast should react to *who*.
> Next-up is the already-queued **BACKLOG-157** (the distinct per-observer abilities, one per
> cycle) — the operator's arc, and the beat that makes the choice of observer a real lens on play.

- [ ] BACKLOG-160 [ai] Dinos address the observer — the chosen keeper's designation/persona enters the dialogue context, so a high-friendship dino may name you ("strange lights in your chest, Vix") and shade its line by *which* watcher you are; deterministic fallback line per observer, LLM colour where the device allows. The keeper's identity surfaces in what dinos *say*, not just in the affinity math. Builds on 155 / 051 / 148.
- [x] BACKLOG-161 [emergent] First-contact inspection — the moment an observer is first picked (or switched), the cast's best personality-fit dino notices the new watcher and drifts to the glass front for a long look (👀 + a "met the new keeper" memory); the bowl visibly *reacts to who you chose*, seconds after you choose. Builds on 155 / 057 / 011.  *(shipped: cycle 39, 2026-06-09 — pure `keeper/firstContact.ts` (strictly-positive keeperFit argmax, alpha tie-break, INSPECT_TTL 24); armed only on a real keeperId change via the picker; inspector beelines to the player in forceStep, lands 👀 + a keeper-named persisted memory, one-shot. 6 unit + 4 e2e; 9/9 AC; 276 unit / 95 e2e green. Unblocks 165/167.)*
- [ ] BACKLOG-162 [emergent] The bowl remembers its watchers — switching observers mid-save isn't free-floating: each dino files a faint "the watcher changed" memory, and a dino with high friendship under the *old* observer may glance around for it in a wistful line. Identity persistence becomes something the cast tracks, not just the save file. Builds on 155 / 011 / 116.
- [ ] BACKLOG-163 [pokemon] Observer dossier — the collection book gains a keeper page: your designation, era, backstory, ability, and running tallies under this observer (days watched, dinos befriended); the plaque adds "observed by VANTA-9". The chosen identity becomes legible standing, like everything else in the book. Builds on 155 / 021 / 058.

## Cycle 39 lore additions — the glass looks back (2026-06-09)

> Cycle 38 gave the keeper a power over the bowl (Lux reads minds); the bowl should answer.
> Next-up is the already-queued **BACKLOG-161** (first-contact inspection) — the first time the
> cast *reacts to who you chose*, seconds after you choose. These extend that returned gaze.

- [ ] BACKLOG-164 [emergent] Being scanned is a moment — a dino notices Lux's Field Scan and answers it in character: a bold one squares up and poses, a timid one skitters a step and eyes you sideways, and either way it files a "the watcher read me" memory that can colour a later line. The scan stops being free; knowledge has a social cost. Builds on 157 / 010 / 011.
- [ ] BACKLOG-165 [emergent] Gossip about the watcher — a dino that witnessed a watcher beat (the first-contact inspection, a scan, a switch) can pass it on through the existing gossip spine ("the new one has a glass eye"), so news of *you* travels the bowl the same way dino news does. Builds on 019 / 161 / 162.
- [ ] BACKLOG-166 [pokemon] Deep dossier — Lux's scan readout grows two relational lines: the dino's last remembered keeper-tone and any outstanding gratitude debt ("owes Twitch one"), making the scan the place where the social ledgers surface. Builds on 157 / 142 / 132.
- [ ] BACKLOG-167 [emergent] The unimpressed — the cast's *worst* personality-fit dino greets a freshly-picked observer with a flat, unimpressed beat (😐 + a "didn't see the fuss" memory) a moment after the best-fit one inspects; the same choice that delights one dino bores another, legibly. Builds on 161 / 155 / 010.

## Cycle 40 lore additions — the turning year (2026-06-09)

> Next-up is the operator-seeded **BACKLOG-159** (season foundation) — three keeper cycles in a
> row is enough inward gaze; give the bowl a year. These extend the seasons once the clock turns.

- [x] BACKLOG-170 [emergent] Seasonal palates — each season nudges which foods the bowl craves (berries sweeter in summer, meat prized in winter): the favorite-food verdict gains a small season modifier, so the same dino begs differently in March and in December. Builds on 061 / 159.  *(shipped: cycle 41, 2026-06-10 — `SEASON_CRAVING` (spring greens / summer berries / fall fish / winter meat) + a 0.4 bonus inside `favoriteFood(traits, season?)`, season optional → byte-identical cycle-061 fallback; live clock season threaded through the rush / eat / scan / `__favoriteFood`; new `__seasonCraving` hook. Rex/Mossback/Sunny sway, Twitch/Glade loyal — emergent split from the name-seeds. No save change, no deps. 7 unit + 4 e2e; 8/8 AC; 298 unit / 105 e2e green.)*
- [x] BACKLOG-171 [emergent] Winter huddle pull — cold seasons lower the night-huddle bond threshold and lengthen the huddle window, so winter visibly packs the den while summer nights stay scattered. Who sleeps alone in winter becomes a sharper read. Builds on 041 / 159.  *(shipped: cycle 42, 2026-06-10 — pure `world/huddle.ts` SEASON_HUDDLE: spring 8/21→5 (legacy, byte-identical), summer 8/23→4, fall 6/21→5, winter 4/19→7; season optional → cycle-18 fallback; den gate + isHuddling read the live clock season; `__huddleInfo` hook, `__bondPair` optional amount. No save change. 6 unit + 4 e2e; 9/9 AC; 309 unit / 111 e2e green. Unblocks 179–182.)*
- [ ] BACKLOG-172 [pokemon] Season of hatching — every dino (and every future egg) gets a recorded hatch season shown in the collection book ("hatched in spring"); lineages start carrying birthdays the turning year makes meaningful. Builds on 042 / 021 / 159.
- [ ] BACKLOG-173 [ai] Season in the voice — the current season joins the dialogue context (like time-of-day in 051), so a dino can grumble about winter or savour spring without being asked. Deterministic fallback line per season. Builds on 051 / 159.

## Operator art mandate (2026-06-09 — CHARTER v4: GBA pixel)

> The operator ruled: **Gen3 pixel**, authored as code (no rips, no downloads). Restyle rolls
> one character per Artist fire; vector rigs keep rendering until each pixel replacement lands.

- [x] BACKLOG-168 [art] Pixel pipeline foundation + proof dino — `art/pixelArt.ts` (string-grid frame format, palette map, ≤15-color GBA discipline, frame builders) + a pixel path in `bake.ts` (per-pixel fillRect at integer scale), proven by **restyling Rex** to a 20×20 Gen3-style triceratops with the stand/step-L/step-R walk convention. Mirrors the 117/118 foundation+proof pattern. Unblocks all pixel art.  *(shipped: cycle 40-art, 2026-06-09 — pure `art/pixelArt.ts` (PixelRig: string-grid frames, char→palette ≤15 colors, stand/step-L/step-R + [0,1,0,2] amble); `ensurePixelWalk` in bake.ts (per-pixel fillRect ×2 scale, same `tri_walk_<color>`/`_0` key contracts so every consumer + old spec survived); Rex restyled 20×20 — frill disc, brow + nose horns, high tail point, belly band; first draft rejected for a flat-edged rear. 8 unit + 2 e2e; 291 unit / 101 e2e green.)*
- [x] BACKLOG-169 [art] Pixel restyle of the remaining cast — Mossback / Sunny / Twitch / Glade as Gen3-style pixel rigs (one sub-agent each, distinct silhouettes preserved: plates+thagomizer, the long neck, the tiny biped, the tube crest); each species' vector entry replaced as its pixel rig lands, art e2e re-pointed in the same fire. Builds on 168. *(COMPLETE cycle 44-art, 2026-06-11 — **Glade/parasaurolophus** pixel-restyled, the fifth and last: 20×20 `GLADE_RIG`, the tube crest as a 3-row bone-tone sweep rising up and back off the skull (a shorter stub read as a horn and was rejected), wide duckbill snout, tail merged into the body's widest row (Sunny's rejected hump bug pinned out by a unit test); kept the `para` prefix so the cycle-32 contract held untouched. **The whole cast renders pixel; no vector dino remains**; the pterodactyl rectangle-fallback control still stands. 6 unit + 2 e2e new; 367 unit / 133 e2e green full run. Earlier progress: 4/4 prior fires — **Twitch/compsognathus** pixel-restyled cycle 43-art: 20×20 `COMP_RIG`, the cast's ONLY biped drawn as one — a small alert head with a pointed snout + forward eye, a short neck into a deep upright (taller-than-wide) chest, a dorsal two-tone stripe down the back, a tail tapering off behind, and two long CENTRED legs that scissor fore/aft (stand together → step-L spread → step-R shifted) for the quick jittery sprinter's skitter, unlike the quadrupeds' splayed corner pairs; kept the `comp` prefix so the `comp_walk_<color>` anim key and the cycle-33 e2e contract held untouched (the spec's `/^comp_walk_/` assertion is satisfied by the pixel bake). Six colors. First pass had the legs too short (read quadruped-ish) and a 19-char step-right row that broke the grid; rev 2 lengthened the legs to four rows and fixed the grid. Only Glade/parasaurolophus remains on its vector rig. — **Mossback/stegosaurus** pixel-restyled cycle 41-art: 20×20 `MOSS_RIG`, staggered double-row plate ridge (ochre) + bone thagomizer off the tail tip + low-slung body, kept the `steg_walk_<color>` prefix so the cycle-35 contract held untouched; first draft (round blob, fused plates) rejected. **Sunny/brontosaurus** pixel-restyled cycle 42-art: 20×20 `SUNNY_RIG`, the cast's only long neck — high small head, two-pixel neck sloping into a deep body, raised tail tapering to a high tip, wide-set columnar sauropod legs; kept the `bro_walk_<color>` prefix so the cycle-31 contract held untouched; first draft (tail notched off the rump, read as a hump) rejected, rump-tail junction smoothed in rev 2. Remaining: Twitch/compsognathus, Glade/parasaurolophus.)*

## Cycle 41 lore additions — the year keeps turning (2026-06-10)

> Cycle 40 hung the calendar; cycle 41 makes the season change what the cast *does*. Next-up is
> the already-queued **BACKLOG-170** (seasonal palates) — the year's first reach into the daily
> feeding loop. These extend the turning year into gossip, gifting, plaque, and the wander.

- [ ] BACKLOG-174 [pokemon] Year wheel on the plaque — the plaque/HUD spells the season legibly ("Spring · day 3 of 7") with a tiny 4-arc year wheel marking where in the year the bowl sits. Builds on 058 / 159.
- [ ] BACKLOG-175 [emergent] Turning-year gossip — the season-turn memory every dino files (159) becomes gossip: a dino can let the change of season slip to the next it meets ("smell that? fall's here"), so the year travels the bowl the way dino news does. Builds on 019 / 159.
- [ ] BACKLOG-176 [social] Seasonal gift cravings — the mirror of 170 for the gift loop: the same seasonal-craving nudge shifts which *gift* lands best, so generosity reads the calendar too (a flower means more in spring). Builds on 015 / 170.
- [ ] BACKLOG-177 [emergent] Equinox restlessness — on the single day a season turns, the whole cast wanders a touch wider for that one day, a quiet collective "something's changed" jitter — distinct from the sky-event gather (144). Builds on 159 / 018.
- [ ] BACKLOG-178 [emergent] Migrating warmth — winter raises the cluster-drift bias (the cast seeks company in the cold and the den fills earlier) while summer lowers it (they spread out and laze); the bowl's social density breathes with the year. Builds on 159 / 018 / 041.

## Cycle 42 lore additions — the year reaches the night (2026-06-10)

> Cycle 41 let the season change a verdict (which food wins); cycle 42 should let it change
> behaviour you can watch — the den packing at dusk in winter. Next-up is the already-queued
> **BACKLOG-171** (winter huddle pull); these extend the seasonal night once it lands.

- [x] BACKLOG-179 [emergent] Cold-night shiver — a dino that spends a winter night outside the den (never huddled) visibly shivers (🥶 bubble) and files a "cold night, slept alone" memory that can colour its next-morning greeting; being left out becomes legible. Builds on 171 / 041 / 011.  *(shipped: cycle 43, 2026-06-11 — pure world/cold.ts (COLD_SEASON/sleptCold/coldShiver/coldMemory); the morning a night's huddle window closes, every dino too loosely bonded for the den (maxBond below the season bar — the same cycle-171 den-seek gate) shivers 🥶 + files a cold memory that rides the existing store into its next greeting; winter only, warm seasons inert; __coldSleepers hook. Pivot from the planned positional Set (central den + BOND_PER_MEET=4 made it count everyone) to a bond-graph morning read. No save bump; eggs/sky/huddle untouched. 6 unit + 3 e2e; 9/9 AC; 320 unit / 116 e2e green, full run no flake. Unblocks 183–187.)*
- [ ] BACKLOG-180 [emergent] Odd bedfellows — when the winter den packs, two *low-bond* dinos who end up huddled the same cold night gain a small extra bond bump beyond the normal meet gain ("we kept each other warm"); the cold manufactures unlikely friendships the summer never would. Builds on 171 / 041 / 013.
- [ ] BACKLOG-181 [ai] Sleep murmurs — a huddled dino may murmur a quiet 💭 sleep-line drawn from its strongest memory of the day (deterministic template fallback; LLM colour where the device allows, behind NPCBrain); the day echoes in the night. Builds on 041 / 011.
- [ ] BACKLOG-182 [pokemon] Night ledger — the collection book counts shared den nights per dino ("most nights kept warm with Sunny"), the sleeping pile's history made legible alongside the closest-friend line. Builds on 041 / 021 / 134.

## Cycle 43 lore additions — the cold has a cost (2026-06-11)

> Cycle 42 made the winter den *pack* (171); cycle 43 grows the other half — the dino left
> standing outside it. Next-up is the already-queued **BACKLOG-179** (cold-night shiver), the
> spine these extend: a shiver you can see, a memory that follows the dino into the morning.

- [ ] BACKLOG-183 [emergent] Warmed-by-the-memory — a dino that shivered alone last winter night (179) drifts to the den *earlier* the next cold dusk, the cold teaching it to seek the pile sooner. Builds on 179 / 171.
- [ ] BACKLOG-184 [social] Keeper's warmth — greeting or feeding a shivering dino (179) clears the 🥶 early and files a "the keeper warmed me" memory, so the cold night becomes a thing the keeper can mend (the greet-repair shape, like 125). Builds on 179 / 125.
- [ ] BACKLOG-185 [emergent] Word of the cold — a dino that slept cold lets it slip to the next it meets ("frost in my bones, you should've seen it"), so the night's hardship travels the bowl through the gossip spine. Builds on 179 / 019.
- [ ] BACKLOG-186 [pokemon] Hardy in the book — the collection book counts cold nights each dino has toughed out ("weathered 3 cold nights alone"), the flip side of the night ledger (182): not who slept warm, but who slept hard. Builds on 179 / 021.
- [ ] BACKLOG-187 [emergent] Toughened hide — a dino that endures many cold nights slowly hardens (a tiny capped nudge toward higher resilience / lower sociability), so being repeatedly left out leaves a mark on temperament, not just memory. Very slow, capped. Builds on 179 / 043.

## Cycle 44 lore additions — the bowl finds its voice (2026-06-11)

> The operator spent a day giving the bowl a phone home, then dropped one nudge in the box:
> **sound**. The bowl has been silent for 44 cycles. Seeded foundation-first, and — per the
> Living-minds bias — the very first sounds are *per-dino voices*, not UI bleeps: a dino you
> can recognize with your eyes closed is distinctness in a register we've never used.

- [x] BACKLOG-191 [core] Audio spine — pure WebAudio synthesis, authored as code like the art (CHARTER: no asset downloads, no keys): a tiny `audio/` module that can voice a short synthesized dino chirp from parameters (pitch, length, wobble), plus the two first beats — a chirp when a dino speaks/greets, and a soft *thunk* on tap-the-glass. Autoplay-safe (audio context resumes on first interaction), master mute toggle persisted per device (localStorage, like the minds consent), default ON at low volume. The chirp parameters come from the dino's traits via a pure function — Sunny rumbles low and slow, Twitch squeaks high and fast — so the very first sound in the bowl is already a personality tell. Idea Box (sound), first beat. Builds on 010 / 057.  *(shipped: cycle 44, 2026-06-11 — see closed log)*
- [x] BACKLOG-192 [emergent] Dawn chorus — at the dawn boundary the cast greets the day each in its own voice (191's trait-pitched chirps), staggered by energy: early risers first, night-owls last and grudging. The bowl's day becomes audible, and *who sings when* is a personality read. Builds on 191 / 108 / 109.  *(shipped: cycle 45, 2026-06-12 — see closed log)*
- [ ] BACKLOG-193 [social] Call and answer — greeting a high-bond dino gets an answering chirp before the text reply; the latency and eagerness of the answer scale with hearts, so you can *hear* how much a dino likes you before you read it. Builds on 191 / 016.
- [x] BACKLOG-194 [emergent] Distress call — a shivering (179) or startled (057) dino calls out in its own voice, and its closest friend (013) turns toward the sound from across the bowl; the bond graph gains an audible edge. Builds on 191 / 130 / 179.  *(shipped: cycle 46, 2026-06-12 — see closed log)*
- [ ] BACKLOG-195 [pokemon] Cry in the book — the collection book plays a dino's chirp when you open its entry (the Pokédex cry, in the bowl's register); a hatchling's cry blends its parents' parameters the way its traits do. Builds on 191 / 021 / 042.

## Cycle 45 lore additions — the voice learns the day (2026-06-12)

> Cycle 44 gave each dino a voice; cycle 45 gives the bowl a *time* it uses them. Next-up is
> the already-queued **BACKLOG-192** (dawn chorus) — the first soundscape with a clock in it.
> These extend the audible day once the chorus lands: its closing bookend, the keeper joining
> in, the loner left out of it, and what a friendship sounds like.

- [ ] BACKLOG-196 [emergent] Night hush — the inverse bookend of the dawn chorus: at the night boundary the cast falls quiet, the last night-owl's chirp trailing off into the dark, so the day has a closing sound as well as an opening one. Builds on 192 / 109.
- [ ] BACKLOG-197 [social] Chorus you can join — tapping the glass (057) during the dawn chorus makes the nearest waking dino chirp back at the keeper, folding you into the morning call-and-answer. Builds on 192 / 057 / 193.
- [ ] BACKLOG-198 [emergent] Off-key loner — a dino with no bond above the loner floor (135) chirps a beat *after* the rest of the chorus, a lone voice hanging in the quiet; social isolation made audible. Builds on 192 / 013 / 135.
- [ ] BACKLOG-199 [pokemon] Chorus lead in the book — the collection book names which dino "leads the dawn chorus" (the earliest riser by energy) as a small standing. Builds on 192 / 021.
- [ ] BACKLOG-200 [emergent] Harmonized pair — two high-bond dinos that wake near each other chirp in near-unison (pips interleaved), so a strong friendship literally *sounds* different from two strangers. Builds on 192 / 013.

## Cycle 46 lore additions — sound becomes signal (2026-06-12)

> Cycles 44–45 gave the bowl voices and a morning; cycle 46 makes a voice *do* something —
> next-up is the already-queued **BACKLOG-194** (distress call), the first time sound moves a
> dino: a cry crosses the bowl and the bond graph answers. These extend the call once it lands.

- [ ] BACKLOG-202 [emergent] Answered across the bowl — the friend who turns toward a distress call (194) chirps back in its own voice before it moves: reassurance at distance, the bond audible in both directions. Builds on 194 / 191 / 013.
- [ ] BACKLOG-203 [emergent] Cry wolf — a dino that distress-calls constantly (very timid, startles at everything) slowly loses credibility: friends turn toward its calls less often (capped habituation), but a genuine cold-night cry always lands. Personality becomes social credibility. Builds on 194 / 010 / 057.
- [ ] BACKLOG-204 [social] Keeper hears trouble — a distress call posts a faint 📢 ticker line naming the caller, so a keeper out of view can find the dino in trouble; greeting/feeding it then rides the keeper-warmth repair shape (184). Builds on 194 / 184.
- [ ] BACKLOG-205 [pokemon] Peep in the shell — an egg on its final day faintly peeps, its parameters blended from its parents' chirps the way its traits will be; you can hear who's coming before the hatch. Foreshadows the book cry (195). Builds on 042 / 191 / 195.
- [ ] BACKLOG-206 [emergent] Sound has a place — chirp volume attenuates with distance from the keeper's avatar, so where you stand changes what you hear and a far-corner cry is faint; the bowl gains acoustic space. Builds on 191 / 194.

## Cycle 47 lore additions — kindness has a temperature (2026-06-12)

> Cycle 43 made the cold visible, cycle 46 made it audible; in both the keeper could only watch.
> Next-up is the already-queued **BACKLOG-184** (keeper's warmth) — the 125 repair shape brought
> to winter: a shiver you can mend with your own hands. These extend the mended morning.

- [ ] BACKLOG-207 [emergent] Hopeful shiver — when the keeper warms one cold dino (184), another still-shivering dino that witnessed it drifts toward the keeper at the glass, hoping it's next; mended kindness creates a queue. Builds on 184 / 063 / 126.
- [ ] BACKLOG-208 [emergent] Nobody came — a shiverer the keeper never warmed before its funk thaws files the colder memory ("shivered all morning; nobody came") that tinges its next greeting harder than the plain cold note; neglect becomes as legible as care. Builds on 184 / 179 / 126.
- [ ] BACKLOG-209 [pokemon] Mended in the book — the collection book counts how often the keeper has warmed each dino ("warmed through 3 cold mornings"), care made standing alongside the hardy-nights tally (186). Builds on 184 / 021 / 186.
- [ ] BACKLOG-210 [ai] Gratitude in the voice — a just-warmed dino's next reply leans grateful (deterministic thankful line per the 148 shape; LLM colour where the device allows, behind NPCBrain); the warmth surfaces in *what it says*, not just the affinity math. Builds on 184 / 148 / 139.
- [ ] BACKLOG-211 [emergent] Pass the warmth — a keeper-warmed dino is primed, for a while, to be the one who comforts the next sulker or shiverer it witnesses — even below the usual bond floor (the 141 pay-it-forward shape, now seeded by keeper care); kindness cascades from the keeper into the bond graph. Builds on 184 / 141 / 130.

## Operator session — 2026-06-12

- [x] BACKLOG-201 [infra] Bottom-bar HUD overhaul — the old one-line controls hint (~610px of text on a 640px canvas) collided with the gift HUD and the plaque (operator screenshot, desktop + mobile). Replaced by: short `Holding: <item>` left · plaque centre · a small `[?] controls` chip right that toggles a full key-reference panel (click, or the ?// key). On touch the chip hides (the More sheet covers it) and the held-item line moves under the build stamp, off the stick. Pure `ui/controlsHelp.ts`; 5 new unit + 3 new e2e.  *(shipped: operator, 2026-06-12)*

## Mobile (deferred, do not pick until charter clears)

- [ ] BACKLOG-100 [infra] Capacitor wrap — only after game is fun on desktop. Charter must clear.
- [ ] BACKLOG-101 [infra] Native LLM plugin swap on mobile
- [x] BACKLOG-190 [ai] Mobile minds policy — phones (`pointer: coarse`) boot on the canned StubBrain; the model is strictly OPT-IN via a "🧠 dino minds" row in the touch More sheet → consent dialog quoting the exact model + download size (+ Data Saver warning), [1] to enable. Consent persists per device in localStorage (`dino.minds`) — a device choice, not world state, so no save change. Opted-in phones are clamped to the smallest model tier whatever `deviceMemory` claims; model fetch progress shows in the brain HUD (`🧠 downloading N%`, via WebLLM's initProgressCallback); the 🧠 HUD reads `off` while on the stub. Pure `ai/governor.ts`; desktop behavior byte-identical (cycle-007 spec is the pin). Operator request + design, 2026-06-11.  *(shipped: operator, 2026-06-11 — with the BACKLOG-107 governor spine; 10 unit + 4 e2e under Pixel 5 emulation (which also proves the BACKLOG-189 touch auto-detect); 345 unit / 124 e2e green, full run, no flake. Same-day follow-up: model **cache management** — turning minds off while weights are cached offers [1] keep (instant re-enable) / [2] delete (frees the ~0.4 GB, via web-llm `deleteModelAllInfoInCache`); the enable dialog detects an already-cached model ("enables instantly, no data used"); `hasCachedModel`/`deleteCachedModel` live in webllmBrain.ts behind the NPCBrain boundary. 347/124 green.)*

---

## Closed log

### Cycle 46 — 2026-06-12
- BACKLOG-194 shipped — Distress call: the first time sound moves a dino. Two triggers, one beat — rap the glass and among the dinos that bolt exactly ONE cries out, the most frightened (lowest bravery, alpha tie-break: one tap, one yelp, and *who screams* is a read on the cast); the winter morning the huddle window closes, the loneliest cold sleeper (lowest strongest-bond) gives its shiver a voice. The cry is the dino's own cycle-44 chirp in a pure distress register (`distressParams`: pitch ×1.35 ≤ 1100 Hz, clipped ×0.55 ≥ 60 ms, sharpened bend, two-pip yelp — founder pitch order preserved, so Twitch's shriek at 1076 Hz still sits a full register above Mossback's 200). Then the bond graph answers: the caller's closest friend — picked by the cycle-33/34 `comforter()` rules REUSED VERBATIM (gratitude debt first, bond floor 8, alpha tie-break) — throws a 👂 bubble, files a "heard <caller> cry out and went to it" memory, and walks toward the caller's live tile for up to 6 world steps on the inspection-style override (under sky events and first contact in priority). No friend over the floor → the cry hangs unanswered, the table 198 will set. Diegetic by design: mute silences playback only — a muted bowl still turns its head. Pure `world/distress.ts` (`mostDistressed` — one lowest-level picker for both triggers — `hearLine`/`heardMemory`/`DISTRESS_STEPS`); `voice.ts` untouched (still the only WebAudio file); hooks `__lastDistress`/`__distressResponder`/`__cryDistress`. No save change, no deps, NPCBrain not in play. 8 unit + 6 e2e; 10/10 AC; 395 unit / 149 e2e green, fresh full run, no flake (one stale cycle-044 thunk assertion fixed test-side per the cycle-037 precedent). Unblocks 202 (answer-back) / 203 (cry wolf) / 204 (keeper hears trouble) / 205 (peep in the shell) / 206 (sound has a place).

### Cycle 45 — 2026-06-12
- BACKLOG-192 shipped — Dawn chorus: the bowl's day gets an opening sound. On a live clock crossing into hour 7 (the warm visible dawn) the whole cast greets the day each in its own cycle-44 voice, staggered by `energy` — a pure `audio/chorus.ts` orders the cast highest-energy-first (the eager riser at 0 ms) to lowest-last (the grudging night-owl at the full 1800 ms spread), spacing the rest by where they sit in the cast's energy span, alpha-name tie-break for stability. So the morning rolls across the bowl as a personality read you can hear with your eyes closed, drawn from the same five numbers driving food cravings and den order since cycle 4. WorldScene adds a second live-only `onHour` listener beside the season turn → `checkDawnChorus`: hour-7-gated, once-per-in-game-day on the `lastSeasonDay` template, records the order + a faint 🌅 log line, then schedules each dino's `chirpFor` via `this.time.delayedCall(delayMs)`. `chirpFor` self-guards mute + the unlocked AudioContext, so a muted bowl computes the order and stays silent; `onHour` never fires on `clock.set()`, so boot/restore/away are silent by construction. No new WebAudio (voice.ts unchanged, still the only `AudioContext` file), no deps, no save-format change; NPCBrain never in play. 8 unit + 4 e2e; 10/10 AC; 375 unit / 137 e2e green in a single fresh full run, no flake. Unblocks 196 (night hush) / 197 (chorus you can join) / 198 (off-key loner) / 199 (chorus lead in the book) / 200 (harmonized pair).

### Cycle 44 — 2026-06-11
- BACKLOG-191 shipped — Audio spine: the bowl's first sound is five voices, not a bleep. Pure `audio/chirp.ts` maps the 5 personality axes to synth parameters — pitch from solitariness+timidity (small skittish things squeak high, big social brave things rumble low), call length clipped by energy, pitch-bend from curiosity, pip count from warmth — so the name-seeded founders spread 148 Hz (Mossback) → 343 (Rex) → 513 (Glade) → 521 (Sunny) → 797 (Twitch) with nothing hand-tuned: the voice IS the personality, audible before any text renders. Browser side `audio/voice.ts` is the only WebAudio file: oscillator pips synthesized at master gain 0.12 (desk companion, not a noise box), the AudioContext born strictly inside `unlockAudio()` on the `markActive` first-gesture seam (autoplay-safe on phone Chrome), mute persisted per device under `dino.sound` (M key + a 🔊 row in the touch More sheet). A dino chirps its own voice on the player-greet reply and the dino↔dino convo line; the glass rap got its *thunk*. Hooks record intent in the scene so headless asserts never depend on playback. No assets, no deps, no save change; boundary clean. 7 unit + 5 e2e; 8/8 AC; 361 unit / 131 e2e green (one catalogued parallel flake, green isolated + green fresh run). Unblocks 192 (dawn chorus) / 193 (call-and-answer) / 194 (distress call) / 195 (cry in the book).

### Cycle 43 — 2026-06-11
- BACKLOG-179 shipped — Cold-night shiver: the dino left out of the winter den. The morning a night's huddle window closes, every dino too loosely bonded for the den — its strongest bond below the season's huddle bar, the *same gate* cycle-171 used to seek the den — slept cold: it shivers 🥶 where it stands and files a "shivered through a cold night, slept alone" memory that rides the existing store into its next greeting (woven via `recentMemory`, proven in `__greetPrompt`). Winter only; spring/summer/fall mornings are inert. Pure `world/cold.ts` (COLD_SEASON/sleptCold/coldShiver/coldMemory, no Phaser); WorldScene notes the night's season while the window is open and fires `resolveColdMorning` once on the window's true→false edge; `__coldSleepers` hook. The Coder pivoted off the planned positional `huddledTonight` set — the central den makes proximity-only `isHuddling` true for everyone and `BOND_PER_MEET===4` equals the winter bar, so it yielded zero cold sleepers — to a bond-graph morning read (cleaner and the truer model). No `SAVE_VERSION` bump (4th cycle running); eggs (`isClearNight`), the sky override, and huddle eligibility all untouched; NPCBrain not in play. 6 unit + 3 e2e; 9/9 AC; 320 unit / 116 e2e green in one full run, no flake. Unblocks 183 (seek den earlier) / 184 (keeper warms) / 185 (word of the cold) / 186 (hardy book) / 187 (toughened hide); 115 should read this gate for winter absences.

### Cycle 42 — 2026-06-10
- BACKLOG-171 shipped — Winter huddle pull: the year reaches the den. The huddle gate (cycle 18, untouched for 24 cycles) now reads a per-season rule from pure `world/huddle.ts`: winter opens the window at dusk (19:00→7:00) and lowers the bond bar to 4 so the den packs and near-strangers come in from the cold; summer waits until 23:00 so warm nights stay scattered; fall pulls the loosely-bonded (bar 6) on the old window; spring IS the legacy row, so a fresh clock is byte-identical to every build since cycle 18 — the untouched cycle-018 spec green in the full run is the proof. Eggs stay clear-night gated (no winter-dusk eggs), the sky event keeps its night-only override, `__bondPair` default unchanged. Zero save change for the third cycle running; no deps; NPCBrain not in play. 6 unit + 4 e2e; 9/9 AC; 309 unit / 111 e2e green (1 catalogued cold-boot flake, green isolated). Unblocks 179 (shiver) / 180 (odd bedfellows) / 181 (murmurs) / 182 (night ledger); 115 + 178 now have their table.

### Cycle 41 — 2026-06-10
- BACKLOG-170 shipped — Seasonal palates: the turning year reaches the feeding loop. Each season craves one food (spring greens / summer berries / fall fish / winter meat) and gives it a small +0.4 nudge inside the favorite-food verdict — enough to flip a dino whose top-two foods are near-tied, never enough to move a strong-fit one. So the cast splits on its own: Rex, Mossback, and Sunny each sway with the year (and each to a different food) while Twitch the herbivore and Glade the carnivore stay loyal in all four seasons. The same drop through the hatch now reads the calendar back to you — meat delights a meat-craver in winter, plain feed to that same dino in summer. `season` is optional on `favoriteFood`/`foodReaction`/`scanLines` so omitting it is byte-identical to cycle-061; the rush, the eat, the scan, and the `__favoriteFood` hook all read the same live clock season, which keeps the cycle-027 favorites e2e green by construction. Pure `world/foods.ts`; WorldScene only passes the season in. No save change, no new keys/deps, NPCBrain not in play. 7 unit + 4 e2e; 8/8 AC; 298 unit / 105 e2e green (1 cold-boot flake, green isolated). Unblocks 176 (seasonal gift cravings) + the rest of 174–178.

### Cycle 40 — 2026-06-09
- BACKLOG-159 shipped — Season foundation: the bowl gets a year. Week-long seasons on the realtime clock day (28-day wrapping year), a subtle per-season wash under the day/night overlay, the season on the clock HUD, and a once-only live beat when the year turns — banner, 🍂 ticker, and every dino files "the season turned to X" (gossip fuel). The season is pure derived state: the save format grew by NOTHING. The planner caught that the MAX_CATCHUP clock jump silently fires no listeners (the obvious e2e would have tested nothing) — staged via a restore-semantics __setClock + 2-minute live crossing instead. 7 unit + 4 e2e; 9/9 AC +1 bonus restore guard; 283 unit / 99 e2e, full e2e first try. Unblocks 026/028/170-173.

### Cycle 39 — 2026-06-09
- BACKLOG-161 shipped — First-contact inspection: the bowl reacts to who you chose. Switching observers (a REAL keeperId change via the picker; boot/restore/re-picks inert) draws the cast's best personality-fit dino across the bowl to the keeper for a long look — 👀 beat + a "went to the glass for a long look at <keeper>" memory in the persisted store, one-shot, INSPECT_TTL 24 steps (unit-pinned ≥ 19, the worst cross-bowl walk — a planner catch revising the design's 12). Strictly-positive fit required: nobody resonates, nobody comes. Pure `keeper/firstContact.ts`; WorldScene glue only (changed-id arm, one-dino beeline override, once-per-step resolver, __inspection/__lastInspection/__keeperFit hooks). Roster fits pre-verified (vanta→Glade, lumen→Rex, aether→Sunny). No save change, no new keys/deps. 6 unit + 4 e2e; 9/9 AC; 276 unit / 95 e2e green first try. Unblocks 165/167.

### Cycle 38 — 2026-06-09
- BACKLOG-157 first ability shipped (item stays open, 1/3) — Field Scan: LUMEN-3 "Lux" can read a living mind. As Lux, **B** beside a dino opens a dossier — all five personality axes as ▮▯ meters with their pole labels, current mood, favorite food, emergent role — pure formatting over helpers the sim already owns (AXES, moodFromTraits, favoriteFood). Aki and Vix can't: each refuses in its own voice, so the ability is legible by absence too. Pure `keeper/scan.ts`; WorldScene glue only (B toggle, heartsPanel-pattern overlay, refusal as a non-modal bubble, `B scan` hint, __scanOpen/__canScan/__scanLines/__warpTo hooks). No save change, no new deps, boundary intact. 7 unit + 4 e2e; 10/10 AC; 270 unit / 91 e2e green. Designer caught that the lore-suggested bond-sight ability already ships for everyone (V lens) and re-aimed the reveal at truly hidden state.

### Cycle 37 — 2026-06-09
- BACKLOG-155 shipped — Selectable keeper: the watcher gets a face you choose. The player is now one of three time-traveling robot observers (AETHER-1 "Aki" / VANTA-9 "Vix" / LUMEN-3 "Lux"), each with an era, a backstory, and a distinct ability; `K` opens a picker (1/2/3 to choose, modeled on the tone menu), the choice persists across reloads and into the save. The shipped ability is a personality fit — the chosen observer adds a 0..+2 affinity bonus when interacting with dinos whose temperament matches it, so which observer you are decides which dinos warm to you fastest. Pure `keeper/keepers.ts` (`KEEPERS` + `keeperById`/`keeperFit`/`keeperBonus`, mirrors tones.ts); WorldScene glue only (picker overlay, number-key dispatcher, bonus at recordGreet/recordTone/applyGift, a non-blocking fading first-time invite — no modal on boot). Additive `keeperId?` save (default AETHER-1, no SAVE_VERSION bump); no new deps; NPCBrain boundary intact. 9 unit + 4 e2e; 12/12 AC pass; 263 unit / 87 e2e green. QA fixed a stale cycle-035 tones assertion in-session (the keeper bonus correctly colors the tone-pick greet). The operator's live-session ask; unblocks 156/157/158. GBA-pixel-style nudge declined (needs a CHARTER amendment); seasons seeded as 159.

### Cycle 36 — 2026-06-08
- BACKLOG-144 shipped — World-scale night event: the bowl's first *collective* beat. On a rare clear night a sky event (meteor shower / aurora) fades a shimmer overlay over the night tint and pulls the whole cast off their wander to a shared centre-of-bowl gather tile — each arrival throws a ✨ awe bubble and files one shared memory — ending on duration-elapse or dawn. Pure `world/skyEvent.ts` (`SKY_EVENTS`, `rollSkyEvent`/`pickSkyEvent`, `atGather`, `skyExpired`, gather tile 10,7); WorldScene glue only (overlay depth 7, real-time roll timer + one-per-in-game-day cap, top-priority `stepSky` override in `forceStep`, dev hooks `__skyEvent`/`__triggerSky`/`__skyGazers`). No save-format change (shared memory persists via the existing memory store); no new deps; NPCBrain boundary intact. 7 unit + 4 e2e; 9/9 AC pass; 254 unit / 83 e2e green. QA caught a cadence regression (auto-roll on `onHour` dragged the cast off the den in the huddle test + fired ~1.4×/night) — fixed in-session by moving to a real-time roll cadence + per-day cap + lower chance. Unblocks 150–154.

### Cycle 35 — 2026-06-08
- BACKLOG-142 shipped — Player dialogue tones: the first two-way, consequential beat in dialogue. Greeting (E/Z) opens a Warm/Tease/Honest menu; the pick applies a personality-fit affinity delta (loved +5 / liked +3 / neutral +1 / clashed −2 — same tone, different verdict per name-seeded dino), files a `the keeper …` memory, and persists a last-tone trace surfaced in the menu header next time. Pure `social/tones.ts` (mirrors gifts.ts); WorldScene glue only (`recordTone` twin of `recordGreet`, repair seam preserved); reply path unchanged (tone-coloured reply → 148); additive `lastTone` save (no version bump). 6 files (+381/−2), no new deps, NPCBrain boundary intact. 9 unit + 4 e2e; 9/9 AC pass; 243 unit / 77 e2e green (isolated). Idea Box's first firing seeded this + 143/144/145/146/147; native follow-ups 148/149. Unblocks the dialogue-choices arc.

### Cycle 34 — 2026-06-07
- BACKLOG-132 shipped — Gratitude echo: the first reciprocal use of the dino↔dino bond graph (BACKLOG-013, dormant since cycle 18). When a dino is consoled (BACKLOG-130), it files *who* came for it in a persisted, additive `gratitude` ledger (`consoled → comforters`); on a later homecoming where that comforter is the sulking runner-up (BACKLOG-120), the dino it once consoled crosses the bowl first — past a stronger-bond peer, ignoring `COMFORT_BOND_FLOOR`. Pure `world/comfort.ts` (`Gratitude`, `recordGratitude` immutable+deduped, reciprocity override on `comforter` evaluated before the unchanged closest-friend scan); WorldScene glue only; `homecoming.ts` + the 125 repair seam untouched; additive save (no `SAVE_VERSION` bump). 15 unit + 2 e2e; 9/9 AC pass; 231 unit / 73 e2e green. Unblocks 137/138/139/140/141.

### Cycle 33 — 2026-06-06
- BACKLOG-130 shipped — Comforting nuzzle: the dino-to-dino half of the attention economy. When the homecoming makes a near-tied runner-up sulk `😒` (BACKLOG-120), the sulker's closest friend (highest pairwise bond, BACKLOG-013) crosses the bowl and consoles it — a floating `There there, <sulker>. 🫂`, the pair's bond grows by COMFORT_BOND (+2), and the sulker keeps a "<friend> came over to comfort me" memory. No friend above COMFORT_BOND_FLOOR (8) → no one comes, and the 120 sulk + 125 keeper-repair seam stay byte-for-byte unchanged. Pure `world/comfort.ts` (comforter w/ floor + alpha tie-break, comfortLine, comfortMemory); WorldScene glue only; `homecoming.ts` untouched; reward currency is the dino↔dino bond; additive save. 7 unit + 2 e2e; 9/9 AC pass; 212 unit / 70 e2e green. First beat to read the long-dormant bond graph; unblocks 132/133/136.

### Cycle 32 — 2026-06-05
- BACKLOG-125 shipped — Greeting the runner-up: a homecoming's jealous runner-up (BACKLOG-120) is marked pending-repair (transient, one-shot); greeting it gives an outsized affinity bump (`greetGain`+6), floats `You noticed me! 😊`, and files a "the keeper noticed X after all" memory, then clears. Pure `world/repair.ts` (repairGain/repairLine/repairMemory); WorldScene glue only (pendingRepair set in playHomecoming, consumed in recordGreet); homecoming.ts untouched; additive save. 5 unit + 3 e2e; 9/9 AC pass; 202 unit / 67 e2e green. Closes the hurt→heal loop; unblocks 128/129.

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
