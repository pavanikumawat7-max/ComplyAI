# ComplyAI Frontend

Next.js (App Router, TypeScript) dashboard for the ComplyAI backend. Every number, finding, report,
remediation plan, simulation and chat answer shown comes from the backend API (`../backend`); nothing is mocked.

## Setup

```bash
cd frontend
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev                     # http://localhost:3001
```

The backend must be running and its `CORS_ORIGINS` must include the frontend origin (default `http://localhost:3001`).
`NEXT_PUBLIC_API_URL` is inlined at build time, so rebuild after changing it.

## Scripts
`npm run dev` · `npm run build` (includes type-check) · `npm run lint` · `npx tsc --noEmit`

## Structure
- `app/page.tsx` – state, API orchestration, shell (sidebar/topbar/toasts)
- `components/` – Dashboard (analysis form + results), Findings, Workflow, Compliance, Simulator, Chat, RemediationModal
- `lib/api.ts` – typed backend client (timeouts, abort, error mapping) · `lib/types.ts` mirrors backend schemas

## Behaviour notes
- Flow: fill company + controls + regulation text → **Run Analysis** (`/api/analyze`). Findings, Compliance, Workflow, Simulator and Chat all use that result.
- **Fix with AI** → `/api/remediation`; **Simulator** → `/api/simulate` (needs a prior analysis as baseline); **Chat** → `/api/chat` with your latest gaps as context.
- Generated policy text is rendered as plain text (no HTML injection); you can copy or download it as `.txt`.
- The backend is stateless. The browser keeps your form inputs, last analysis and last simulation in `localStorage` (not chat history). Clear site data to reset.
- The topbar pill shows live backend/Gemini status from `GET /health`.
