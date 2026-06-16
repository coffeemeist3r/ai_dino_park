# Cycle 53 — Design Handoff

## Item

BACKLOG-235 [emergent] — Relief travels too.

## Why this cycle

Cycle 52 taught a carrier to *retract* a false alarm on sight: meeting a dino it had heard slept
cold, finding it warmed/recovered, it drops the stale `coldWordLine` with relief and files a
first-hand memory — `saw <sufferer> came through it fine` (`reliefMemory`). But the relief stops
there: it changes the corrector's own head and nothing else. The cold rumor, by contrast, *spread*
— that was the whole point of cycle 49. Cycle 53 closes the asymmetry. The relief becomes news the
corrector carries forward: the next dino it meets hears the all-clear ("Mossback came through it
fine"), a bright 1-hop rumor on the same gossip spine the worry rode. The bowl doesn't just go
quiet on a false alarm — it actively un-tells it, the way it once told it. This is pure emergence:
a third dino, never near the sufferer, learns the worry is over because the talk reached it.

## What ships

A new "word of the relief" spread, the exact bright twin of cycle 51's "word of the warmth":

- A dino that carries a **first-hand relief memory** (`saw <X> came through it fine`, filed when it
  self-corrected in a prior meeting) now **leads with the all-clear** when it next speaks to another
  dino: the listener's memory gains a distinct 1-hop rumor naming the recovered dino as fine now.
- The planted rumor carries `RUMOR_MARK` — it reads as heard-not-witnessed and **cannot re-spread**
  (the 1-hop ceiling that keeps every rumor in this arc from looping forever).
- The conversation log gets a distinct **😌 all-clear** line: `😌 <listener> heard the all-clear from
  <speaker>`, sitting beside the existing 🥶 (cold), 😊 (warm), 🗣️ (generic) lines.
- **Precedence:** relief is the most-current, brightest news, so it leads the gossip cascade — checked
  **before** warm word, then cold word, then generic gossip. A dino that just cleared a friend's name
  talks about *that*, not about an older warming or cold night it may also carry.

Observable in play: ride to deep winter, leave a dino (say Mossback) to sleep cold so the word gets
out; warm it yourself; let a carrier meet Mossback and drop the worry (the cycle-52 😌). Then watch
that carrier meet a *third* dino — the log shows `😌 … heard the all-clear from …`, and the third
dino now carries "Mossback came through it fine" in its memory, never having been near Mossback.

## Acceptance criteria

- [ ] `spreadReliefWord(store, speaker, listener)` plants a rumor on the listener when the speaker
      carries a first-hand relief memory (`includes('came through it fine')` && shareable), and
      returns `{ store, rumor }` with the planted line.
- [ ] The planted relief rumor contains `RUMOR_MARK` and names the recovered dino (the sufferer),
      e.g. contains `Mossback` and `came through it fine`.
- [ ] The planted relief rumor is **not shareable** (`isShareable` false) — it cannot re-spread (a
      second hop from the listener returns null for the relief word).
- [ ] `spreadReliefWord` returns `{ store unchanged, rumor: null }` when the speaker has no first-hand
      relief memory, and when `speaker === listener`.
- [ ] A dino that merely *heard* the all-clear (carries the rumor, not the first-hand memory) does
      **not** re-spread it.
- [ ] In the converse seam, relief takes precedence: when the speaker carries both a relief memory
      and a warm/cold memory, the planted rumor is the relief one and the log line is the 😌 all-clear
      (warm/cold/generic logs do not also fire).
- [ ] E2E: a carrier that self-corrected about a recovered sufferer, then converses with a third
      dino, plants the all-clear in the third dino's memory and logs 😌; a carrier with no relief
      memory does not.
- [ ] `npm run build` clean, full unit + e2e suites green, no save-format change, boundary grep clean.

## Out of scope

- The bowl-wide mood barometer (241), gratitude to the corrector (243), relief saturation /
  freshness gate for good news (244), and the book's "cleared" mark (245) — all deferred, all queued.
- No change to the cold/warm/sympathy/self-correct logic — relief spread is **additive**, a new
  branch at the head of the existing gossip cascade.

## Constraints

- Pure detector in `world/cold.ts`, mirroring `spreadWarmWord`/`spreadColdWord` exactly (signature,
  shape, `RUMOR_MARK` discipline). No new memory primitive — reuse `remember`/`recall`/`isShareable`.
- The cycle-051 (warm word), cycle-049 (cold word), and cycle-019 (generic gossip) spreads must stay
  byte-equivalent in behavior — relief is checked first but only fires when a relief memory exists, so
  a dino with no relief memory hits the exact existing cascade.
- No save-format change (SAVE_VERSION stays 1). No new dependency. NPCBrain not in play. Deterministic
  and model-free, fully headless-testable.
