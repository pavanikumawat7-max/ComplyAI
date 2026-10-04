from langgraph_flow import run_graph

result = run_graph({})

print("\n=== FULL OUTPUT ===\n")

for k, v in result.items():
    print(f"{k}:\n{v}\n")