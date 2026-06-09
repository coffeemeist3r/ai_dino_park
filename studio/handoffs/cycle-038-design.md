# Cycle 38 — Design

**Item** — BACKLOG-157 [emergent] More keeper abilities — **first ability: LUMEN-3's Field Scan** (one ability per cycle, per the item).

**Why this cycle**
The lore-smith's next-up, and the operator's arc: cycle 37 shipped three travelers but only one
shared mechanic (the affinity fit, graded per observer). Two of the three are still flavour text.
The lore-smith asked for an ability that *reveals* hidden state over one that nudges — and the
richest *truly hidden* state is each dino's mind: the five personality axes, its mood, its favorite
food (the book only reveals a favorite after you've fed it — BACKLOG-069's "fill in the menu" goal
is still open), none of it readable in-game. One correction to the lore handoff: **bond-graph sight
is already shipped** — the `V` lens cycles a bonds view for every keeper (`ui/lenses.ts`, cycle 21)
— so that ability would duplicate live functionality. The scan instead goes to the observer whose
whole backstory is *cataloguing living minds*: LUMEN-3 "Lux". Picking Lux now means something no
other observer gets: you can read a dino. (VANTA-9's distinct ability — e.g. the sky-nudge — stays
queued in 157 for a later cycle; the item stays open, 1 of 3 woken, mirroring how BACKLOG-034 stayed
open across art fires.)

**What ships**
- A pure, Node-testable `keeper/scan.ts`:
  - `canScan(keeper): boolean` — true only for `lumen`.
  - `scanLines(subject): string[]` — a deterministic dossier readout for one dino: name + species
    header, the five personality axes each rendered as a labeled meter (reusing `AXES` low/high
    labels, e.g. `cautious ▮▮▮▮▮▯▯▯▯▯ curious`), current mood, favorite food (emoji + label via
    `favoriteFood`), and emergent role. Pure formatting over data the sim already owns.
  - `scanRefusal(keeper): string` — a distinct in-character refusal line per non-Lux observer
    (Aki's diplomacy unit demurs; Vix's scout chassis has no such sensors).
- WorldScene glue only:
  - **B** near a dino (within the existing talk range) while playing **Lux** → a scan panel opens
    (styled like the existing hearts/lens panels) showing `scanLines` for the nearest dino. **B**
    again (or scanning with no dino in range) closes it. The panel is a HUD overlay; it does not
    pause the sim and does not touch dialog state.
  - **B** near a dino while playing **Aki or Vix** → no panel; a small floating refusal line
    (the `scanRefusal` text) appears and fades, like existing beat bubbles.
  - **B** with no dino in range → closes the panel if open, otherwise nothing.
  - The hint line gains `B scan`.
  - Dev hooks: `__scanOpen()`, `__scanLines(name?)` (lines for the named/nearest dino),
    `__canScan()`.
- No save change (the panel is transient). No new keys beyond B (verified free).

**Acceptance criteria**
- [ ] `keeper/scan.ts` is pure (no Phaser import) and unit-tested in Node.
- [ ] `canScan` returns true for the `lumen` keeper and false for `aether` and `vanta`.
- [ ] `scanLines` for a known dino (e.g. Rex) includes: the dino's name and species, all 5
      personality axes with both pole labels from `AXES`, a mood line, the favorite food's emoji +
      label (matching `favoriteFood(traits)`), and the dino's role tag.
- [ ] `scanLines` is deterministic: two calls with the same subject return identical lines.
- [ ] `scanRefusal` returns distinct, non-empty lines for `aether` and `vanta`.
- [ ] e2e: with keeper switched to Lux (`__pickKeeper('lumen')`), standing adjacent to a dino and
      pressing B opens the scan panel within 500ms, and `__scanOpen()` reports true with
      `__scanLines()` non-empty (includes the dino's name).
- [ ] e2e: pressing B again closes the panel (`__scanOpen()` false).
- [ ] e2e: with the default keeper (AETHER-1), pressing B adjacent to a dino shows the refusal
      text in-world and `__scanOpen()` stays false.
- [ ] e2e: every pre-existing spec still passes — B is additive; E/Z/K/V/C/H/T/O/F/G/[ ]/1-2-3
      behavior is byte-for-byte unchanged.
- [ ] `npm run build` clean; full vitest + playwright suites green.

**Out of scope**
- VANTA-9's and AETHER-1's distinct abilities (157 stays open; later cycles).
- Any LLM involvement — the scan is a pure readout (BACKLOG-156 personas are separate).
- Persisting scan history, scan cooldowns, or scan effects on dinos.
- Book integration ("scanned" pages) — the book's fill-in-the-menu goal (069) stays untouched.
- Avatars/visual identity (158) and the art-direction question (operator's CHARTER call).

**Constraints**
- `keeper/scan.ts` imports only types + pure helpers (`AXES`, `favoriteFood`, role type); no Phaser,
  no web-llm (boundary: web-llm only under `ai/`).
- WorldScene changes are thin glue: key handler, panel draw, refusal float, dev hooks. All judgment
  (who can scan, what the dossier says) lives in the pure module.
- Do not modify `keepers.ts` ability/appeal data — the affinity fit shipped in 37 is live and
  tested; Field Scan is a *second* ability surface, keyed off `keeper.id`.
- No save-format change. No new dependencies. Don't break the keeper picker (K + 1/2/3 routing).
- The scan panel must not intercept movement keys or dialog (E/Z) — purely additive overlay.
