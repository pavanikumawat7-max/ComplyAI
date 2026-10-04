import pytest
from google.genai import errors as genai_errors

from app.llm import GeminiLLM, LLMConfigError, LLMError, inline_refs
from app.schemas import AssessmentBatch, RulesExtraction


class _Resp:
    def __init__(self, text, finish="STOP"):
        self.text = text
        self.candidates = [type("C", (), {"finish_reason": type("F", (), {"name": finish})()})()]


class _Models:
    def __init__(self, responses):
        self.responses = list(responses)
        self.requests = []

    def generate_content(self, **kw):
        self.requests.append(kw)
        r = self.responses.pop(0)
        if isinstance(r, Exception):
            raise r
        return r


class StubClient:
    """Stands in for genai.Client at the transport boundary only (offline unit tests)."""

    def __init__(self, responses):
        self.models = _Models(responses)

    @property
    def requests(self):
        return self.models.requests


VALID = '{"rules": [{"text": "t", "category": "c", "severity": "high"}]}'
EMPTY = '{"rules": []}'
USER = [{"role": "user", "content": "x"}]


def test_structured_parses_json_and_sends_schema():
    c = StubClient([_Resp(VALID)])
    out = GeminiLLM(c, "model-x").structured(system="s", prompt="p", model=RulesExtraction)
    assert out.rules[0].severity.value == "high"
    req = c.requests[0]
    assert req["model"] == "model-x"
    cfg = req["config"]
    assert cfg.system_instruction == "s" and cfg.response_mime_type == "application/json"
    assert "$defs" not in str(cfg.response_json_schema) and "$ref" not in str(cfg.response_json_schema)


def test_structured_retries_once_on_invalid_output():
    c = StubClient([_Resp(EMPTY), _Resp(VALID)])
    out = GeminiLLM(c, "m").structured(system="s", prompt="p", model=RulesExtraction)
    assert len(out.rules) == 1 and len(c.requests) == 2
    assert "previous answer was invalid" in c.requests[1]["contents"][0].parts[0].text


def test_structured_gives_up_after_retries():
    c = StubClient([_Resp(EMPTY)] * 2)
    with pytest.raises(LLMError):
        GeminiLLM(c, "m").structured(system="s", prompt="p", model=RulesExtraction)


def test_malformed_json_is_error():
    c = StubClient([_Resp("not json")] * 2)
    with pytest.raises(LLMError):
        GeminiLLM(c, "m").structured(system="s", prompt="p", model=RulesExtraction)


def test_truncated_output_is_error():
    c = StubClient([_Resp(VALID, finish="MAX_TOKENS")] * 2)
    with pytest.raises(LLMError):
        GeminiLLM(c, "m").structured(system="s", prompt="p", model=RulesExtraction)


def test_empty_text_is_error():
    c = StubClient([_Resp(None)] * 2)
    with pytest.raises(LLMError):
        GeminiLLM(c, "m").structured(system="s", prompt="p", model=RulesExtraction)


def test_error_mapping():
    denied = genai_errors.ClientError(403, {"error": {"message": "denied", "status": "PERMISSION_DENIED"}})
    bad_key = genai_errors.ClientError(400, {"error": {"message": "API key not valid", "status": "INVALID_ARGUMENT"}})
    throttled = genai_errors.ClientError(429, {"error": {"message": "slow down", "status": "RESOURCE_EXHAUSTED"}})
    server = genai_errors.ServerError(503, {"error": {"message": "unavailable", "status": "UNAVAILABLE"}})
    for e in (denied, bad_key):
        with pytest.raises(LLMConfigError):
            GeminiLLM(StubClient([e]), "m").chat(system="s", messages=USER)
    for e in (throttled, server, ConnectionError("boom")):
        with pytest.raises(LLMError) as ei:
            GeminiLLM(StubClient([e]), "m").chat(system="s", messages=USER)
        assert not isinstance(ei.value, LLMConfigError)


def test_missing_model():
    with pytest.raises(LLMConfigError):
        GeminiLLM(StubClient([]), "")


def test_chat_returns_text_and_maps_roles():
    c = StubClient([_Resp(" hello ")])
    msgs = [{"role": "user", "content": "a"}, {"role": "assistant", "content": "b"}, {"role": "user", "content": "c"}]
    assert GeminiLLM(c, "m").chat(system="sys", messages=msgs) == "hello"
    req = c.requests[0]
    assert [x.role for x in req["contents"]] == ["user", "model", "user"]
    assert req["config"].system_instruction == "sys"


def test_chat_empty_is_error():
    with pytest.raises(LLMError):
        GeminiLLM(StubClient([_Resp("  ")]), "m").chat(system="s", messages=USER)


def test_get_llm_requires_key(monkeypatch):
    from app import llm
    from app.config import Settings

    llm.get_llm.cache_clear()
    monkeypatch.setattr(llm, "get_settings", lambda: Settings(gemini_api_key="", _env_file=None))
    with pytest.raises(LLMConfigError):
        llm.get_llm()
    llm.get_llm.cache_clear()


def test_get_llm_builds_real_client(monkeypatch):
    from app import llm
    from app.config import Settings

    llm.get_llm.cache_clear()
    monkeypatch.setattr(llm, "get_settings", lambda: Settings(gemini_api_key="k", gemini_model="gemini-3.8-flash", _env_file=None))
    g = llm.get_llm()
    assert isinstance(g, GeminiLLM) and g._model == "gemini-3.8-flash"
    llm.get_llm.cache_clear()


def test_inline_refs_resolves_nested_models():
    s = inline_refs(AssessmentBatch.model_json_schema())
    assert "$ref" not in str(s) and s["properties"]["assessments"]["items"]["properties"]["status"]
