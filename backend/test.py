from bedrock_utils import interpret_regulation

regulation = "RBI requires digital lenders to disclose APR, fees, and data usage clearly."

result = interpret_regulation(regulation)

print("\n=== AI OUTPUT ===\n")
print(result)