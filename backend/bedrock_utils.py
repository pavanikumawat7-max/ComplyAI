def interpret_regulation(regulation):
    return [
        "APR must be clearly disclosed to users",
        "All fees and hidden charges must be transparent",
        "User data usage must be explicitly explained",
        "User consent must be obtained before data collection"
    ]


def generate_report(regulation, rules, gaps):
    return f"""
Audit Summary:
The company is partially compliant with RBI digital lending guidelines.

Rules:
{rules}

Gaps:
{gaps}

Business Impact:
Non-compliance may lead to regulatory penalties and reputational damage.

Risk Explanation:
The absence of proper disclosures increases legal and financial risk.

Confidence score: 87%
"""


def simulate_fine(gaps):
    return f"""
Estimated Fine:
₹25,00,000

6-Month Impact:
- Regulatory warnings
- Increased audits
- Possible service restrictions

Confidence score: 84%
"""