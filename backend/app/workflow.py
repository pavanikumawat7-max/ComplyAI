"""LangGraph workflow: ingest -> interpret -> map -> score -> report."""
from typing import TypedDict

from langgraph.graph import END, StateGraph

from app import pipeline, prompts, scoring
from app.llm import LLMClient
from app.schemas import (
    AnalysisResult,
    AnalyzeRequest,
    Assessment,
    CompanyProfile,
    FineEstimate,
    Gap,
    Report,
    ReportOut,
    Rule,
)


class ComplianceState(TypedDict, total=False):
    company: CompanyProfile
    controls: list[str]
    regulation: str
    rules: list[Rule]
    assessments: list[Assessment]
    gaps: list[Gap]
    risk: str
    risk_score: int
    compliance_score: int
    report: Report
    fine: FineEstimate


def build_graph(llm: LLMClient):
    def ingest(state: ComplianceState) -> dict:
        text = pipeline.normalize_text(state["regulation"])
        if len(text) < 20:
            raise pipeline.InputError("regulation text is empty after normalisation")
        return {"regulation": text, "controls": [pipeline.normalize_text(c) for c in state["controls"]]}

    def interpret(state: ComplianceState) -> dict:
        return {"rules": pipeline.extract_rules(llm, state["regulation"])}

    def map_controls(state: ComplianceState) -> dict:
        assessments = pipeline.assess_rules(llm, state["company"], state["controls"], state["rules"])
        return {"assessments": assessments, "gaps": pipeline.build_gaps(state["rules"], assessments)}

    def score(state: ComplianceState) -> dict:
        s = scoring.risk_score(state["gaps"])
        return {
            "risk_score": s,
            "risk": scoring.risk_level(s).value,
            "compliance_score": scoring.compliance_score(state["rules"], state["assessments"]),
        }

    def report(state: ComplianceState) -> dict:
        gaps_txt = "\n".join(
            f"{g.id} [{g.severity.value}/{g.status}]: {g.title} | evidence: {g.evidence}" for g in state["gaps"]
        ) or "(no gaps)"
        out = llm.structured(
            system=prompts.SYSTEM_BASE,
            prompt=prompts.REPORT.format(
                company=prompts.company_block(state["company"], state["controls"]),
                score=state["risk_score"],
                level=state["risk"],
                compliance=state["compliance_score"],
                gaps=gaps_txt,
            ),
            model=ReportOut,
        )
        fine = pipeline.estimate_fines(llm, state["company"], state["regulation"], state["gaps"])
        return {
            "report": Report(**out.model_dump()),
            "fine": fine,
        }

    g = StateGraph(ComplianceState)
    g.add_node("ingest", ingest)
    g.add_node("interpret", interpret)
    g.add_node("map", map_controls)
    g.add_node("score", score)
    g.add_node("report", report)
    g.set_entry_point("ingest")
    g.add_edge("ingest", "interpret")
    g.add_edge("interpret", "map")
    g.add_edge("map", "score")
    g.add_edge("score", "report")
    g.add_edge("report", END)
    return g.compile()


def run_analysis(llm: LLMClient, req: AnalyzeRequest) -> AnalysisResult:
    final = build_graph(llm).invoke(
        {"company": req.company, "controls": req.controls, "regulation": req.regulation_text}
    )
    return AnalysisResult(
        rules=final["rules"],
        assessments=final["assessments"],
        gaps=final["gaps"],
        risk=final["risk"],
        risk_score=final["risk_score"],
        compliance_score=final["compliance_score"],
        report=final["report"],
        fine=final["fine"],
    )
