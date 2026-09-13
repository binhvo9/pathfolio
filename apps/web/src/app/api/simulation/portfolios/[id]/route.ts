import { NextResponse } from "next/server";
import { auth } from "@/modules/auth";
import { deleteScenario } from "@/lib/simulation-client";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteScenario(session.user.id, id);
  return new NextResponse(null, { status: 204 });
}
