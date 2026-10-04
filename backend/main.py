from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph_flow import run_graph

app = FastAPI()

# ✅ CORS (VERY IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "API running"}

@app.post("/run-graph")
def run(data: dict):
    result = run_graph(data)

    return {
        "rules": result.get("rules", []),
        "gaps": result.get("gaps", []),
        "risk": result.get("risk", ""),
        "risk_score": result.get("risk_score", 0),
        "report": result.get("report", ""),
        "fine": result.get("fine", "")
    }