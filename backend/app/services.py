"""Remediation, what-if simulation and chat."""
from app import pipeline, prompts, scoring
from app.llm import LLMClient
from app.schemas import (
    ChatRequest,
    RemediationPlan,
    RemediationRequest,
    SimulateRequest,
    SimulationResult,
)


def remediate(llm: LLMClient, req: RemediationRequest) -> RemediationPlan:
    gap_txt = (
        f"title: {req.gap.title}\nobligation: {req.gap.rule_text}\nseverity: {req.gap.severity.value}\n"
        f"status: {req.gap.status}\nevidence: {req.gap.evidence}\naffected_policies: {', '.join(req.gap.affected_policies) or 'n/a'}"
    )
    return llm.structured(
        system=prompts.SYSTEM_BASE,
        prompt=prompts.REMEDIATE.format(
            company=prompts.company_block(req.company, req.controls), gap=gap_txt
        ),
        model=RemediationPlan,
        max_tokens=6000,
    )


def simulate(llm: LLMClient, req: SimulateRequest) -> SimulationResult:
    """Apply a hypothetical regulation on top of the current gaps and recompute risk."""
    text = pipeline.normalize_text(req.regulation_text)
    rules = pipeline.extract_rules(llm, text, id_prefix="S")
    assessments = pipeline.assess_rules(llm, req.company, req.controls, rules)
    new_gaps = pipeline.build_gaps(rules, assessments, id_prefix="sim-")

    before = scoring.risk_score(req.baseline_gaps)
    after = scoring.risk_score([*req.baseline_gaps, *new_gaps])
    fine = pipeline.estimate_fines(llm, req.company, text, new_gaps)
    policies = sorted({p for g in new_gaps for p in g.affected_policies})
    return SimulationResult(
        scenario_name=req.scenario_name,
        new_rules=rules,
        new_gaps=new_gaps,
        scenario_compliance_score=scoring.compliance_score(rules, assessments),
        risk_before=before,
        risk_after=after,
        risk_delta=after - before,
        risk_level_after=scoring.risk_level(after),
        additional_fine=fine,
        policies_at_risk=policies,
    )


def chat(llm: LLMClient, req: ChatRequest) -> str:
    ctx = req.context
    lines = []
    if ctx.company:
        lines.append(f"Company: {ctx.company.name} ({ctx.company.sector or 'n/a'}, {ctx.company.region or 'n/a'})")
    if ctx.risk_score is not None:
        lines.append(f"Risk score: {ctx.risk_score}/100")
    if ctx.compliance_score is not None:
        lines.append(f"Compliance score: {ctx.compliance_score}%")
    for g in ctx.gaps:
        lines.append(f"Gap [{g.severity.value}/{g.status}]: {g.title} - {g.rule_text}")
    system = prompts.CHAT_SYSTEM
    if lines:
        system += "\n\n" + prompts.fence("analysis_context", "\n".join(lines))
    else:
        system += "\n\nNo analysis has been run yet; say so if the user asks about their status."
    return llm.chat(
        system=system,
        messages=[{"role": m.role, "content": m.content} for m in req.messages],
    )
