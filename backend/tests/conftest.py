from typing import Any, Callable

import pytest

from app.schemas import (
    AssessmentBatch,
    ExtractedRule,
    FineItem,
    FinesOut,
    ReportOut,
    RulesExtraction,
    RuleAssessment,
)


class FakeLLM:
    """Scripted LLM: handlers keyed by output model; records every call."""

    def __init__(self, handlers: dict[type, Callable[[str], Any]] | None = None, chat_reply: str = "ok"):
        self.handlers = handlers or {}
        self.calls: list[tuple[type, str]] = []
        self.chat_calls: list[dict] = []
        self.chat_reply = chat_reply

    def structured(self, *, system, prompt, model, max_tokens=4096):
        self.calls.append((model, prompt))
        out = self.handlers[model](prompt)
        return out if isinstance(out, model) else model.model_validate(out)

    def chat(self, *, system, messages, max_tokens=1500):
        self.chat_calls.append({"system": system, "messages": messages})
        return self.chat_reply


# The regression case for the original mapper bug: the consent rule contains the word "data".
RULES = [
    ExtractedRule(text="APR must be clearly disclosed to borrowers", category="disclosure", severity="high"),
    ExtractedRule(text="All fees and charges must be transparent", category="disclosure", severity="medium"),
    ExtractedRule(text="Data usage must be explained to users", category="privacy", severity="high"),
    ExtractedRule(text="Consent must be obtained before data collection", category="consent", severity="critical"),
]


def make_llm(statuses: dict[str, str] | None = None) -> FakeLLM:
    statuses = statuses or {"R1": "compliant", "R2": "gap", "R3": "partial", "R4": "gap"}

    def assess(prompt):
        import re

        ids = re.findall(r"^([A-Z]\d+) \[", prompt.split("<rules>")[1], flags=re.M)
        by_pos = list(statuses.values())
        keys = list(statuses.keys())
        out = []
        for i, rid in enumerate(ids):
            # statuses keyed R1.. are applied by position so simulator ids (S1..) work too;
            # keys not of the form R<n> are passed through verbatim (to test bogus ids).
            st = by_pos[i] if i < len(by_pos) and keys[i].startswith("R") and keys[i][1:].strip().isdigit() else None
            if st:
                out.append(RuleAssessment(rule_id=rid, status=st, evidence=f"ev-{rid}", gap_title=f"title-{rid}",
                                          affected_policies=["Privacy Policy"] if st != "compliant" else []))
        for k, st in statuses.items():
            if not (k.startswith("R") and k[1:].strip().isdigit() and k == k.strip()):
                out.append(RuleAssessment(rule_id=k, status=st, evidence="x"))
        return AssessmentBatch(assessments=out)

    def fines(prompt):
        import re

        ids = re.findall(r"^(\S+) \[", prompt.split("<gaps>")[1], flags=re.M)
        return FinesOut(fines=[FineItem(gap_id=i, min_inr=100_000, max_inr=500_000, basis="test") for i in ids])

    return FakeLLM(
        {
            RulesExtraction: lambda p: RulesExtraction(rules=RULES),
            AssessmentBatch: assess,
            FinesOut: fines,
            ReportOut: lambda p: ReportOut(
                executive_summary="summary", business_impact="impact", risk_explanation="why", priorities=["fix consent"]
            ),
        }
    )


@pytest.fixture
def fake_llm():
    return make_llm()


COMPANY = {"name": "Acme Lending", "sector": "Fintech", "region": "India", "description": ""}
CONTROLS = ["We publish interest rates in the loan agreement", "We store user data in AWS"]
