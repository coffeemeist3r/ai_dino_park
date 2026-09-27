# Cycle 170 — Verdict

**Lore track (BACKLOG-200 + BACKLOG-198): APPROVED.**
**Structure track (BACKLOG-562): APPROVED.**

Read in full: lore, structure, design, codeplan (with its shipped note), QA, and the diff
(`2721bd3^..ff4d1b7`). Build clean, 3099 unit, 838/838 e2e on a fresh full run; the one failing file
in the first run (`mobile-minds`, destroyed execution context at the tail) passed isolated and in the
fresh run. `@mlc-ai/web-llm` untouched. Save format untouched. No rework counts outstanding.

---

## Lore track — APPROVED

### The ten-minute question

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

Walk east off the Bowl. As you step into the Grove, Bramble and Pip call — a ♪ over each as it sings —
and the ticker says **🎶 The Grove calls as you arrive**. A couple of minutes later walk back: the
Bowl's five sing you in, and two of the ♪ land together while the ticker names them —
**Rex & Sunny as one** (or whichever two have kept each other company). If one of the five is still
on the outside of the graph, it sings alone after the others have stopped, and is named too:
**Twitch a beat behind**. None of that existed. The only chorus in the park fired at 07:00, and a
fresh save opens at 08:00.

That last fact is the verdict's first reason. The item as queued built on the dawn chorus, and the
dawn chorus is **twenty-three real minutes** from a fresh save — the arc would have shipped every
criterion green into a beat no sitting reaches. The Lore-smith caught it before anything was
specified and gave the chorus an occasion the keeper lives through a dozen times a session: crossing
onto a ground. It rests three real minutes per ground, so it is an event and not a doorbell, and it
is not triggered by the test jump — only by a real edge crossing, which the spec uses.

### The finding bigger than the item

The e2e failed first, and — for the second night running — the failure was the cycle's real news.
Stepped with no hook touched, the Bowl never sang a pair in 600 steps. The cause was not the chorus.
**The bond graph saturates.** Most pairs sit at 84–100 by step 40 and at the cap of 100 by step 80,
four real minutes in, including pairs on different grounds; after that, `closestFriend` answers
"who is closest" with its alphabetical tie-break, and on the measured save every Bowl dino's best
friend was Bramble or Ember *by name*.

The Coder did not paper over it with a hook. The pair is now read among the singers, closeness =
bond, then meetings — the meeting count keeps climbing after the bond stops, so the two who sing as
one are the two who have actually spent the most time together — and the source says why, and names
the real fix. That is a scoped workaround, disclosed in the codeplan and verified in QA, and the unit
suite pins it with the case that matters: at the cap, the pair is the pair that met most, not the
first two in the alphabet.

The honest limit, recorded here rather than discovered later: **the late voice lives in the first
few minutes of a fresh park.** After the graph fills, nobody is a loner — not in the chorus,
not under the 🥀. That is inside the ten-minute window (on the measured save Twitch had no bond at all until somewhere
between step 120 and step 160, six to eight real minutes)
and it is not this item's to fix; it is the same defect that makes every "closest friend" read in the
park alphabetical. Seeded **BACKLOG-567** on the Structure Track, beside 565 — the same question asked
at the bottom and the top of the bond range.

### Craft notes

- A chorus of strangers is left **exactly** as the energy roll: there is no "rest of the chorus" to be
  late to, and a founding park where every dino is technically a loner would otherwise have sung every
  voice late — i.e. the old roll, shifted by half a second, labelled as a feeling.
- The loner read stays whole-cast so the late voice is the same dino the 🥀 hangs over; the pair read
  is among the singers. The two reads differ on purpose and the doc comment says which is which.
- The ♪ and the ticker line fire muted — mute gates playback, not the beat (204's rule, again).
- `__lastChorus` kept its 192 shape so a spec from cycle 45 did not have to learn about arrivals.

---

## Structure track — APPROVED

### The ten-minute question

The same walk. The pair's second voice starts **half a pip-stride** behind the first, so their pips
alternate instead of stacking — which one `delayedCall` per call could not say, because the pip stride
lived inside `playChirp` where nothing could read it. It is `pipStrideMs` now, and the interleave is a
cue list played by the one player. On its own the item's audible change is small (the dawn chorus
gained the roster guard it never had); the design tied its reachability to the lore occasion on
purpose, and the lore criteria pin the interleave through `playCues`.

### Why it is right

Three hand-written deferrals become one: `hailAndAnswer`, `answerCry` and `checkDawnChorus` all build
a cue list and call `playCues`, which owns both guards — gone-from-the-roster via the pure `dueCue`
(so the unit and the scene cannot disagree), and muted-during-the-gap — and reads distance at fire
time. 193 and 202 are byte-identical by construction: the builders are pinned against
`answerDelayMs`/`answerParams`/`callbackDelayMs`. `grep delayedCall` confirms nothing else in the
scene schedules a chirp. The item's own seed said 200's interleave "cannot be expressed by
`delayedCall` at all"; it was right, and this is the shape that expresses it.

Not done, correctly: the three `last*` observation fields (BACKLOG-563) stay three. Folding them in
here would have been the tidy thing and a second item.

---

## Milestone 22 — SHIPPED

Six arcs in four cycles, no REWORK, no ABANDON. See the chronicle.

## Housekeeping

Closed 198, 200, 562 → archive. Two drained sections retired (`Cycle 44 lore additions`, the empty
`Cycle 167 (Structure-smith)` header). Seeded BACKLOG-567. Structure Track at **5** (552, 557, 563,
565, 567) — over X=4, drain next cycle. **Recommended next structure pick: 565 or 567, together if
the Designer can hold them** — the bond range is now the park's most load-bearing unexamined number.
Art queue at 1 (BACKLOG-566, the call note; host shipped tonight).
