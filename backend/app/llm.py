"""LLM access layer: Google Gemini (google-genai SDK) behind a small interface."""
import copy
import logging
from functools import lru_cache
from typing import Any, Protocol, TypeVar

from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel, ValidationError

from app.config import get_settings

log = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)

# HTTP status codes from the Gemini API that mean "your key/model/config is wrong" (-> 503),
# as opposed to transient/upstream failures (-> 502).
_CONFIG_STATUS = {400, 401, 403, 404}


class LLMError(RuntimeError):
    """The model call failed or returned unusable output (maps to HTTP 502)."""


class LLMConfigError(LLMError):
    """Gemini is not configured or rejected the credentials/model (maps to HTTP 503)."""


class LLMClient(Protocol):
    def structured(self, *, system: str, prompt: str, model: type[T], max_tokens: int = 4096) -> T: ...

    def chat(self, *, system: str, messages: list[dict[str, str]], max_tokens: int = 1500) -> str: ...


def inline_refs(schema: dict[str, Any]) -> dict[str, Any]:
    """Resolve local $ref/$defs so the schema is self-contained."""
    schema = copy.deepcopy(schema)
    defs = schema.pop("$defs", {})

    def walk(node: Any) -> Any:
        if isinstance(node, dict):
            if "$ref" in node:
                name = node["$ref"].split("/")[-1]
                merged = {**walk(defs[name]), **{k: walk(v) for k, v in node.items() if k != "$ref"}}
                return merged
            return {k: walk(v) for k, v in node.items() if k != "title"}
        if isinstance(node, list):
            return [walk(i) for i in node]
        return node

    return walk(schema)


def _content(role: str, text: str) -> types.Content:
    return types.Content(role="model" if role == "assistant" else "user", parts=[types.Part(text=text)])


def _finish_reason(resp: Any) -> str:
    cands = getattr(resp, "candidates", None) or []
    fr = getattr(cands[0], "finish_reason", None) if cands else None
    return getattr(fr, "name", None) or (str(fr) if fr is not None else "")


def _text(resp: Any) -> str:
    try:
        return resp.text or ""
    except Exception:  # SDK raises/returns None when there are no text parts (e.g. blocked)
        return ""


class GeminiLLM:
    def __init__(self, client: Any, model: str, max_validation_retries: int = 1):
        if not model:
            raise LLMConfigError("GEMINI_MODEL is not set")
        self._client = client
        self._model = model
        self._retries = max_validation_retries

    # -- helpers
    def _generate(self, *, contents: list[types.Content], config: types.GenerateContentConfig) -> Any:
        try:
            return self._client.models.generate_content(model=self._model, contents=contents, config=config)
        except genai_errors.APIError as e:
            code = getattr(e, "code", None)
            log.warning("Gemini APIError: %s", code)
            if code in _CONFIG_STATUS:
                raise LLMConfigError(
                    f"Gemini rejected the request ({code}); check GEMINI_API_KEY and GEMINI_MODEL"
                ) from e
            raise LLMError(f"Gemini request failed ({code})") from e
        except Exception as e:  # network errors, timeouts, etc.
            raise LLMError(f"Gemini connection error: {type(e).__name__}") from e

    # -- interface
    def structured(self, *, system: str, prompt: str, model: type[T], max_tokens: int = 4096) -> T:
        config = types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.1,
            max_output_tokens=max_tokens,
            response_mime_type="application/json",
            response_json_schema=inline_refs(model.model_json_schema()),
        )
        text_prompt = prompt
        last_err: Exception | None = None
        for attempt in range(self._retries + 1):
            resp = self._generate(contents=[_content("user", text_prompt)], config=config)
            raw = _text(resp)
            if _finish_reason(resp) == "MAX_TOKENS":
                last_err = LLMError("model output truncated")
            elif not raw.strip():
                last_err = LLMError("model did not return structured output")
            else:
                try:
                    return model.model_validate_json(raw)
                except ValidationError as e:
                    last_err = e
                    log.warning("Structured output invalid (attempt %d): %s", attempt + 1, e.error_count())
            text_prompt = (
                prompt + "\n\nYour previous answer was invalid or incomplete. "
                "Return a complete answer that matches the schema exactly."
            )
        raise LLMError(f"Model returned invalid structured output: {last_err}") from last_err

    def chat(self, *, system: str, messages: list[dict[str, str]], max_tokens: int = 1500) -> str:
        config = types.GenerateContentConfig(system_instruction=system, temperature=0.3, max_output_tokens=max_tokens)
        resp = self._generate(contents=[_content(m["role"], m["content"]) for m in messages], config=config)
        text = _text(resp)
        if not text.strip():
            raise LLMError("model returned an empty response")
        return text.strip()


@lru_cache
def get_llm() -> LLMClient:
    s = get_settings()
    if not s.gemini_api_key:
        raise LLMConfigError("GEMINI_API_KEY is not set")
    if not s.gemini_model:
        raise LLMConfigError("GEMINI_MODEL is not set")
    client = genai.Client(
        api_key=s.gemini_api_key,
        http_options=types.HttpOptions(
            timeout=s.gemini_timeout_seconds * 1000,
            retry_options=types.HttpRetryOptions(attempts=s.gemini_max_retries),
        ),
    )
    return GeminiLLM(client, s.gemini_model)
