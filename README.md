# Think First — AI Tutor

An AI tutor for Grade 8–12 students that **never just gives the answer**. It explains one concept at a time, requires the student to explain it back in their own words, and only unlocks the next step when they demonstrate understanding.

Built with Next.js (App Router) + TypeScript + Tailwind, powered by IBM Consulting Advantage (ICA) API.

---

## Setup

**1. Clone and install**
```bash
cd iot
npm install
```

**2. Create `.env.local`**
```bash
cp .env.example .env.local
```
Edit `.env.local` and fill in:
```
ICA_API_KEY=your_ica_developer_api_key_here
ICA_MODEL=gpt-5.1
ICA_COLLECTION_ID=          # optional — leave blank for now
```
Get your API key from: ICA UI → Settings → API Keys → ICA APIs.
The key is only ever read server-side. **Never commit it.**

**3. Run the ICA health check**
```bash
npm run ica-check
```
This prints available model IDs, tests a chat call, and checks JSON compliance.

**4. Start the dev server**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

Teacher dashboard: [http://localhost:3000/teacher](http://localhost:3000/teacher)

---

## What works today

| Feature | Status |
|---|---|
| Full lesson flow (probe → explain → teach-back → validate → next step) | ✅ Works |
| Teach-back modal — submit blocked under 15 words | ✅ Works |
| Copied-text detection (4-gram overlap > 0.5) | ✅ Works |
| Answer leak guard — retries if AI reveals x=2/x=3 | ✅ Works |
| "Just give me the answer" → friendly redirect (no model call) | ✅ Works |
| Hint ladder — 3 levels | ✅ Works |
| Step progress bar (✅🟡❌) | ✅ Works |
| Token meter — running total from API usage | ✅ Works |
| Sources chip — shown when ICA returns sources | ✅ Works |
| `/api/health` — returns model list | ✅ Works |
| Teacher dashboard | ✅ Works (MOCK DATA) |

## Concept / mocked

| Feature | Notes |
|---|---|
| Teacher dashboard data | Hard-coded mock numbers — no DB |
| Progress persistence | Browser state only; refreshing resets the session |
| School SSO / login | Not implemented |
| Document collection grounding | `ICA_COLLECTION_ID` stub present; upload script in `scripts/ica-upload.ts` |
| Assistance levels (Guided / Balanced / Independent) | Spec written, not wired into UI |
| Scenario 5, 6, 7 (partial/wrong/2-fail) | Tested via real model calls in `scripts/check-validator.ts` |

## Known limitations

- The unlock decision (`unlocked: true`) is returned by the server but trusted by the client. In a real deployment, step state should be stored server-side.
- `ICA_MODEL` is read at startup. If the model is unavailable, the server returns a clear error.
- The teacher dashboard shows class-level aggregates only; no individual student text is ever stored.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run ica-check` | Health check — lists models, tests chat, tests JSON compliance |
| `npx tsx scripts/check-scenarios.ts` | Runs SPEC §11 scenarios 1–4, 8, 9 |
| `npx tsx scripts/check-validator.ts` | Shows real model output for correct/partial teach-back on step 3 |
| `npx tsx scripts/validate-lesson.ts` | Validates `lessons/quadratics.json` against TypeScript types |

---

## File structure

```
app/                        # Next.js App Router pages
  page.tsx                  # Lesson screen
  teacher/page.tsx          # MOCK teacher dashboard
  api/
    health/route.ts         # GET /api/health
    tutor/route.ts          # POST /api/tutor
    validate/route.ts       # POST /api/validate
components/
  TutorPanel.tsx            # Conversation UI
  TeachBackModal.tsx        # Teach-back popup
  StepProgress.tsx          # Step progress pills
  TokenMeter.tsx            # Token budget bar
  SourcesChip.tsx           # Source attribution chips
lib/
  ica.ts                    # ICA API client
  types.ts                  # TypeScript types
  lesson.ts                 # Lesson loader + validator
  prompts.ts                # System prompts + context builder
  guards.ts                 # wordCount, overlapRatio, leaksAnswer, parseJsonStrict
lessons/
  quadratics.json           # Grade 9 quadratics lesson (4 steps)
data/
  mockTeacher.ts            # MOCK teacher dashboard data
scripts/
  ica-check.ts              # ICA health check
  check-scenarios.ts        # SPEC §11 scenario tests
  check-validator.ts        # Validator model output test
  validate-lesson.ts        # Lesson JSON validation
  ica-upload.ts             # (stub) Document collection upload
```

---

## API key security

- `ICA_API_KEY` lives only in `.env.local` (server-side)
- `.env*` is in `.gitignore` (except `.env.example`)
- The browser never calls ICA directly — all calls go through Next.js API routes
- The key is never logged
