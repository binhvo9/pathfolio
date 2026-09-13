import { fetchPortfolios, fetchSnapshots, fetchRiskProfile } from "./clients";
import { findLatestInsightForPortfolio } from "./db";
import { generateReportPdf } from "./pdf";
import { uploadReportPdf } from "./r2";

// Orchestration for POST /portfolios/:id/export and .../email —
// docs/specs/07-insight-ai.md's Export behavior.

export class PortfolioNotFoundError extends Error {}

export type ExportResult = { url: string; portfolioName: string };

export async function exportPortfolioReport(userId: string, portfolioId: string): Promise<ExportResult> {
  const portfolios = await fetchPortfolios(userId);
  const portfolio = portfolios.find((p) => p.id === portfolioId);
  if (!portfolio) throw new PortfolioNotFoundError(portfolioId);

  const [snapshots, riskProfile, latestInsight] = await Promise.all([
    fetchSnapshots(userId, portfolioId),
    fetchRiskProfile(userId),
    findLatestInsightForPortfolio(userId, portfolioId),
  ]);

  const pdf = await generateReportPdf(portfolio, snapshots, riskProfile, latestInsight?.insightText ?? null);
  const key = `reports/${userId}/${portfolioId}-${Date.now()}.pdf`;
  const url = await uploadReportPdf(key, pdf);
  return { url, portfolioName: portfolio.name };
}
