import { ObjectId } from "mongodb";
import type { Allocation } from "@pathfolio/shared";
import { portfolios, type PortfolioDoc, type PortfolioSource, type PortfolioStatus } from "./db";

// PortfolioRepository — the only thing allowed to touch the portfolios
// collection directly, same pattern as apps/web's repositories.
// Returns plain JSON-friendly shapes (id: string), not raw ObjectId docs.

export type PortfolioResponse = PortfolioDoc & { id: string };

function toResponse(id: ObjectId, doc: PortfolioDoc): PortfolioResponse {
  // The Mongo driver mutates `doc` to add `_id` after insertOne — strip it
  // so the API only ever returns the clean `id: string` field.
  const { userId, name, allocation, status, source, createdAt, updatedAt } = doc;
  return { id: id.toString(), userId, name, allocation, status, source, createdAt, updatedAt };
}

export async function createPortfolio(
  userId: string,
  name: string,
  allocation: Allocation,
  source: PortfolioSource
): Promise<PortfolioResponse> {
  const now = new Date();
  const doc: PortfolioDoc = { userId, name, allocation, status: "Draft", source, createdAt: now, updatedAt: now };
  const { insertedId } = await portfolios.insertOne(doc);
  return toResponse(insertedId, doc);
}

export async function listPortfolios(userId: string): Promise<PortfolioResponse[]> {
  const docs = await portfolios.find({ userId }).sort({ createdAt: 1 }).toArray();
  return docs.map((d) => toResponse(d._id, d));
}

// Across all users — for Performance Tracking's snapshot job
// (docs/specs/06-performance-tracking.md), not exposed to apps/web.
export async function listAllActivePortfolios(): Promise<PortfolioResponse[]> {
  const docs = await portfolios.find({ status: "Active" }).toArray();
  return docs.map((d) => toResponse(d._id, d));
}

export async function deletePortfolio(userId: string, id: string): Promise<boolean> {
  const result = await portfolios.deleteOne({ _id: new ObjectId(id), userId });
  return result.deletedCount === 1;
}

export async function setStatus(userId: string, id: string, status: PortfolioStatus): Promise<boolean> {
  const result = await portfolios.updateOne(
    { _id: new ObjectId(id), userId },
    { $set: { status, updatedAt: new Date() } }
  );
  return result.matchedCount === 1;
}
