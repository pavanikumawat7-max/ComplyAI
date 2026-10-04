// weights for violations
const weights = {
  transparency: 40,
  data_privacy: 35,
  reporting: 25,
  documentation: 20
};

// calculate score
function calculateScore(violations) {
  let score = 0;

  violations.forEach(v => {
    score += weights[v] || 10;
  });

  return Math.min(score, 100);
}

// map score to impact
function getImpact(score) {
  if (score >= 80) {
    return {
      risk: "HIGH",
      fine: "₹50,00,000",
      impact: "Service restriction possible",
      reputation: "Severe damage",
      level: "CRITICAL"
    };
  } else if (score >= 50) {
    return {
      risk: "MEDIUM",
      fine: "₹10,00,000",
      impact: "Compliance warning issued",
      reputation: "Moderate impact",
      level: "MODERATE"
    };
  } else {
    return {
      risk: "LOW",
      fine: "No fine",
      impact: "No major issues",
      reputation: "No impact",
      level: "SAFE"
    };
  }
}

// explanation
function generateExplanation(violations, risk) {
  if (!violations.length) {
    return "System is fully compliant with regulations.";
  }

  return `Risk is ${risk} due to missing ${violations.join(", ")} compliance.`;
}

// 🔥 AI PROMPT BUILDER (VERY IMPORTANT)
function buildPrompt(violations, score, risk) {
  return `
A company has compliance violations: ${violations.join(", ")}

Risk level: ${risk}
Compliance score: ${score}

Explain:
1. Why this is risky
2. What could happen
3. What actions should be taken

Keep it short, clear, and professional.
`;
}

// FINAL FUNCTION
function simulateImpact(violations = []) {
  const score = calculateScore(violations);
  const impactData = getImpact(score);
  const explanation = generateExplanation(violations, impactData.risk);

  return {
    score,
    violations,
    ...impactData,
    explanation
  };
}

module.exports = {
  simulateImpact,
  buildPrompt
};