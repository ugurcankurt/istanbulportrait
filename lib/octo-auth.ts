import { NextRequest, NextResponse } from "next/server";

export function requireOctoAuth(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const expectedKey = process.env.OCTO_API_KEY;

  if (!expectedKey) {
    // If not configured in env, fail safely
    console.error("OCTO_API_KEY is not set in environment variables.");
    return false;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.split(" ")[1];
  return token === expectedKey;
}

export function octoUnauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized", message: "Invalid or missing Bearer token" },
    { status: 401 }
  );
}
