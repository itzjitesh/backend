// server/logic/campaignROI.js

function calculateCampaignROI({
  spend = 0,
  conversions = 0,
  revenuePerConversion = 0,
}) {
  const totalRevenue = conversions * revenuePerConversion;
  const roi = spend > 0 ? ((totalRevenue - spend) / spend) * 100 : 0;
  const cpa = conversions > 0 ? spend / conversions : 0;

  return {
    totalRevenue,
    roi: Number(roi.toFixed(2)),
    cpa: Number(cpa.toFixed(2)),
    direction: roi >= 0 ? "positive" : "negative",
  };
}

function generateCampaignNarrative(inputs, result, user) {
  return `
Campaign performance summary:

• Spend: $${inputs.spend}
• Conversions: ${inputs.conversions}
• Revenue per conversion: $${inputs.revenuePerConversion}

Results:
• Total Revenue: $${result.totalRevenue}
• ROI: ${result.roi}%
• Cost per acquisition: $${result.cpa}

Overall, this campaign delivered a ${result.direction} ROI.
`;
}

module.exports = {
  calculateCampaignROI,
  generateCampaignNarrative,
};
