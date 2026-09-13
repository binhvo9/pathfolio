import { insights } from "./db";
import { fetchPortfolios, fetchSnapshots, fetchRiskProfile, type Portfolio, type Snapshot } from "./clients";
import { generateInsight } from "./gemini";

// Orchestration for POST /compare — docs/specs/07-insight-ai.md's
// "Comparison" behavior, steps 2-4.

function summarizePortfolio(portfolio: Portfolio, snapshots: Snapshot[]): string {
  const allocationText = Object.entries(portfolio.allocation)
    .map(([cls, pct]) => `${cls} ${pct}%`)
    .join(", ");

  if (snapshots.length === 0) {
    return `"${portfolio.name}" (${portfolio.status}) — allocation: ${allocationText}. No performance history yet.`;
  }

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const totalChangePercent = ((last.value - first.value) / first.value) * 100;

  return (
    `"${portfolio.name}" (${portfolio.status}) — allocation: ${allocationText}. ` +
    `Value: $${last.value.toFixed(2)}, ${totalChangePercent >= 0 ? "+" : ""}${totalChangePercent.toFixed(2)}% ` +
    `since it started at $${first.value.toFixed(2)} (${snapshots.length} snapshots).`
  );
}

function buildPrompt(
  portfolios: Portfolio[],
  snapshotsByPortfolio: Snapshot[][],
  riskProfile: Awaited<ReturnType<typeof fetchRiskProfile>>
): string {
  const goalLine = riskProfile
    ? `The user's stated goal is "${riskProfile.goal}", with a "${riskProfile.riskBand}" risk tolerance and a "${riskProfile.incomeTiltBand}" income preference.`
    : "The user hasn't completed their risk profile yet.";

  const portfolioLines = portfolios.map((p, i) => summarizePortfolio(p, snapshotsByPortfolio[i])).join("\n");

  return (
    `You are explaining investment scenario comparisons to a complete beginner investor in New Zealand. ` +
    `Be plain, encouraging, and specific — no jargon. This is a simulation, not real money.\n\n` +
    `${goalLine}\n\nHere are their scenarios:\n${portfolioLines}\n\n` +
    `In 3-4 short sentences, say which scenario is better aligned with their stated goal right now, and why.`
  );
}

export async function compareScenarios(userId: string, portfolioIds: string[]): Promise<string> {
  const allPortfolios = await fetchPortfolios(userId);
  const portfolios = allPortfolios.filter((p) => portfolioIds.includes(p.id));

  const [snapshotsByPortfolio, riskProfile] = await Promise.all([
    Promise.all(portfolios.map((p) => fetchSnapshots(userId, p.id))),
    fetchRiskProfile(userId),
  ]);

  const prompt = buildPrompt(portfolios, snapshotsByPortfolio, riskProfile);
  const insightText = await generateInsight(prompt);

  await insights.insertOne({ userId, portfolioIds, insightText, createdAt: new Date() });
  return insightText;
}
