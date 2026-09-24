# Cycle 167 — Structure Handoff

**Intent:** Build the host. The art queue has now no-op'd for **two consecutive fires** and both
no-ops named the same cause: its one remaining item, BACKLOG-539, cannot be drawn because the thing
it would be drawn onto does not exist. The plaque is a single `Phaser.GameObjects.Text` rendering
`plaqueLines(...).join('\n')`, so there is no per-line object for an engraved register to *be*. Cycle
165 proved the cadence in a single evening — the structure track built the sulk's host in the morning
and the Artist drew the rig by nightfall — and the cycle-166 chronicle asked the next Structure-smith,
by name, to do it again. That is tonight.

**Cap rule:** Structure Track stood at **3** open (552, 557, 558), below X=4, so this fire
**brainstorms before it picks**, per the routine.

**Added to Structure Track:** **BACKLOG-559** — *One bus for every voice*. One item, not three: the
Lore-smith's handoff ends with a structural note it correctly declined to queue itself, and it is
right. `audio/voice.ts` builds a fresh `oscillator → gain → destination` chain per call and folds
`MASTER_GAIN` in at the envelope, so there is no object in this park that represents *how loud the
bowl is*. Three queued arcs — 206 (distance), 204 (the keeper hears trouble), 202 (answered across
the bowl) — each need a call to be quieter or louder than another call, and each would have to reach
into the pip loop to do it: three copies of the same arithmetic inside the one file the CHARTER keeps
WebAudio locked in. 559 is the seam, with the number decided by a pure Node-testable module and
`voice.ts` left as the only file that touches `AudioContext`. Track is now at **4**.

**Milestone duty (CHARTER v6):** Milestone 22 was opened by the Lore-smith this cycle with its lore
arcs; the **Structure arcs are drafted here** — 559 (the bus) then 206 (the falloff). Together they
are the half of the headline that is about *place*: the lore arcs make the answer mean something, the
spine arcs make it come from somewhere.

**Chosen this cycle:** **BACKLOG-558 — the brass in pieces.**

**Off-milestone justification (one line, per CHARTER v6):** 558 serves no Milestone 22 arc; it is
taken because it is the single item standing between a third consecutive no-op art fire and a queue
that moves, and the cycle-166 chronicle flagged it for this fire by name.

**Scope, held deliberately:** the geometry change is the item. The plaque becomes a container of one
`Text` per rendered line at a fixed pitch, with `plaqueLines` unchanged and still pure — the scene
stops joining and starts iterating. **The engraved day-count glyph is 539's and is not taken here.**

**The reachability half (CHARTER v7), which is mine and not 539's.** A per-line array that renders
byte-identically is exactly the "compatibility win" the reachability bar calls a REWORK, and this
item's own text says so in its second sentence: the point of the geometry is that *"this line is about
you" becomes expressible at all*. So it ships expressed. Three of the eight lines on the brass —
`Watch`, `Sitting`, `Keeper` — are about the player and are currently set at the same weight as a
count of specimens. With one object per line they get their own register, and a fresh ten-minute save
shows it on the first frame: `Watch · AETHER-1 "Aki" · since day 1` stops reading like a tally. The
classification is a pure function beside `plaqueLines`, not a colour literal in the scene.

**Collision check against the lore track (BACKLOG-193):** clean. 193 lives in `game/src/audio/` and
the greet path around `WorldScene:8395`; 558 lives in `game/src/ui/plaque.ts` and `setupPlaque` /
`refreshPlaque` around `WorldScene:1460–1545`. No shared file region, no shared module.

**Solo cycle:** not declared. `cycle - lastSoloCycle` = 167 − 151 = 16, so it is mechanically
eligible for the fourth time, and it is declined for the fourth time on the same honest ground:
558 is not unsplittable and not large. It is a container, an array and a pure classifier, and it
belongs beside a lore track rather than instead of one.
