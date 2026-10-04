"""FastAPI application."""
import logging

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import services
from app.config import get_settings
from app.pipeline import InputError
from app.llm import LLMClient, LLMConfigError, LLMError, get_llm
from app.schemas import (
    AnalysisResult,
    AnalyzeRequest,
    ChatRequest,
    ChatResponse,
    RemediationPlan,
    RemediationRequest,
    SimulateRequest,
    SimulationResult,
)
from app.workflow import run_analysis

settings = get_settings()
logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("comply")

app = FastAPI(title="ComplyAI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def _llm() -> LLMClient:
    return get_llm()


@app.exception_handler(LLMConfigError)
async def _config_error(_: Request, exc: LLMConfigError):
    log.error("LLM configuration error: %s", exc)
    return JSONResponse(status_code=503, content={"detail": f"AI backend not configured: {exc}"})


@app.exception_handler(LLMError)
async def _llm_error(_: Request, exc: LLMError):
    log.error("LLM error: %s", exc)
    return JSONResponse(status_code=502, content={"detail": f"AI backend error: {exc}"})


@app.exception_handler(InputError)
async def _input_error(_: Request, exc: InputError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def _unhandled(_: Request, exc: Exception):
    log.exception("Unhandled error")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
def health():
    s = get_settings()
    return {
        "status": "ok",
        "llm_configured": bool(s.gemini_api_key and s.gemini_model),
        "model": s.gemini_model or None,
        "provider": "gemini",
    }


@app.post("/api/analyze", response_model=AnalysisResult)
def analyze(req: AnalyzeRequest, llm: LLMClient = Depends(_llm)):
    return run_analysis(llm, req)


@app.post("/api/remediation", response_model=RemediationPlan)
def remediation(req: RemediationRequest, llm: LLMClient = Depends(_llm)):
    return services.remediate(llm, req)


@app.post("/api/simulate", response_model=SimulationResult)
def simulate(req: SimulateRequest, llm: LLMClient = Depends(_llm)):
    return services.simulate(llm, req)


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest, llm: LLMClient = Depends(_llm)):
    return ChatResponse(reply=services.chat(llm, req))
