# Cycle 35 — Design

## Item
**BACKLOG-142 [social] Player dialogue tones** — the first branching, consequential moment
in player↔dino dialogue. (Idea Box: "player dialogue choices", foundation beat.)

## Why this cycle
For 34 cycles the player's only social verbs were "say hello" (E) and "drop food" (H), and
greeting was strictly one-way: press E, get a reply. This cycle makes the *how* of greeting a
choice with a lasting mark. It scores high on both CHARTER first-class goals at once — it's
**fun** (a genuinely new interaction, the first two-way beat), and it sharpens **distinctness**
(every dino weighs the same tone differently by personality, and each carries its own
remembered trace of how you've treated it). It's the spine of the whole dialogue-choices arc
(BACKLOG-148 LLM-coloured reply, -149 tone reputation build straight on it), and it's small
enough to ship deterministically: the affinity delta, the memory trace, and the recalled
last-tone are all pure logic QA can test with no model — the LLM reply rides along unchanged
and degrades gracefully.

## What ships
- Walk within ~2 tiles of a dino and press **E** (or its alias **Z**). Instead of an immediate
  reply, a **tone menu** opens in the dialog box:
  > `Greet Mossback — [1] Warm  [2] Tease  [3] Honest`
  and, if you've greeted this dino before, a remembered-trace line:
  > `Last time you were warm with them.`
- Press **1**, **2**, or **3** to choose a tone. The menu closes and:
  - The dino's friendship changes by a **personality-fit delta**: a tone the dino enjoys raises
    affinity more (and a clashing tone *lowers* it slightly) — e.g. a warm, social dino loves
    **Warm**; a bold, prickly dino enjoys **Tease**; a curious dino appreciates **Honest**. Same
    tone, different dino, different result.
  - A memory is filed for that dino: `the keeper greeted me warmly` / `… teased me` /
    `… spoke to me honestly`.
  - The chosen tone is saved as that dino's **last tone**, persisted in the save, and surfaced
    in the menu header next time (the visible "remembered trace").
  - The dino's reply is then shown exactly as today (canned fallback in headless / WebLLM when
    available). The reply text itself is *not* yet tone-coloured — that's BACKLOG-148.
- Pressing **E/Z** while the menu is open cancels (closes the box) without changing anything;
  pressing E/Z after the reply closes the box as today.

## Acceptance criteria
- [ ] Pressing E (or Z) within 2 tiles of a dino opens a tone menu listing three labelled
      options (Warm / Tease / Honest) — not an immediate reply.
- [ ] Pressing 1 / 2 / 3 while the menu is open selects that tone, closes the menu, and then
      shows the dino's reply line.
- [ ] `toneReaction` is personality-fit and tested for at least two dinos with opposite traits:
      a warm/social dino's verdict for **Warm** is positive-delta ("loved"/"liked"), while a
      bold/prickly dino's verdict for **Tease** is positive-delta — and a clearly mismatched
      tone yields a negative delta ("clashed").
- [ ] Selecting a tone changes that dino's friendship points by the tone's delta (sign matches
      the verdict), observable via the friendship/`__friendship` hook.
- [ ] Selecting a tone files a `the keeper …` memory entry for that dino (observable via the
      memory hook / `recall`).
- [ ] The chosen tone is persisted as that dino's last tone and round-trips through
      serialize→deserialize; a save written without the field (older save) still loads, with
      last-tone defaulting to empty.
- [ ] On the next interaction with a dino you've already greeted, the menu header shows the
      remembered last tone ("Last time you were … with them").
- [ ] The BACKLOG-125 repair path is intact: choosing any tone toward a pending-repair
      runner-up still applies the outsized repair bump and the 😊 line and clears the pending
      state (the tone delta does not replace the repair bump), verified by the existing repair
      e2e still passing.
- [ ] `npm --prefix game run build` clean; unit + e2e green; `@mlc-ai/web-llm` is not imported
      outside `game/src/ai/` (tones logic imports only `personality`).

## Out of scope
- Tone-coloured *reply text* (the dino ribbing back / being fonder) — BACKLOG-148.
- Tone reputation / "trusts/wary/playful" read in the collection book — BACKLOG-149.
- Tone affecting NPC↔NPC dialogue, gossip, or actions.
- Any change to the `__greet(name)` dev hook or the NPCContext/NPCBrain interface (the reply
  path is untouched this cycle; threading tone into the prompt is 148's job).
- A redesigned choice-menu widget — reuse the existing `DialogBox` text; no new UI component.

## Constraints
- **Additive save only** — add an optional `lastTone` map; do **not** bump `SAVE_VERSION`;
  older saves without the field must still deserialize (default `{}`).
- Don't break the E/Z "close dialog" behaviour, the gift selector (`[`/`]`, F/G), lenses (V),
  scale (T), feed (H), export (O), or hearts (C). Bind only the currently-free 1/2/3 keys.
- Keep the BACKLOG-120/125 jealousy+repair seam working — the new flow consumes `pendingRepair`
  exactly as `recordGreet` does today.
- All tone scoring lives in a pure, Node-testable module (mirror `social/gifts.ts`); Phaser
  glue stays thin in `WorldScene`.
- Don't regress the reply-source specs (cycle-007, cycle-012): they allow a `null` source, so
  a menu that defers the reply until a tone is picked is fine.
