"""Core compliance steps shared by the analysis workflow and the simulator."""
import re

from app import prompts
from app.llm import LLMClient
from app.schemas import (
    Assessment,
    AssessmentBatch,
    CompanyProfile,
    FineEstimate,
    FinesOut,
    FineItem,
    Gap,
    Rule,
    RulesExtraction,
)

class InputError(ValueError):
    """Invalid user input detected after normalisation (HTTP 422)."""


_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def normalize_text(text: str) -> str:
    """Strip control characters and collapse excessive blank lines."""
    text = _CONTROL_CHARS.sub("", text).replace("\r\n", "\n")
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def extract_rules(llm: LLMClient, regulation_text: str, id_prefix: str = "R") -> list[Rule]:
    out = llm.structured(
        system=prompts.SYSTEM_BASE,
        prompt=prompts.EXTRACT_RULES.format(regulation=prompts.fence("regulation", regulation_text)),
        model=RulesExtraction,
    )
    # IDs are assigned here, never trusted from the model.
    return [Rule(id=f"{id_prefix}{i}", **r.model_dump()) for i, r in enumerate(out.rules, start=1)]


def assess_rules(
    llm: LLMClient, company: CompanyProfile, controls: list[str], rules: list[Rule]
) -> list[Assessment]:
    """Judge every rule against the company's controls.

    Guarantees exactly one assessment per rule: unknown/duplicate ids returned by the model are
    dropped, and any rule the model skipped is conservatively marked as a gap.
    """
    rules_txt = "\n".join(f"{r.id} [{r.category}/{r.severity.value}]: {r.text}" for r in rules)
    batch = llm.structured(
        system=prompts.SYSTEM_BASE,
        prompt=prompts.ASSESS_RULES.format(company=prompts.company_block(company, controls), rules=rules_txt),
        model=AssessmentBatch,
    )
    valid = {r.id for r in rules}
    by_id: dict[str, Assessment] = {}
    for a in batch.assessments:
        if a.rule_id in valid and a.rule_id not in by_id:
            by_id[a.rule_id] = Assessment(**a.model_dump())
    result: list[Assessment] = []
    for r in rules:
        result.append(
            by_id.get(r.id)
            or Assessment(
                rule_id=r.id,
                status="gap",
                evidence="Not assessed by the model; treated as a gap (no evidence of compliance).",
                gap_title=r.text[:80],
            )
        )
    return result


def build_gaps(rules: list[Rule], assessments: list[Assessment], id_prefix: str = "gap-") -> list[Gap]:
    by_rule = {r.id: r for r in rules}
    gaps = []
    for a in assessments:
        if a.status == "compliant":
            continue
        r = by_rule[a.rule_id]
        gaps.append(
            Gap(
                id=f"{id_prefix}{r.id}",
                rule_id=r.id,
                title=(a.gap_title or r.text)[:120],
                rule_text=r.text,
                severity=r.severity,
                status=a.status,
                evidence=a.evidence,
                affected_policies=a.affected_policies,
            )
        )
    return gaps


def estimate_fines(
    llm: LLMClient, company: CompanyProfile, regulation_text: str, gaps: list[Gap]
) -> FineEstimate:
    if not gaps:
        return FineEstimate(min_total=0, max_total=0, items=[])
    gaps_txt = "\n".join(f"{g.id} [{g.severity.value}/{g.status}]: {g.title} - {g.rule_text}" for g in gaps)
    out = llm.structured(
        system=prompts.SYSTEM_BASE,
        prompt=prompts.ESTIMATE_FINES.format(
            company=prompts.profile_block(company),
            regulation=prompts.fence("regulation", regulation_text),
            gaps=gaps_txt,
        ),
        model=FinesOut,
    )
    valid = {g.id for g in gaps}
    items: dict[str, FineItem] = {}
    for it in out.fines:
        if it.gap_id in valid and it.gap_id not in items:
            lo, hi = sorted((it.min_inr, it.max_inr))
            items[it.gap_id] = FineItem(gap_id=it.gap_id, min_inr=lo, max_inr=hi, basis=it.basis)
    chosen = list(items.values())
    return FineEstimate(
        min_total=sum(i.min_inr for i in chosen),
        max_total=sum(i.max_inr for i in chosen),
        items=chosen,
    )
