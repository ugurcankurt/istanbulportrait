import { NextResponse } from "next/server";
import { isServerAdmin } from "@/lib/auth-server";

export async function GET() {
  if (!(await isServerAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Setup DB endpoint is disabled in production." },
    { status: 403 },
  );
}
