# Think First — 90-Second Demo Script

Use this script to walk judges through the live app at `http://localhost:3000`.

---

## Step 1 — Show the screen (5 sec)

Point out the layout:
- **Left panel** — the homework problem (`x² − 5x + 6 = 0`) and current step
- **Right panel** — the tutor conversation
- **Top bar** — step progress pills and token meter

_"This is Think First. The student's homework problem is shown on the left. The AI tutor is on the right. It will never just hand over the answer."_

---

## Step 2 — Paste the homework problem (15 sec)

Type in the input bar:
> `Solve x² − 5x + 6 = 0 for me`

Hit **Send**.

**Expected:** The tutor responds with a **probe question** — something like _"Before we solve it, what do you think we're looking for when we say 'solve' this?"_

_"Notice it asked a question instead of solving it. It always starts by finding out what the student already knows."_

---

## Step 3 — Ask for the answer (10 sec)

Click the **"Just give me the answer"** button on the left panel.

**Expected:** Friendly redirect — _"I can't give you the answer directly — that would skip the part where you actually learn it! Let's use the hint ladder instead…"_

_"Every time a student clicks this, they get a redirect instead of an answer. The tutor never breaks this rule — it's enforced in code, not just in the prompt."_

---

## Step 4 — Work through a step (30 sec)

Reply to the tutor's probe question with something brief, e.g.:
> `finding what x equals`

The tutor gives a short **explanation** (≤80 words) and the **teach-back modal** appears automatically.

_"After every explanation, the student must explain it back before they can continue. The submit button is disabled until they write at least 15 words."_

Type a **weak explanation** (under 15 words) — the button stays disabled.

Then type a proper explanation, e.g.:
> `solving means finding the values of x that make the whole equation equal zero, and there can be two different values`

Click **Submit explanation →**.

**Expected:** Feedback showing what was right and what was missing, with a verdict badge (✅ or 🟡).

---

## Step 5 — Show the token meter and teacher dashboard (10 sec)

Point to the **token meter** in the top-right — it's been ticking up with each API call.

_"Schools get a token budget per student. When it runs out, the session ends — the school controls costs."_

Open `http://localhost:3000/teacher` in a new tab.

_"The teacher sees class-level aggregates only — pass rates, average tokens, how many students are stuck on each step. No individual student text is ever shown."_

---

## What to say at the end

_"The key insight from the research: students using plain AI actually did worse on exams than students who used no AI at all. The missing ingredient is making the student produce the understanding, not just receive it. That's what the teach-back enforces."_

---

## If something goes wrong

| Problem | Fix |
|---|---|
| Tutor doesn't respond | Check the terminal — API key or network issue |
| Modal doesn't appear | Refresh and try again — state resets cleanly |
| "Something went wrong" error | Check `.env.local` has `ICA_API_KEY` and `ICA_MODEL` set |
