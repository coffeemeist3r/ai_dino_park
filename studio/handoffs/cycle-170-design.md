# Cycle 170 — Design

Both tracks touch `game/src/audio/` and `WorldScene`'s voice block (~L7060–7180, `checkDawnChorus`
~L9429). **Sequence: structure first** (cue.ts + `pipStrideMs` + `playCues`, with the three existing
call sites migrated), **then lore** (chorus cue shaping + the arrival occasion), in one Coder fire.

---

## Structure track — BACKLOG-562

**Item:** BACKLOG-562 [infra] The voice has no clock.

**Why this cycle:** Three hand-written deferrals (193's answer, 202's callback, 192's dawn loop) each
re-derive "is the dino still here / is the sound still on" — and the dawn loop checks only half of it.
Tonight's lore arc needs sub-call timing (the pips of two calls interleaved), which one `delayedCall`
per call cannot express without reaching into `playChirp`'s private per-pip arithmetic.

**What ships:**
- `chirp.ts` exports `pipStrideMs(p: ChirpParams): number` = `(p.lengthMs / p.notes) * 1.15`;
  `voice.ts` `playChirp` uses it for pip starts (identical output — same number, one place).
- New pure `audio/cue.ts`:
  - `interface Cue { atMs: number; who?: string; params: ChirpParams; kind: VoiceKind }` —
    `who` absent means the keeper (no distance falloff).
  - `answerCues(who, t, hearts): Cue[]` → hail at 0, the dino's `answerParams` at `answerDelayMs(hearts)`.
  - `callbackCues(who, t, bond)` for 202 (one cue at `callbackDelayMs(bond)`, the friend's `chirpParams`).
  - Every builder returns cues ascending by `atMs`.
- `WorldScene.playCues(cues)`: the one player. Each cue fires at `atMs` (0 = this frame,
  synchronously): skip if `soundMuted()`; if `who` is set, re-resolve by name and skip if gone, and read
  distance to the keeper **at fire time**; record `lastSound`; `playChirp(params, kind, opts)`.
- `hailAndAnswer`, `answerCry` and `checkDawnChorus` all call `playCues`; no other
  `this.time.delayedCall` in the file schedules a `playChirp`.

**Acceptance criteria:**
- [ ] `pipStrideMs` exported and used by `playChirp` (no `* 1.15` pip literal left in voice.ts).
- [ ] Unit: `answerCues` for hearts ∈ {0, 5, 10} — two cues; the first is `KEEPER_HAIL` at 0 with no
  `who`; the second at exactly `answerDelayMs(h)` carrying `answerParams(t, h)`.
- [ ] Unit: `callbackCues` — one cue at `callbackDelayMs(bond)` with `chirpParams(friend)`.
- [ ] Unit: every builder's output is ascending by `atMs`.
- [ ] `grep delayedCall WorldScene.ts` — no callback outside `playCues` plays a chirp.
- [ ] Existing 193 / 202 / 192 e2e specs pass unchanged (`__lastAnswer`, `__lastCallback`,
  `__lastChorus` shape may grow but existing fields keep their meaning; `__lastSound` unchanged).
- [ ] The guard is pinned: a cue whose `who` has left the roster by fire time plays nothing
  (unit via a pure `dueCue`/resolve helper, or e2e — Code-planner's call).
- [ ] The interleave (lore track) is expressed as cues through `playCues` — pinned by the lore criteria.

**Out of scope:** unifying `lastSound`/`lastAnswer`/`lastDistress` (BACKLOG-563); moving the thunk or
the book's voice onto cues (immediate, nothing to defer).

**Constraints:** `cue.ts` pure — no Phaser, no WebAudio. 193/202 sound byte-identical (same params,
same delays).

---

## Lore track — BACKLOG-200 + BACKLOG-198

**Item:** BACKLOG-200 Harmonized pair + BACKLOG-198 Off-key loner — Milestone 22's last lore arc.

**Why this cycle:** The chorus has been a flat energy roll since cycle 45; the bond graph that decides
huddles, comfort, grief and the 🥀 has never been audible in a group. And the chorus is unreachable as
it stands: it fires at 07:00 and a fresh save opens at 08:00, twenty-three real minutes away. The arc
ships with an occasion a player walks into, or it is groundwork.

**What ships:**
1. **Chorus shaping** — pure `chorusCues(dinos, bonds)` in `audio/chorus.ts`, built on `chorusOrder`:
   - **Harmonized pair:** two singers who are each other's `closestFriend` at bond ≥ `LONER_FLOOR`
     (mutual best friends, among the whole cast). The later of the two moves to
     `leader.atMs + pipStrideMs(leader.params) / 2`, so their pips alternate. Disjoint by construction.
   - **Off-key loner:** a singer that `isLoner` (the whole-cast read the 🥀 uses) moves to after the
     chorus has finished — `max(atMs + lengthMs)` over the non-loner cues + `LATE_BEAT_MS` (~450 ms),
     several loners spaced by `LATE_BEAT_MS` in energy order. **Only when at least one non-loner
     sings** — a chorus of strangers (the founding frame) stays the plain energy roll, because there is
     no "rest of the chorus" to be late to.
   - Returns `{ cues, pairs: [string, string][], late: string[] }`.
2. **The ground calls you in** — when the keeper walks across a zone edge (`tryCrossZone`), the
   residents of the ground just entered sing `chorusCues(residents, bonds)` through `playCues`; a ♪
   pops over each dino at its cue time (muted or not — diegetic, the 204 rule); one ticker line from
   pure `chorusLine(groundName, pairs, late)`:
   `🎶 The Grove calls as you arrive — Bramble & Pip as one` / `… — Twitch a beat behind` /
   both clauses joined by `;`. Rest per ground `ARRIVAL_REST_MIN` = 180 in-game minutes (three real
   minutes at the default rate) — an event, not a doorbell. No residents → nothing. Boot/restore never
   triggers it.
3. **Dawn** keeps its chorus and plays `chorusCues(this.dinos, bonds)` (whole cast), so the morning
   carries the pair and the loner too.
4. ♪ host: `makeHourMark(CALL_ART_KEY = 'call', '♪')` — glyph until BACKLOG-566 draws it.

**Ten-minute answer (for the Validator):** boot, walk east into the Grove in the first minute — Bramble
and Pip call as you arrive, plain order (strangers). Wander a couple of minutes and walk back into the
Bowl: its five call you in, pairs have formed by then — two ♪ land together and the ticker names them,
and a dino still under the floor sings alone after the rest have stopped, and is named too.

**Acceptance criteria:**
- [ ] Unit: all-zero bonds → `chorusCues` times equal `chorusOrder` delays; `pairs` and `late` empty.
- [ ] Unit: mutual best friends ≥ floor → the later one's `atMs` = leader.atMs + pipStride/2 (±1 ms),
  and when the leader has ≥2 notes the partner's first pip starts strictly between the leader's pip 0 and pip 1.
- [ ] Unit: one-sided closeness (A's best is B, B's best is C) → A and B are not paired.
- [ ] Unit: a loner among bonded singers starts ≥ `LATE_BEAT_MS` after every non-loner cue ends; with
  no non-loner singer nobody moves.
- [ ] Unit: `chorusLine` for none / pair / late / both.
- [ ] E2E: fresh save, step the world until a Bowl pair exists (no bond hooks), cross out of and back
  into the Bowl through the real crossing path → `__lastChorus()` names the Bowl with ≥1 pair, cue
  times obey the pair rule; the ticker has a `🎶` line naming both.
- [ ] E2E: re-entering the same ground inside `ARRIVAL_REST_MIN` sings nothing new; after the clock
  passes it, it sings again.
- [ ] E2E: muted, the arrival still logs the line and shows ♪ marks; `__lastSound` records no chirp from it.
- [ ] Dawn chorus spec (192) still green.

**Out of scope:** founding bonds (BACKLOG-565); a keeper voice on arrival; the ♪ rig (BACKLOG-566,
Artist); a chorus on the boot ground.

**Constraints:** save format untouched (the rest map is transient; a reload may re-sing, harmless).
`__setZone` (the test jump) must **not** sing, so existing zone specs are undisturbed; the arrival rides
the real edge crossing (add a hook that runs the same crossing path if the spec needs one).
