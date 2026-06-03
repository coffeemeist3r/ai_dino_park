# Changelog

Append-only. Validator adds an entry on APPROVED verdicts. Format:

```
## Cycle NNN — YYYY-MM-DD
- BACKLOG-NNN: <title> — <one-line outcome>
```

---

## Cycle 030 — 2026-06-03

- BACKLOG-112: Homecoming nuzzle — APPROVED. After a long real absence, your *closest* dino (highest player-friendship) notices you came back: a heart-graded 👋 "welcome back" bubble floats over it on return, and it keeps a faint "the keeper came home" memory. Reads the BACKLOG-106 catch-up duration; gated at 6 in-game hours so an instant reload stages nothing. Pure `world/homecoming.ts` (max-friendship + alphabetical tie-break, three warmth bands) with WorldScene glue only (restore + `__catchUp` compute, `showBubble`, `remember`); reuses `friendship.heartsFromPoints` + `memory.remember`. No friendship-points change (hearts ACs untouched); additive save, boundary intact. 8 new unit + 2 new e2e; 185 unit / 61 e2e green. First personal beat on the cycle-29 spine; unblocks 119–122.

## Cycle 029 — 2026-06-02

- BACKLOG-106: Offline catch-up ("while you were away") — APPROVED. On load, reads the real gap since `savedAt` (× the saved scale) and fast-forwards the world cheaply — no per-tick loop, no LLM: bonded companion pairs drift closer (capped), each gets a "kept each other company" memory, and a "While you were away…" digest greets the player. Pure `world/away.ts` (`awayMinutes`, `fastForward`) + a new `advanceTime` clock export; span capped at 7 in-game days so a week away can't hang the load. Additive save (no version bump); old saves no-op the catch-up. 13 new unit + 2 new e2e; 170 unit / 58 e2e green. The payoff of cycle-28 realtime; spine for the 112–116 cluster.

## Cycle 028 — 2026-06-01

- BACKLOG-105: Wall-clock-anchored time + configurable scale — APPROVED. The clock no longer counts timer ticks; it reads the wall clock. `WorldClock` now anchors an epoch + an absolute in-game minute and derives the current `GameTime` from `(now() − anchor) × scale`, via an **injectable** `now()` source so it stays pure/Node-testable. `tick()` survives untouched as the one-minute boundary primitive — the new `update()` pump just calls it for each whole minute the wall clock has crossed — so every prior time-driven spec and `__advanceMinutes` keeps working. The payoff: a backgrounded tab (where Phaser throttles) catches up to true time on return instead of silently falling behind. Default is **1× realtime** (a full day/night = 24 real hours — the true fishbowl); **T** toggles 1×⇄60× (the old "1 real sec ≈ 1 game min" watching rate) and re-anchors so the time never jumps on toggle; the HUD shows the active rate (`Day 1 — 08:00 ·1×`). Catch-up is capped at one in-game day of per-minute fires — a longer gap jumps the clock without flooding listeners (rich offline catch-up is BACKLOG-106). `SaveData` gains additive `savedAt`/`scale` (the seed 106 needs); `SAVE_VERSION` stays 1 and old saves still load. Pure `world/clock.ts` + additive `world/saveGame.ts`; WorldScene glue only (T key, HUD, hooks). 9 new unit + 2 new e2e; full suite **157 unit / 56 e2e** green. Boundary clean (AI untouched). Unblocks BACKLOG-106 (offline catch-up) and the cycle-28 realtime rituals (108–111).

## Cycle 027 — 2026-06-01

- BACKLOG-061: Food favorites — APPROVED. The hatch feed has a flavor now and the dinos have opinions. **H** drops one of four foods (🍖 meat, 🌿 greens, 🐟 fish, 🍓 berries) and each dino quietly favors one — derived from its temperament with the *same* `giftScore` math the gift system uses (a food is a gift through the lid). When a dino snaps up *its* favorite it's extra-happy: a bigger bump (`FEED_GAIN_FAV=9` vs the plain `FEED_GAIN=5`), a 😋 (vs 🙂), and a "your favorite …!" memory it can later gossip about; it also rushes its favorite harder — a wider reach (`FEED_RANGE_FAV=12`) and a lower energy bar (`EAGER_FAV=0.15`) — so the keeper learns each palate by watching who comes running for what. Favorites vary (Rex/Glade → meat, Mossback/Sunny → berries, Twitch → greens). Pure `world/foods.ts` (`favoriteFood`, `foodReaction`) + an optional `isFavorite` on `feeding.ts`'s `reactionToFood` (default false → cycle-25 behavior byte-identical); WorldScene glue only. 9 new unit + 2 new e2e; full suite **148 unit / 54 e2e** green. Save unchanged (favorites re-derive from the name; food stays ephemeral). Opens the taste cluster: 066 taste talk, 067 keeper-loaded hatch, 068 acquired taste, 069 menu-in-the-book, 070 picky/gobble.

## Cycle 026 — 2026-05-31

- BACKLOG-060: Idle / ambient mode — APPROVED. The vivarium becomes a quiet desktop companion: after `IDLE_AFTER_MS=12s` with no input, the HUD eases down to `AMBIENT_ALPHA=0.12` over `FADE_MS=1.5s` and the camera starts a slow "breathing" zoom (1.0↔1.04, 6s yoyo) toward the centre of the bowl — leaving just the glass and its life. Any key, click, or held movement snaps everything back to full instantly. Held WASD counts as activity (movement polls `isDown` and doesn't refire keydown). Pure `world/idle.ts` (`isIdle`, `hudAlpha` — monotonic fade curve); WorldScene tracks `lastInputAt`, fades a set of always-on HUD texts, and runs the camera tween. Completes the fishbowl furniture (056 glass / 057 tap / 058 plaque / 059 feed / 060 idle). 5 new unit + 2 new e2e (fade + ambient flag on idle; real keypress wakes it); full suite **139 unit / 52 e2e** green. Save unchanged.

## Cycle 025 — 2026-05-31

- BACKLOG-059: Feeding hatch — APPROVED. The bowl's lid has a hatch now: press **H** and a 🍖 falls from the top into the upper-middle feeding zone, and the cast swarms it. Eager, in-range dinos (`energy ≥ 0.4` within 7 tiles) make a beeline; the calm and the far-off keep wandering. The first dino to reach the food snaps it up — 😋, a friendship bump (`FEED_GAIN=5`), and a "scrambled to the hatch and snapped up the food" memory that can ripple into gossip; the rest disperse. One piece at a time; the drop + eat both post to the Park News ticker. Reframes gifting (F, hand-to-one) as feeding the tank (H, broadcast-to-cast) — the keeper picks the input, the bowl picks the winner. Pure `world/feeding.ts` (`reactionToFood`/`feedStep` reusing `stepToward`/`reachedFood`/`foodLanding`); WorldScene glue only. 9 new unit + 2 new e2e; full suite **134 unit / 50 e2e** green, no flake. Save unchanged (food is ephemeral). Spine for 061 favorites / 062 scramble / 063 begging / 064 hoarder role / 065 feed-log.

## Cycle 024 — 2026-05-30

- BACKLOG-058: The Plaque — APPROVED. An engraved brass nameplate sits under the bowl — *"VIVARIUM · Pocket Cretaceous"* over a live stat line: `Day N · M specimens · G generations`. The generation count is a pure readout of the lineage the breeding loop produced: founders are gen 1, a hatchling is 1 + the deeper of its two parents, so the plaque deepens on its own as families breed across days. Pure `ui/plaque.ts` (`generationOf` memoized + cycle-guarded, `maxGeneration`, `plaqueLines` with pluralization); the scene renders it bottom-center, refreshed on the clock tick. 5 new unit + 1 new e2e (plaque reports population and ticks to 2 generations when an egg hatches); full suite **125 unit / 48 e2e** green. The bowl now wears its label.

## Cycle 023 — 2026-05-30

- BACKLOG-057: Tap the glass — APPROVED. The keeper can now rap the vivarium wall (click anywhere): a ripple ring expands at the tap and every dino within range reacts **by temperament** — the timid bolt away (❗), the bold creep closer to investigate (❓), the far-off don't notice. The reaction is decided by the dino's seeded `bravery` and its distance from the tap, and the scare is written into the dino's memory ("the glass shook and you bolted/crept closer") so it can ripple into gossip and dialogue. Pure `world/startle.ts` (`reactionFor`/`fleeStep`/`startleStep`, reusing `stepToward`); WorldScene adds a `pointerdown` handler, the ripple tween, and the ❗/❓ flash. 6 new unit + 2 new e2e; full suite **120 unit / 47 e2e** green. First time the keeper can *touch* the bowl.

## Cycle 022 — 2026-05-30

- BACKLOG-056: The Glass (vivarium frame) — APPROVED. Reframes the whole game per the operator's "mini dino fishbowl" idea: the world is now a **sealed glass vivarium** the player keeps and watches. Draws the bowl — an edge vignette (corners doubled for a deeper shadow), a crisp pale-cyan glass rim with a faint inner highlight, two reflection streaks, and a curved light-catch arc along the top lip. Pure geometry in `ui/glass.ts` (`cornerRadius`/`rimRects`/`edgeBands`/`glarePolys`/`toPoints`); the scene draws it at depth 8 (over the night tint + bond lines, under the HUD). No sim change — purely visual. New lore doc `studio/lore/vivarium.md` + a fishbowl backlog section (057 tap-the-glass, 058 plaque, 059 feeding hatch, 060 idle mode). 5 new unit + 1 new e2e; full suite **114 unit / 45 e2e**, green across two consecutive runs. Visually verified in a live preview.

## Cycle 021 — 2026-05-30

- BACKLOG-021 + BACKLOG-020: Observer lenses — APPROVED. One key (**V**) cycles the player through ways of *seeing* the emergent sim, each a pure readout of state the sim already produced (no new scripting): **📖 Collection Book** (every dino incl. hatchlings — species, hearts, strongest bond, emergent role, lineage "child of X + Y", rumors heard), **🔗 Bonds** (lines drawn between bonded pairs on the map, thicker = stronger), **🎭 Roles** (a role tag floats over each dino — `gossip`/`homebody`/`socialite`/`wanderer` **derived from behavior**, BACKLOG-020), **📰 Park News** (live ticker of births/hatches/gossip). Pure `ai/roles.ts` (`deriveRole`) + `ui/lenses.ts` (`nextLens`/`bondedPairs`/`tickerLines`/`bookLines`); `BornDino` gains a `parents` field for lineage (additive). WorldScene adds the lens layer + an event log. 14 new unit + 3 new e2e; full suite **109 unit / 44 e2e**, green across two consecutive e2e runs. Visually verified all four lenses in a live preview. Turns the invisible sim into something you watch — without ever authoring an outcome.

## Cycle 020 — 2026-05-30

- BACKLOG-019: Gossip propagation — APPROVED. When two dinos converse on meeting, the speaker passes a recent **first-hand** memory to the listener as second-hand news, planted in the listener's memory marked `told me:` so it won't re-spread (1 hop, no loops). Because memory already feeds the prompt as "Lately: …", a dino can now bring up things it only *heard* about — news ripples through the park as the cast mingles. Pure `social/gossip.ts` (`swapPronouns`/`isShareable`/`pickGossip`/`makeRumor`/`spreadGossip`), wired into the throttled `converse` path so it spreads at conversation cadence. 7 new unit + 2 new e2e; full suite **99 unit / 41 e2e**, green across two consecutive e2e runs.

## Cycle 019 — 2026-05-30

- BACKLOG-042: Egg phase — APPROVED. The park grows itself. When two dinos whose bond clears the threshold (`EGG_BOND_THRESHOLD=60`) share a sleeping huddle on a clear night, a 🥚 appears by the den; after `EGG_HATCH_DAYS=3` in-game days it hatches into a brand-new dino whose traits, color, and species are **blended from the two parents** (pure `breeding.ts`: `blendTraits`/`blendColor`/`childName`/`shouldLay`/`hatch`). Born dinos and pending eggs ride into the save (additive, version 1) and respawn on reload, so the family tree survives sessions. A hard `MAX_POPULATION=12` cap stops runaway breeding. Weather isn't in yet (BACKLOG-028) so every night counts as "clear". 12 new unit + 3 new e2e; full suite **92 unit / 39 e2e**, green across two consecutive e2e runs. Closes the social loop started by cycle-18 huddles: meet → bond → huddle → **breed**.

## Cycle 018 — 2026-05-30  (capstone)

- BACKLOG-013 + BACKLOG-041: Pairwise bonds + night sleeping huddles — APPROVED. Every NPC↔NPC meeting strengthens a symmetric pairwise **bond** (0–100, pure `bonds.ts`, persisted). A visible **den** sits lower-centre; at **night** any dino whose strongest bond ≥ threshold walks to the den instead of wandering, clusters with its friends (💤 over each), and the huddle adjacency keeps deepening the bond — then they disperse at dawn. Self-reinforcing: meeting builds bonds, bonds drive huddling, huddling builds bonds. 8 new unit + 2 new e2e; full suite 80 unit / 36 e2e, green across three consecutive runs.

## Cycle 017 — 2026-05-30

- BACKLOG-011: NPC memory store — APPROVED. Each dino keeps a small ring buffer of recent events (you greeting it, gifts + how it reacted, running into other dinos). The last few are woven into its prompt ("Lately: …") so it reacts to history, and the memory rides into the save — so a dino remembers you next session. At dawn each dino folds its events into a one-line reflection. Pure `memory.ts` (`remember`/`recall`/`reflect`); additive save field (version unchanged, old saves default to empty). 7 new unit + 1 new e2e.

## Cycle 016 — 2026-05-30

- BACKLOG-006: Device probe — APPROVED. The brain sizes the model to the device instead of hardcoding 0.5B: pure `pickTier` scores `navigator.deviceMemory` + the WebGPU adapter's max storage-buffer size into tiny (0.5B) / small (1.5B) / medium (3B), and `defaultLoader` loads that model; choice surfaced via `window.__modelLabel`/`__modelInfo`. (Browsers can't write `config.json` — selection is exposed instead.) 5 new unit + 1 new e2e.

## Cycle 015 — 2026-05-30

- BACKLOG-055: Livelier character voice — APPROVED. Diagnosed bland replies: the prompt threw away the vivid roster flavor (only dry trait adjectives reached the model), was negative-heavy, and the output was triple-truncated (one sentence + 60 tokens + first-sentence-only cleaner). Fix: the system prompt now leads with character and feeds BOTH the roster flavor ("loves rocks", "quick to bolt") and the trait adjectives, with a single light "never a chatbot or helper" clause and an invitation for "one or two vivid, specific sentences"; `cleanReply` keeps up to 2 sentences; generation is `max_tokens 100` / `temperature 0.9`. 66 unit / 32 e2e green.

## Cycle 014 — 2026-05-30

- BACKLOG-052: NPC↔NPC dialogue — APPROVED. Dinos now drift toward each other (~45% of steps via pure `stepToward`) so they actually cluster and meet, and on meeting one speaks a brain-generated line (`npc_meet`) in a floating speech bubble above it (🧠-tagged when model-written), throttled by a cooldown + in-flight guard to protect the single shared engine. Also added a WebGPU guard so the brain fails fast to the canned fallback (and skips a doomed worker) on browsers without WebGPU. 3 new unit + 2 new e2e.

## Cycle 013 — 2026-05-30

- BACKLOG-053: Sane controls — APPROVED. WASD movement (arrows kept), E to interact and F to give (Z/G kept as aliases), save-export moved off E to O, plus an on-screen controls hint. 2 new e2e.

## Cycle 012 — 2026-05-30

- BACKLOG-051: Richer dialogue context — APPROVED. The WebLLM prompt now carries the time of day (`dayPhase`), the dino's current mood (`moodFromTraits`), and the player's friendship level (hearts → `relationshipLabel`), and the greet line itself changes with the relationship (stranger → dear friend). Pure prompt enrichment reusing three existing signals; verifiable via the new `__greetPrompt` dev hook. 2 new unit + 2 new e2e; 7/7 AC pass. Directly targets the "mostly hellos" sameness.

## Cycle 011 — 2026-05-30

- BACKLOG-018: NPC movement + meeting spine — APPROVED. Dinos wander the map (pure `wanderStep`, clamped, driven off the world clock at a gentle throttle) and record a symmetric pairwise "meeting" tally when two end a step adjacent (pure `recordMeet` — the seed of pairwise affinity), flashing both labels. `nearestDino` reads live positions, so greeting/gifting follow a dino wherever it roams. LLM dino-to-dino dialogue deferred to BACKLOG-052. 5 new unit + 2 new e2e; 8/8 AC pass.

## Cycle 010 — 2026-05-30

- BACKLOG-049: WebLLM Web Worker offload + observability — APPROVED. Inference moved into a dedicated Web Worker via `CreateWebWorkerMLCEngine`, so model load/generation no longer block the render loop (build confirms web-llm split into its own worker chunk). Added a brain-status HUD (🧠 thinking… / ready / offline) and a per-reply `source` tag that prefixes 🧠 on lines the model actually generated — so the player can tell a real LLM line from the canned fallback. 2 new unit + 2 new e2e; smoothness/tag is a human WebGPU check.

## Cycle 009 — 2026-05-30

- BACKLOG-015: Gift system — APPROVED. Hold one of five items (shiny shell, wildflower, smooth rock, sparring stick, mossy snack), cycle with [ / ], press G near a dino to give it. A pure `giftReaction` scores the item's appeal against the dino's personality → loved / liked / neutral / disliked, and the affinity delta rides the existing friendship store + save. The reaction reads out in the dialog box. 7 new unit + 2 new e2e; 9/9 AC pass. Personality now changes what the player should do.

## Cycle 008 — 2026-05-30

- BACKLOG-048: In-character dino dialogue — APPROVED. Fixes the assistant-voice the live spot-check exposed: a hardened system prompt ("You are NOT an AI assistant…") with a one-shot in-character example, plus a pure `cleanReply` that strips wrapping quotes, drops assistant boilerplate, and keeps the first in-character sentence (falling back to a canned line if nothing survives). Deterministic guardrail means help-desk text can't reach the dialog box regardless of model output. 5 new/updated unit tests; voice-quality is a human re-greet follow-up.

## Cycle 007 — 2026-05-30

- BACKLOG-005: WebLLM-backed brain — APPROVED. `WebLLMBrain` runs Qwen2.5-0.5B in the browser via WebGPU, lazy-loaded on first greet behind the `NPCBrain` boundary (only `ai/webllmBrain.ts` imports `@mlc-ai/web-llm`, dynamic/code-split). Progressive + safe: instant canned fallback while loading or without WebGPU, never throws/blocks; one engine shared across all dinos. Prompt built from name/species/personality. 6 new/updated unit (incl. fake-engine generate path) + 2 new e2e; automatable AC pass. Live token generation deferred to a human spot-check (BACKLOG-047) — WebGPU confirmed available, but the verify harness couldn't drive a real greet.

## Cycle 006 — 2026-05-29

- BACKLOG-016: Friendship hearts — APPROVED. The first player-facing loop: greeting a dino raises affinity (0–100 points → 0–10 hearts), **C** toggles a collection panel listing all five dinos with heart bars, and the affinity persists in the IndexedDB save. Gain scaled by the dino's warmth/sociability (cycle-4 traits). Pure `friendship.ts`; additive save field (`SAVE_VERSION` unchanged, old saves default to empty). 7 new unit + 2 new e2e; 9/9 AC pass.

## Cycle 005 — 2026-05-29

- BACKLOG-017: Spawn 5 NPCs — APPROVED. A pure `ROSTER` (Rex, Mossback, Sunny, Twitch, Glade) with distinct species, spawn tiles, and colors; each dino's personality is seeded from its name (cycle 4). WorldScene spawns the cast via a loop reusing the `Dino` class; Rex anchored at `dinos[0]` for save/personality continuity. 4 new unit + 4 new e2e; 9/9 AC pass.

## Cycle 004 — 2026-05-29

- BACKLOG-010: NPC personality traits — APPROVED. 5 axes (curiosity, sociability, energy, agreeableness, bravery) seeded deterministically from a dino's name via `seededPersonality` (stable across reloads, not stored in save). `describePersonality` renders dominant poles into a brain-ready phrase. Traits flow through `NPCContext` (boundary intact) and the stub brain's mood now reflects them. 6 new unit + 2 new e2e; 9/9 AC pass.

## Cycle 003 — 2026-05-29

- BACKLOG-009: Save / load via IndexedDB — APPROVED. World survives a refresh: in-game time + player position restore on boot, auto-save fires each in-game hour, **E** exports a `dino-save.json`. Pure version-gated `serialize`/`deserialize` (`saveGame.ts`) split from raw-IndexedDB I/O (`saveStore.ts`); clock reused via new `set()`. 6 new unit + 5 new e2e; 9/9 AC pass. `version:1` seam left for BACKLOG-040 migration.

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
