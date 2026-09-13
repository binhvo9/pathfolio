import { MongoClient } from "mongodb";

// Insights collection — MongoDB Atlas, same cluster, per CLAUDE.md's
// storage split. docs/specs/07-insight-ai.md.

export type InsightDoc = {
  userId: string;
  portfolioIds: string[];
  insightText: string;
  createdAt: Date;
};

const client = new MongoClient(process.env.DATABASE_URL!);
const db = client.db();

export const insights = db.collection<InsightDoc>("insights");

// Export (docs/specs/07-insight-ai.md) reuses the most recent saved
// comparison that mentions this portfolio rather than calling Gemini
// again — the AI text isn't regenerated per export, it's a snapshot of
// whatever's already on record.
export function findLatestInsightForPortfolio(userId: string, portfolioId: string) {
  return insights.findOne({ userId, portfolioIds: portfolioId }, { sort: { createdAt: -1 } });
}
