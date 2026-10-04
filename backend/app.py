import json
from langgraph_flow import run_graph

def lambda_handler(event, context):
    try:
        body = event.get("body", {})
        if isinstance(body, str):
            body = json.loads(body)

        result = run_graph(body)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(result)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }