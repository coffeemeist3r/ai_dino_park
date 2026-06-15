# Cycle 52 — Design

**Item** — BACKLOG-234 [emergent] The bowl self-corrects — once a cold-night sufferer is warmed by the keeper (184) or otherwise recovers, a carrier that next meets it drops the now-false cold word ("oh — you're alright now") instead of passing it on; recovery un-tells the rumor.

## Why this cycle

The cold-rumor arc has only ever grown: the cold spreads (185), sparks a visit (217), and the warmth spreads too (223). But the bowl can't yet be *wrong out loud* — a dino carrying word that Mossback slept cold will keep pitying Mossback forever, even after the keeper thawed it and it's perfectly fine. Cycle 52 closes the loop: a rumor mill that can retract a false alarm is a real one. And because every dependency already ships — `heardColdWordAbout` (217) names the carrier→sufferer link, `WARM_NEWS_TOKEN`/`warmMemory` (223) says whether the sufferer recovered, the keeper-warming (184) is what recovers it — this is a pure detector plus a memory drop in the converse seam, no save change.

Crucially this **refines the shipped sympathy visit (217)**, it doesn't just sit beside it: today a carrier meeting a *recovered* sufferer still throws the stale "heard you had a rough night" pity visit and a `SYMPATHY_BOND` bump. That's the awkward edge. With 234, a recovered sufferer gets the **all-clear** instead — the carrier drops the worry with relief, and the pity visit is suppressed. The same cycle makes an existing beat smarter.

## What ships

When two dinos converse and one of them carries the *other's* cold word from a prior meeting **and that other dino has since recovered** (it carries a first-hand warm memory — the keeper warmed it, 184), the carrier **self-corrects**: it drops `coldWordLine(sufferer)` from its own memory, files a first-hand relief memory ("saw `<sufferer>` came through it fine"), floats a 😌 relief line ("Oh — you're alright now, `<sufferer>`! 😌"), and logs a distinct 😌 line. The stale **sympathy visit (217) is suppressed** in this case — no pity beat, no `SYMPATHY_BOND` bump; relief replaces pity.

When the sufferer has **not** recovered (no warm memory), nothing changes: the sympathy visit fires exactly as it does today (cycle-050 behavior preserved). After a self-correction the carrier no longer holds the cold word, so it won't re-pity or re-correct on later meetings — the rumor is genuinely gone from that head.

A QA tester (headless): plant cold word about Mossback on Sunny (a prior meeting) and a warm memory on Mossback (the keeper warmed it); converse Sunny↔Mossback → Sunny's memory drops `coldWordLine('Mossback')`, gains the relief memory, the 😌 log appears, and the Sunny–Mossback bond is **unchanged** (no sympathy bump). Control: Mossback not warmed → the sympathy visit fires (bond bumps), no drop.

## Acceptance criteria

- [ ] `recovered(store, name)` returns true iff `name` carries a *shareable* (non-rumor) memory containing `WARM_NEWS_TOKEN`; false for a cold-only or empty store.
- [ ] `reliefLine(corrector, sufferer)` contains both names and 😌; `reliefMemory(sufferer)` is first-hand (`isShareable` true) and distinct from `cameToFindMemory(sufferer)`, `coldMemory()`, `warmMemory()`, and `neglectMemory()`.
- [ ] `selfCorrect(store, a, b)` returns `{ corrector, sufferer, dropped, memory }` (with `dropped === coldWordLine(sufferer)`) when the carrier holds the other's cold word **and** that other has recovered; direction-agnostic (call order doesn't decide who corrects); returns `null` when neither carries the other's cold word, when the carried-about dino has **not** recovered, and when `a === b`.
- [ ] `forget(store, name, entry)` returns a new store with exactly that one entry removed from `name`'s list, leaving every other entry and every other name untouched, and not mutating the input.
- [ ] In `converse`, a carrier meeting a **recovered** sufferer: `coldWordLine(sufferer)` is gone from the carrier's memory, a relief memory is on the carrier, the 😌 line floats, the 😌 log line appears, and the sympathy visit does **not** fire (the pair's bond is unchanged by this meeting's cold-rumor handling).
- [ ] A carrier meeting a **non-recovered** sufferer is byte-unchanged: the sympathy visit fires and bumps the bond exactly as cycle 50 (cycle-050-sympathy-visit pin green).
- [ ] After a self-correction the corrector no longer carries the sufferer's cold word (a second `selfCorrect`/`sympathyVisit` on the same pair yields null).
- [ ] No `SAVE_VERSION` change; no new dependency; boundary grep clean (no `@mlc-ai/web-llm` outside `game/src/ai/`); `npm run build` + `npm run test:unit` + `npx playwright test` all green.
- [ ] E2E: the recovered-sufferer drop + 😌 log + unchanged bond, and the non-recovered control where the sympathy visit fires.

## Out of scope

- **Relief travelling as a new bright rumor (BACKLOG-235)** — the correction is silent-to-the-rest-of-the-bowl here; only the carrier drops it.
- **The trust cost of a false alarm (236)**, the **book "since put right" mark (237)**, the **time-based staleness gate (238 / 222)**, the **😌 all-clear ticker to the keeper (239)**, and **premature all-clear (240)** — all their own items.
- **No time gate.** This is correction-by-*sight* only (a carrier must actually meet the recovered sufferer). Correction-by-time is 238/222, still deferred.
- No change to how a dino is warmed (184), how the cold/warm word spreads (185/223), or to the sympathy visit's behavior when the sufferer has *not* recovered.

## Constraints

- **Mirror the sympathy-visit shape (217).** `selfCorrect` is a pure detector like `sympathyVisit` — no mutation; the converse seam applies the `forget` + `remember` to live state, reading a pre-meeting snapshot exactly as 217 does, so this meeting's fresh plants can't interfere.
- 234 takes **precedence over** 217 in the seam: check `selfCorrect` first; if it fires, skip the sympathy visit for that meeting.
- Keep `sympathyVisit`, `spreadColdWord`, `spreadWarmWord`, `spreadGossip` **byte-unchanged** (cycle-020/049/050 specs are the pins). Only the seam gains a higher-precedence branch, and `cold.ts` gains the new pure trio.
- Add `forget` to `ai/memory.ts` as a pure sibling of `remember` (filter, return new store, no mutation) — the one genuinely new primitive, kept tiny.
- The 😌 relief register must be distinct from 🫂 (sympathy) / 🥶 (cold) / 😊 (warmth) / 🗣️ (generic) so QA can read which tier fired.
- Additive only — no save-format change (twelfth cycle running).
