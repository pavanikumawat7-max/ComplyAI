# ComplyAI Backend

FastAPI service that analyses regulation text against a company's stated controls using a
LangGraph workflow and an LLM on **Google Gemini** (`google-genai` SDK).

## Architecture

```
POST /api/analyze ─► LangGraph: ingest ─► interpret ─► map ─► score ─► report
                      (sanitise)  (LLM: rules) (LLM: per-rule  (deterministic) (LLM: narrative
                                               assessment)                     + fine ranges)
POST /api/remediation   LLM: policy draft, checklist, action steps for one gap
POST /api/simulate      same interpret+map steps on a hypothetical regulation, layered on baseline gaps
POST /api/chat          LLM answer grounded in the analysis context sent by the client
GET  /health            config status (does not call Gemini)
```

- `app/llm.py` – Gemini client. Structured output uses JSON-schema constrained responses (`response_json_schema`) + Pydantic validation, one retry on invalid output.
- `app/pipeline.py` – rule extraction, per-rule assessment (exactly one verdict per rule; skipped rules count as gaps; model-invented rule IDs are dropped), gap building, fine estimation.
- `app/scoring.py` – deterministic scores. Risk = `100·(1 − Π(1 − w_sev · f_status))`, weights critical .40 / high .25 / medium .12 / low .05; partial/unknown count half. Levels: <25 LOW, <50 MEDIUM, <75 HIGH, else CRITICAL.
- `app/workflow.py` – the LangGraph graph. `app/services.py` – remediation, simulation, chat.

The service is **stateless**: nothing is stored. The client sends company, controls and (for
simulate/chat) the previous analysis' gaps.

## Setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env     # then edit
uvicorn app.main:app --reload --port 8000
```

### Environment variables

| Var | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | yes | API key from https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | no (`gemini-3.8-flash`) | Gemini model name; must support JSON-schema structured output |
| `CORS_ORIGINS` | no (`http://localhost:3001`) | Comma-separated explicit origins; `*` is rejected |
| `GEMINI_TIMEOUT_SECONDS`, `GEMINI_MAX_RETRIES`, `LOG_LEVEL` | no | Tuning |

`GET /health` returns `{status, llm_configured, model, provider}`.

## API

All bodies are JSON; invalid input → `422`, missing/rejected Gemini key or model → `503`, model/upstream failure → `502`.

`POST /api/analyze`
```json
{"company": {"name": "Acme", "sector": "Fintech", "region": "India"},
 "controls": ["We publish interest rates in loan agreements"],
 "regulation_text": "…(20–20,000 chars)…"}
```
→ `rules`, `assessments`, `gaps`, `risk`, `risk_score`, `compliance_score`, `report`, `fine` (INR range, indicative).

`POST /api/remediation` – `{company, controls, gap}` (a gap object from analyze) → `{policy_title, policy_text, checklist[], actions[]}`.

`POST /api/simulate` – `{company, controls, scenario_name, regulation_text, baseline_gaps[]}` → new gaps, `risk_before/after/delta`, `additional_fine`, `policies_at_risk`, `scenario_compliance_score`.

`POST /api/chat` – `{messages:[{role,content}], context:{company,gaps,risk_score,compliance_score}}` → `{reply}`.

## Tests

```bash
pytest
```
Uses a scripted fake LLM for pipeline tests and a stubbed `genai` transport for the client unit tests – no API key needed. Covers scoring, the
workflow (including a regression test for the original keyword-mapper bug), simulation, Gemini
error mapping/retry, API validation, error handlers and CORS.

## Limitations

- Output quality depends on the model; fine amounts are model estimates, not legal advice.
- No persistence, auth or rate limiting – put it behind an API gateway/auth before public exposure.
- No live regulatory feed monitoring: regulation text must be supplied by the caller.
