# Cycle 51 — Design

**Item** — BACKLOG-223 [emergent] Word of the warmth — the *good* news travels too: a dino the keeper warmed (184) lets that slip to the next it meets ("the keeper came for them"), a bright rumor on the same gossip spine as the cold word (185), so kindness spreads through talk the way hardship does.

## Why this cycle

For three cycles the gossip channel has only ever carried hardship — the cold word (185) and the deed it sparks (217). The bowl gossips, but only misery. Cycle 51 makes the channel two-sided in the cheapest possible way: the keeper-warmth beat (184) and the cold-word spine (185) already ship, and `warmMemory()` already sits in the store on every warmed dino. This cycle is the mirror image of 185 — a warm-word trio beside the cold-word trio, and a one-line precedence change in the converse seam. The payoff is emotional symmetry: the same dino that would have spread "they slept cold alone" now, once you've warmed it, spreads "the keeper came for them" instead. Good news learns to travel.

## What ships

When two dinos converse and the speaker carries a **first-hand warm memory** (it was warmed by the keeper after a cold night — `warmMemory()` in its store, not a rumor), it now leads with the **word of the warmth**: a distinct bright rumor — "`<speaker>` `<RUMOR_MARK>` the keeper came for them, warmed them right out of the cold" — planted on the listener, and a distinct **😊** log line ("`<listener>` heard the keeper warmed `<speaker>`"). Like the cold word, it carries `RUMOR_MARK` so it reads as hearsay and travels exactly **one hop** (a listener can't re-spread it as fresh news).

Crucially, **warm word takes precedence over cold word**: a dino carrying *both* a cold memory and a warm memory (it slept cold, then the keeper warmed it) leads with the *warm* news, not the cold — a rescued dino talks about the rescue. A dino that slept cold and was *never* warmed is unchanged: it still leads with the cold word (🥶). The precedence is the whole emotional point — note that `warmMemory()` contains the substring "cold night", so without the warm-first ordering a warmed dino would keep spreading the cold word about itself forever; this cycle is what lets recovery change the story it tells.

A QA tester (headless): plant a warm memory on Rex (`__rememberWarm('Rex')`), force a conversation Rex→Mossback, and `Mossback`'s memory now contains `warmWordLine('Rex')` and the log shows the 😊 line. Force Mossback→Sunny next: the warm word does **not** re-spread (1 hop).

## Acceptance criteria

- [ ] `warmWordLine(speaker)` contains `RUMOR_MARK` and `speaker`, and is a distinct string from both `warmMemory()` and `coldWordLine(speaker)`.
- [ ] `WARM_NEWS_TOKEN` is a substring of `warmMemory()` (unit-pinned) and is **not** a substring of `coldMemory()` or `neglectMemory()` (so cold/neglect memories never read as warm news).
- [ ] `spreadWarmWord(store, speaker, listener)` returns `{ store, rumor }` with `rumor === warmWordLine(speaker)` and the line planted on `listener` **iff** `speaker` carries a shareable (non-rumor) memory containing `WARM_NEWS_TOKEN`; otherwise `rumor === null` and the store is unchanged. `speaker === listener` ⇒ null.
- [ ] A planted `warmWordLine` is **not** re-shareable: `spreadWarmWord` called from the listener (now carrying the rumor) returns `rumor === null` (RUMOR_MARK ⇒ 1 hop).
- [ ] In `converse`, a speaker carrying **both** a cold memory and a warm memory plants `warmWordLine(speaker)` (not `coldWordLine(speaker)`) on the listener, and logs the 😊 warm line — warm word wins.
- [ ] A cold-only speaker (warm memory absent) is byte-unchanged: it still plants the cold word and logs 🥶 (cycle-049 pin spec green).
- [ ] Neither-news speakers still fall through to generic `spreadGossip` with the 🗣️ line (cycle-020 pin spec green).
- [ ] No `SAVE_VERSION` change; no new dependency; boundary grep clean (no `@mlc-ai/web-llm` outside `game/src/ai/`); `npm run build` + `npm run test:unit` + `npx playwright test` all green.
- [ ] E2E: `__rememberWarm('Rex')` then a forced Rex→Mossback conversation lands `warmWordLine('Rex')` in Mossback's recall and surfaces the 😊 log line; a following Mossback→Sunny conversation does not re-spread it.

## Out of scope

- **Which word to lead with when carrying two friends' rumors (BACKLOG-229)** — this cycle's precedence is only *warm-about-self over cold-about-self*; choosing between rumors about *different* dinos by bond is 229.
- **Hearing kindness priming a dino to give it (BACKLOG-230)** — warm word spreads here but sparks no deed; the comfort-cascade is 230.
- **A kind keeper's reputation bonus (BACKLOG-231)**, the **book tagging (232)**, the **freshness gate (233)**, and the **self-correct-on-recovery drop (234)** — all deferred to their own items.
- No change to how/when a dino is warmed (184), to the sympathy visit (217), or to the cold word (185) itself.

## Constraints

- **Mirror the cold-word trio exactly** (`COLD_NEWS_TOKEN` / `coldWordLine` / `spreadColdWord`) so the two read as siblings; reuse `RUMOR_MARK` + `isShareable` + `recall`/`remember` — no new gossip machinery.
- Keep `spreadColdWord` and `spreadGossip` **byte-unchanged** (cycle-049 + cycle-020 specs are the pins); only the converse seam's *ordering* changes (warm tier inserted above cold).
- The converse change must stay byte-identical whenever no warm memory is present, so every existing converse/gossip/cold/sympathy spec stays green by construction.
- Pure logic in `world/cold.ts` (no Phaser import); WorldScene gets only the seam wiring + dev hooks.
- Additive only — no save-format change (eleventh cycle running).
