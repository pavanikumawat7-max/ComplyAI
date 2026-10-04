"""Pydantic models: API contracts and LLM structured-output contracts."""
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class Severity(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class RiskLevel(str, Enum):
    low = "LOW"
    medium = "MEDIUM"
    high = "HIGH"
    critical = "CRITICAL"


# ---------------------------------------------------------------- inputs
class CompanyProfile(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    sector: str = Field(default="", max_length=80)
    region: str = Field(default="", max_length=80)
    description: str = Field(default="", max_length=1000)


class _CompanyInput(BaseModel):
    company: CompanyProfile
    controls: list[str] = Field(
        min_length=1,
        max_length=100,
        description="Statements of the company's existing policies/controls.",
    )

    @field_validator("controls")
    @classmethod
    def _clean_controls(cls, v: list[str]) -> list[str]:
        cleaned = [c.strip() for c in v if c and c.strip()]
        if not cleaned:
            raise ValueError("at least one non-empty control is required")
        if any(len(c) > 600 for c in cleaned):
            raise ValueError("each control must be at most 600 characters")
        return cleaned


class AnalyzeRequest(_CompanyInput):
    regulation_text: str = Field(min_length=20, max_length=20000)


# ------------------------------------------------------- LLM output shapes
class ExtractedRule(BaseModel):
    text: str = Field(description="One atomic, testable obligation.")
    category: str = Field(description="Short topic label, e.g. 'disclosure', 'consent'.")
    severity: Severity = Field(description="Impact if the obligation is NOT met.")


class RulesExtraction(BaseModel):
    rules: list[ExtractedRule] = Field(min_length=1, max_length=25)


class RuleAssessment(BaseModel):
    rule_id: str
    status: Literal["compliant", "partial", "gap"]
    evidence: str = Field(description="Which control supports the verdict, or why none does.")
    gap_title: str = Field(default="", description="Short title if status is partial/gap.")
    affected_policies: list[str] = Field(default_factory=list)


class AssessmentBatch(BaseModel):
    assessments: list[RuleAssessment]


class FineItem(BaseModel):
    gap_id: str
    min_inr: int = Field(ge=0)
    max_inr: int = Field(ge=0)
    basis: str


class ReportOut(BaseModel):
    executive_summary: str
    business_impact: str
    risk_explanation: str
    priorities: list[str] = Field(max_length=10)


class FinesOut(BaseModel):
    fines: list[FineItem]


# --------------------------------------------------------- domain results
class Rule(ExtractedRule):
    id: str


class Assessment(RuleAssessment):
    pass


class Gap(BaseModel):
    id: str
    rule_id: str
    title: str
    rule_text: str
    severity: Severity
    status: Literal["partial", "gap", "unknown"]
    evidence: str = ""
    affected_policies: list[str] = Field(default_factory=list)


class FineEstimate(BaseModel):
    currency: Literal["INR"] = "INR"
    min_total: int
    max_total: int
    items: list[FineItem]
    disclaimer: str = (
        "Indicative model-generated estimate, not legal advice or a prediction "
        "of regulator action."
    )


class Report(BaseModel):
    executive_summary: str
    business_impact: str
    risk_explanation: str
    priorities: list[str]


class AnalysisResult(BaseModel):
    rules: list[Rule]
    assessments: list[Assessment]
    gaps: list[Gap]
    risk: RiskLevel
    risk_score: int = Field(ge=0, le=100)
    compliance_score: int = Field(ge=0, le=100)
    report: Report
    fine: FineEstimate


# ------------------------------------------------------------ remediation
class RemediationRequest(_CompanyInput):
    gap: Gap


class ChecklistItem(BaseModel):
    text: str
    timeframe: str


class ActionStep(BaseModel):
    title: str
    description: str
    effort: str


class RemediationPlan(BaseModel):
    policy_title: str
    policy_text: str = Field(description="Plain-text/markdown policy draft.")
    checklist: list[ChecklistItem] = Field(min_length=1, max_length=15)
    actions: list[ActionStep] = Field(min_length=1, max_length=10)


# ------------------------------------------------------------- simulation
class SimulateRequest(_CompanyInput):
    scenario_name: str = Field(min_length=1, max_length=200)
    regulation_text: str = Field(min_length=20, max_length=20000)
    baseline_gaps: list[Gap] = Field(default_factory=list, max_length=100)


class SimulationResult(BaseModel):
    scenario_name: str
    new_rules: list[Rule]
    new_gaps: list[Gap]
    scenario_compliance_score: int
    risk_before: int
    risk_after: int
    risk_delta: int
    risk_level_after: RiskLevel
    additional_fine: FineEstimate
    policies_at_risk: list[str]


# ------------------------------------------------------------------- chat
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatContext(BaseModel):
    company: CompanyProfile | None = None
    gaps: list[Gap] = Field(default_factory=list, max_length=100)
    risk_score: int | None = Field(default=None, ge=0, le=100)
    compliance_score: int | None = Field(default=None, ge=0, le=100)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)
    context: ChatContext = Field(default_factory=ChatContext)

    @field_validator("messages")
    @classmethod
    def _last_is_user(cls, v: list[ChatMessage]) -> list[ChatMessage]:
        if v[-1].role != "user":
            raise ValueError("last message must be from the user")
        return v


class ChatResponse(BaseModel):
    reply: str
