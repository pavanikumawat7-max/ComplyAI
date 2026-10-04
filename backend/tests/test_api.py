import pytest
from fastapi.testclient import TestClient

from app.llm import LLMConfigError, LLMError
from app.main import _llm, app
from app.schemas import ActionStep, ChecklistItem, RemediationPlan
from tests.conftest import COMPANY, CONTROLS, make_llm

client = TestClient(app, raise_server_exceptions=False)
BODY = {"company": COMPANY, "controls": CONTROLS, "regulation_text": "RBI requires APR disclosure. " * 3}


@pytest.fixture(autouse=True)
def _override():
    app.dependency_overrides[_llm] = lambda: make_llm()
    yield
    app.dependency_overrides.clear()


def test_health():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"


def test_analyze_ok():
    r = client.post("/api/analyze", json=BODY)
    assert r.status_code == 200
    data = r.json()
    assert len(data["gaps"]) == 3 and data["risk_score"] > 0 and data["fine"]["currency"] == "INR"


@pytest.mark.parametrize("patch", [
    {"regulation_text": "short"},
    {"controls": []},
    {"controls": ["   "]},
    {"company": {"name": ""}},
    {"regulation_text": "a" * 20001},
])
def test_analyze_validation(patch):
    assert client.post("/api/analyze", json={**BODY, **patch}).status_code == 422


def test_analyze_requires_json_object():
    assert client.post("/api/analyze", content="nope").status_code == 422


def test_llm_failure_maps_to_502():
    class Boom:
        def structured(self, **k): raise LLMError("bad output")
    app.dependency_overrides[_llm] = lambda: Boom()
    r = client.post("/api/analyze", json=BODY)
    assert r.status_code == 502 and "bad output" in r.json()["detail"]


def test_unconfigured_maps_to_503():
    def raiser():
        raise LLMConfigError("GEMINI_API_KEY is not set")
    app.dependency_overrides[_llm] = raiser
    assert client.post("/api/analyze", json=BODY).status_code == 503


def test_unexpected_error_is_500_without_leak():
    class Boom:
        def structured(self, **k): raise KeyError("secret-internal")
    app.dependency_overrides[_llm] = lambda: Boom()
    r = client.post("/api/analyze", json=BODY)
    assert r.status_code == 500 and "secret-internal" not in r.text


def test_simulate_and_chat_and_remediation_routes():
    gap = {"id": "g", "rule_id": "R1", "title": "t", "rule_text": "r", "severity": "high", "status": "gap"}
    r = client.post("/api/simulate", json={**BODY, "scenario_name": "S", "baseline_gaps": [gap]})
    assert r.status_code == 200 and r.json()["risk_before"] == 25
    r = client.post("/api/chat", json={"messages": [{"role": "user", "content": "hi"}]})
    assert r.status_code == 200 and r.json()["reply"] == "ok"
    assert client.post("/api/chat", json={"messages": [{"role": "assistant", "content": "hi"}]}).status_code == 422
    llm = make_llm()
    llm.handlers[RemediationPlan] = lambda p: RemediationPlan(
        policy_title="P", policy_text="b", checklist=[ChecklistItem(text="a", timeframe="Day 1")],
        actions=[ActionStep(title="t", description="d", effort="1h")])
    app.dependency_overrides[_llm] = lambda: llm
    r = client.post("/api/remediation", json={"company": COMPANY, "controls": CONTROLS, "gap": gap})
    assert r.status_code == 200 and r.json()["policy_title"] == "P"


def test_cors_allows_configured_origin_only():
    ok = client.options("/api/analyze", headers={"Origin": "http://localhost:3001",
                                                 "Access-Control-Request-Method": "POST"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3001"
    bad = client.options("/api/analyze", headers={"Origin": "http://evil.example",
                                                  "Access-Control-Request-Method": "POST"})
    assert "access-control-allow-origin" not in bad.headers


def test_wildcard_cors_rejected():
    from app.config import Settings
    with pytest.raises(ValueError):
        Settings(cors_origins="*")


def test_health_reports_gemini(monkeypatch):
    from app import main
    from app.config import Settings

    monkeypatch.setattr(main, "get_settings", lambda: Settings(gemini_api_key="k", gemini_model="gemini-3.8-flash", _env_file=None))
    body = client.get("/health").json()
    assert body == {"status": "ok", "llm_configured": True, "model": "gemini-3.8-flash", "provider": "gemini"}
    monkeypatch.setattr(main, "get_settings", lambda: Settings(gemini_api_key="", _env_file=None))
    assert client.get("/health").json()["llm_configured"] is False
