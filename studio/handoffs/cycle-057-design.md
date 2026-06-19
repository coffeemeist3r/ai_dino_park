# Cycle 57 — Design

## Item
BACKLOG-253 [emergent] Grudging thanks — a prickly (low-agreeableness) dino gives a gruff version
of the cleared-name thanks; temperament colours even gratitude.

## Why this cycle
Cycle 55 gave a just-cleared dino a spoken thanks the keeper hears ("Twitch told everyone I was
alright — I owe them one."), and cycle 56 made it fade. The line is now stable but **identical for
every dino** — warm Twitch and prickly Rex thank in the exact same words. That flattens the
CHARTER's first-class goal: each dino a *distinct mind*. This cycle reads the `agreeableness` axis
(already seeded on every dino, `0 prickly .. 1 warm`) so the thanks comes out in the dino's own
register — a grudging mutter from a prickly one, the plain warm thanks from the rest. It's the
smallest possible change that makes gratitude *sound like who's saying it*, and it heads the
261–265 split the Lore-smith just seeded.

## What ships
When the keeper greets (E) a dino whose name was just cleared, the dino thanks its clearer — and
**the wording now reads its temperament**:
- A **prickly** dino (agreeableness < 0.4 — Rex, Mossback, Glade in the founding cast) gives a gruff
  version: `"…yeah. thanks, I guess. Rex set the record straight."`
- A **warm or even-tempered** dino (agreeableness ≥ 0.4 — Sunny, Twitch) gives the existing line:
  `"Twitch told everyone I was alright — I owe them one."`

The split is audible to the keeper in the dialog box on the very next greet after a clearing. The
LLM-coloured path (when a model is loaded) is likewise told the dino is grudging, so the model's
thanks reads prickly too — same fact, same boundary as 247. The grateful **bond** and memory are
untouched: only the spoken words change (262 will pin that explicitly; this cycle must not regress
it).

## Acceptance criteria
- [ ] `thanksLine(clearer, traits)` returns the gruff variant when `traits.agreeableness < 0.4`
- [ ] `thanksLine(clearer, traits)` returns the existing warm line when `traits.agreeableness >= 0.4`
- [ ] `thanksLine(clearer)` with no traits returns the existing warm line (back-compat default)
- [ ] The gruff variant names the clearer (the clearer's name appears in the returned string)
- [ ] `cannedReply` with `gratitude` set + prickly `traits` yields the gruff thanks; with warm `traits` yields the warm thanks
- [ ] In-game: greeting a freshly-cleared **Rex** (prickly) shows the gruff thanks in the dialog box
- [ ] In-game: greeting a freshly-cleared **Twitch** (warm) shows the unchanged warm thanks
- [ ] A non-grateful greet (no clearing) is byte-unchanged for both a prickly and a warm dino — the gruff branch only ever fires under `gratitude`
- [ ] Build clean; full unit + e2e suite green; web-llm import boundary still only under `game/src/ai/`

## Out of scope
- The effusive over-thank for warm dinos (261) — this cycle keeps the warm line exactly as cycle 55
  shipped it; only the prickly branch is new.
- Any change to the grateful bond bump, the grateful memory, or the freshness window (262/251).
- The book manner line (264) and the scan manner line (265).
- The dino-to-dino "thanks to their face" beat (252) — this is the keeper-facing greet line only.

## Constraints
- **NPCBrain boundary:** the spoken text stays in `game/src/ai/`; no `ai → world` import. The gruff
  line lives beside `thanksLine` in `brain.ts`; the LLM clause stays in `webllmBrain.ts`.
- **Deterministic threshold:** reuse the existing `< 0.4` prickly cutoff that `describePersonality`
  already uses (`personality.ts` AXES `low`), so "prickly" means the same thing everywhere.
- **Back-compat:** `thanksLine` must keep working with no traits arg (default = warm line), so any
  existing caller/test is unaffected.
- Must not touch the cycle-55/56 freshness or bond behavior; the cycle-055 thanks-voice e2e and the
  cycle-056 gratitude-fades e2e are the regression guard and must stay green.
