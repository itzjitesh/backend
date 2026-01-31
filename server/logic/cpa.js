function calculateCPA(inputs = {}) {
  const spend = Number(inputs.spend || 0);
  const conversions = Number(inputs.conversions || 0);

  if (conversions <= 0) {
    throw new Error("Conversions must be greater than 0");
  }

  const cpa = +(spend / conversions).toFixed(2);

  return {
    spend,
    conversions,
    cpa,
  };
}

function generateCPANarrative(inputs, result, user) {
  const tier = user?.subscription?.tier || "free";

  let text = `With a total spend of $${result.spend} and ${result.conversions} conversions, your Cost Per Acquisition (CPA) is $${result.cpa}.`;

  if (tier === "pro") {
    text += ` This CPA indicates how efficiently your campaign is converting spend into customers. Consider testing creatives or audiences to reduce CPA further.`;
  } else {
    text += ` Upgrade to Pro to unlock deeper insights and save more scenarios.`;
  }

  return text;
}

module.exports = {
  calculateCPA,
  generateCPANarrative,
};
