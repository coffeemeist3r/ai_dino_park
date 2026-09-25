# Cycle 168 — Lore Handoff

**Theme:** The milestone's second lore arc, and the first one that does not involve the player
standing in front of a dinosaur. Arc 1 (BACKLOG-193, shipped last cycle) made the *greeting* carry a
relationship: hail a stranger and the answer comes late and flat, hail a friend and it comes fast and
eager. That is friendship you can hear — but only while you are standing there, in the world, having
just pressed a key. The book is the other place the park keeps its dinosaurs, and it is silent. You
can read Thornback's traits, its parents, its favourite food and its remembered beats, and the one
thing the bowl has had since cycle 44 — a voice built out of its own name — is the one thing the
entry does not give you. This cycle the page makes a sound.

**Added to BACKLOG:**
- BACKLOG-560 [art] The watch line's register — a watch-glass struck into the brass on `Watch · `
- BACKLOG-561 [art] The sitting line's register — an hourglass on `Sitting · `

**Cap rule:** Social/emergent queue is far above its cap of 12 (185 open non-art lore items), so **no
new social items this cycle** — the theme is drawn from what is queued, which is the point of the cap.
The **art queue was at 0** (the single `grep '[art]'` hit is BACKLOG-147, an `[infra]` item whose
description mentions art — the same off-by-one the last two housekeeping notes flagged), so two art
items are seeded. Both are hostable *tonight*: BACKLOG-558 gave the plaque one `Text` per line last
cycle and BACKLOG-539 engraved the first register on it the same night, so the cycle-145 amendment's
"no rig without a host" condition is satisfied by code that exists, not by code we hope to write.

**Suggested next-up:** **BACKLOG-195 — cry in the book.** It is milestone arc 2, unblocked, and it is
the arc that turns the voice system from a thing that happens *at* you into a thing you can go and
ask for. Two halves, both wanted: the entry plays the subject's own chirp on open, and a hatchling's
cry is **blended from its parents' parameters the way its traits already are** — which is the half
that makes it a Living-minds item rather than a button. A dino born in your park should sound like it
came from somewhere, and right now `voiceFor` derives everything from the name alone, so two siblings
sound no more alike than two strangers. That is the sameness bug the CHARTER names, sitting in the
one system the park was already proud of.

**Structural note for the Structure-smith (not seeded — your lane):** BACKLOG-559 (one bus for every
voice) is the milestone's own first structure arc and is top of your queue. If you take it, note that
195 will be the second consumer of the bus on the day it lands — a cry played from a menu has no
world position at all, which is a useful early test of whether `gainFor` can express "no distance"
without a special case.

**Idea Box:** empty (no open entries).
