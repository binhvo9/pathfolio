import { NextResponse } from "next/server";
import { auth } from "@/modules/auth";
import { setScenarioStatus } from "@/lib/simulation-client";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, action } = await params;
  if (action !== "activate" && action !== "archive") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  const result = await setScenarioStatus(session.user.id, id, action);
  return NextResponse.json(result);
}
