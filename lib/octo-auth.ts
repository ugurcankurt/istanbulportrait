import { NextRequest, NextResponse } from "next/server";

export function getOctoAuthType(req: NextRequest): "global" | "local" | null {
  const authHeader = req.headers.get("Authorization");
  const globalKey = process.env.OCTO_API_KEY;
  const localKey = process.env.OCTO_LOCAL_API_KEY;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  
  if (globalKey && token === globalKey) {
    return "global";
  }
  
  if (localKey && token === localKey) {
    return "local";
  }

  return null;
}

export function requireOctoAuth(req: NextRequest): boolean {
  return getOctoAuthType(req) !== null;
}

export function octoUnauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized", message: "Invalid or missing Bearer token" },
    { status: 401 }
  );
}
