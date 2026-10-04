from typing import TypedDict, List
from langgraph.graph import StateGraph
from bedrock_utils import interpret_regulation, generate_report, simulate_fine

class ComplianceState(TypedDict):
    regulation: str
    rules: List[str]
    gaps: List[str]
    risk: str
    risk_score: int
    report: str
    fine: str


def regulation_monitor(state: ComplianceState):
    return {
        **state,
        "regulation": "RBI mandates disclosure of APR, fees, data usage, and user consent"
    }


def legal_interpreter(state: ComplianceState):
    rules = interpret_regulation(state["regulation"])
    return {**state, "rules": rules}


def compliance_mapper(state: ComplianceState):
    company = ["We disclose interest rates", "We store user data"]

    gaps = []

    for rule in state["rules"]:
        if "APR" in rule:
            gaps.append("Missing APR disclosure")
        elif "fees" in rule:
            gaps.append("Missing fee disclosure")
        elif "data" in rule:
            gaps.append("Missing data usage clarity")
        elif "consent" in rule:
            gaps.append("Missing consent system")

    return {**state, "gaps": gaps}


def risk_detector(state: ComplianceState):
    n = len(state["gaps"])

    if n == 0:
        risk, score = "LOW", 20
    elif n < 3:
        risk, score = "MEDIUM", 60
    else:
        risk, score = "HIGH", 90

    return {**state, "risk": risk, "risk_score": score}


def report_generator(state: ComplianceState):
    report = generate_report(state["regulation"], state["rules"], state["gaps"])
    fine = simulate_fine(state["gaps"])

    return {**state, "report": report, "fine": fine}


builder = StateGraph(ComplianceState)

builder.add_node("monitor", regulation_monitor)
builder.add_node("interpret", legal_interpreter)
builder.add_node("map", compliance_mapper)
builder.add_node("risk", risk_detector)
builder.add_node("report", report_generator)

builder.set_entry_point("monitor")

builder.add_edge("monitor", "interpret")
builder.add_edge("interpret", "map")
builder.add_edge("map", "risk")
builder.add_edge("risk", "report")

graph = builder.compile()


def run_graph(input_data: dict):
    state = {
        "regulation": "",
        "rules": [],
        "gaps": [],
        "risk": "",
        "risk_score": 0,
        "report": "",
        "fine": ""
    }

    return graph.invoke(state)