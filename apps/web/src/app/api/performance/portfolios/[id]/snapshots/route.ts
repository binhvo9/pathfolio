import { NextResponse } from "next/server";
import { auth } from "@/modules/auth";
import { listSnapshots } from "@/lib/performance-client";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const snapshots = await listSnapshots(session.user.id, id);
  return NextResponse.json(snapshots);
}
