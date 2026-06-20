# Cycle 61 — Design (two tracks)

## Lore track — BACKLOG-276: The keeper has a name

**Item:** BACKLOG-276 [social] — a fond (≥8-heart) dino drops the chosen observer's designation into its hello.

**Why this cycle:** Cycle 59/60 built the greeting ladder's two poles — wistful at ≤1 heart (271), fond
at ≥8 (272) — but the fond line still names only the *dino itself* ("…Rex's been hoping you'd come
round"). The most distinct thing a close friend can do is know *who you are*. This rung turns the fond
hello outward: a dear dino greets you by your observer designation ("There you are, AETHER-1!"), so deep
friendship is the thing that earns your name in its mouth. Pure register + thin glue, no save/world
change — keeps the lore track clean beside the structure track.

**What ships:** When a dino at ≥8 hearts is greeted, its opening line names the current observer by
**designation** — the unit code before the nickname (`AETHER-1` / `VANTA-9` / `LUMEN-3`), not the full
`name` string with its quoted nickname. Both the canned fond line and the LLM-coloured fond prompt use
it. Below 8 hearts: unchanged. With no keeper name supplied (tests / legacy call paths): the fond line
falls back to today's friend-named line, byte-for-byte.

**Acceptance criteria:**
- [ ] A new `designationOf(keeper)` returns the unit code without the nickname: `'AETHER-1 "Aki"'`→`'AETHER-1'`, `'VANTA-9 "Vix"'`→`'VANTA-9'`, `'LUMEN-3 "Lux"'`→`'LUMEN-3'`.
- [ ] `fondGreeting(dinoName, keeperName)` returns a line that contains `keeperName` when it is given.
- [ ] `fondGreeting(dinoName)` (no keeperName) returns the existing friend-named line byte-for-byte (back-compat).
- [ ] `cannedReply` for a dino with `affection >= 8` and `ctx.keeperName='AETHER-1'` returns text containing `"AETHER-1"`.
- [ ] Ordering is unchanged: gratitude → wistful (≤1) → fond (≥8) → generic; a 4-heart dino is unaffected, a 0-heart still wistful, a just-cleared dino still leads with thanks.
- [ ] `buildMessages` fond clause, when `ctx.keeperName` is set, instructs the model to greet the visitor by that designation; the prompt is byte-identical when `keeperName` is unset.
- [ ] E2E: a dino driven to ≥8 hearts, greeted while the keeper is AETHER-1, yields a reply (via `__greetPrompt` and/or the real greet path) naming `"AETHER-1"`.
- [ ] No save-format change on this track; the wistful (≤1) and gratitude greetings are untouched.

**Out of scope:** nickname escalation at near-max bond (278), hour-aware named hello (279), keeper-swap
hesitation (280), naming a present dino-friend (281), the first-words ladder in the book (282). Only the
fond ≥8 line gains the designation this cycle.

**Constraints:** `keeperName` is a new **optional** `NPCContext` field — ctx-only, additive, no save.
The three greet-context build sites pass it: `dino.greet` (default ctx), `WorldScene.pickTone` (the real
greet), and the `__greetPrompt` dev hook. NPCBrain boundary intact — `ai/` must not import `keeper/`; the
*scene* computes the designation string (`designationOf(keeperById(this.keeperId))`) and passes it in.
Shares no files with the structure track.

---

## Structure track — BACKLOG-040: Save format versioning + migration hook

**Item:** BACKLOG-040 [infra] — `save.version` field + migration hook.

**Why this cycle:** The save is nominally `version: 1` but a dozen fields now hang off it additively, and
`deserialize` gates on an *exact* version match (`o.version !== SAVE_VERSION → null`) — meaning a future
`version: 2` save would be **discarded**, not upgraded. The verdict has flagged this two cycles running,
and every other open structure item (146 resource tally, 145 crop state, 274 home-zone) will add more
state. Put the version + migration hook in **now**, so those land on a save that can evolve safely.

**What ships:** `saveGame.ts` gains a real migration path:
- `SAVE_VERSION` bumps to **2**; `serialize` writes `"version":2`.
- A pure `migrate(raw)` lifts an older-version parsed object up to the current shape via a small registry
  of step migrations keyed by source version. The single registered step **1→2** is a no-op upgrade that
  stamps `version: 2` (every field added since v1 was additive-optional, so a v1 payload is already
  shape-compatible — the migration documents that and is the worked example proving the chain runs).
- `deserialize` routes a *known older* version through `migrate` before the existing field validation; an
  unknown/newer version, or a missing/non-numeric version, still returns `null`.
- Existing on-disk v1 saves load cleanly (upgraded to v2 in memory, all additive defaults applied as
  today). Old saves are NOT broken — migration is exactly the mechanism that honors the additive rule.

**Acceptance criteria:**
- [ ] `SAVE_VERSION === 2`; `serialize(validData)` produces JSON whose parsed `version` is `2`.
- [ ] A valid `version:1` JSON deserializes successfully (migration ran) and the returned object has `version: 2`.
- [ ] A valid `version:2` JSON round-trips through `serialize`→`deserialize` with all fields intact.
- [ ] A `version:99` (unknown/newer) JSON returns `null`.
- [ ] A missing-version or non-numeric-version JSON returns `null`.
- [ ] `migrate` does not mutate its input (pure) and, applied to a v1 object, returns a v2-shaped object.
- [ ] A v1 save carrying only a *subset* of additive fields (e.g. no `roles`, no `keeperId`) still loads (defaults applied) and returns `version: 2` — old saves keep loading.
- [ ] Build green; full unit + e2e green; any existing saveGame test that asserted the literal version is updated to v2 / the migration semantics.

**Out of scope:** any actual field restructure (nothing needs restructuring yet — the *hook* is the
deliverable); a v2→v3 step; touching IndexedDB I/O in `saveStore.ts`; touching the in-memory `SaveData`
shape beyond `SAVE_VERSION`.

**Constraints:** `saveGame.ts` only; pure TS, no Phaser, Node-testable. Old saves MUST still load. Tests
that construct saves via the `SAVE_VERSION` constant keep passing unchanged; tests using a literal
`version: 1` input now exercise the migration. No file overlap with the lore track.

**Cross-track collision:** none. Lore touches `ai/brain.ts`, `ai/webllmBrain.ts`, `keeper/keepers.ts`,
`entities/dino.ts`, `scenes/WorldScene.ts` (greet glue). Structure touches `world/saveGame.ts` only.
