import { MongoClient } from "mongodb";
import type { Allocation } from "@pathfolio/shared";

// Portfolios collection — MongoDB Atlas, per docs/specs/04-portfolio-simulation.md.
// No ORM: Prisma 7 doesn't support Mongo yet (only v6 does), and adding a
// second Prisma version just for one collection isn't worth the mess —
// the native driver is plenty for a single flexible-schema collection.

export type PortfolioStatus = "Draft" | "Active" | "Archived";
export type PortfolioSource = "onboarding-default" | "manual";

// _id is added automatically by the driver (as ObjectId) — not declared
// here so Collection<PortfolioDoc> infers it correctly.
export type PortfolioDoc = {
  userId: string;
  name: string;
  allocation: Allocation;
  status: PortfolioStatus;
  source: PortfolioSource;
  createdAt: Date;
  updatedAt: Date;
};

const client = new MongoClient(process.env.DATABASE_URL!);
const db = client.db();

export const portfolios = db.collection<PortfolioDoc>("portfolios");
