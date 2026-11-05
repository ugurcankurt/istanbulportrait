import { NextResponse } from "next/server";
import { isServerAdmin } from "@/lib/auth-server";
import { getAllAuthors } from "@/lib/blog/blog-service";

export async function GET() {
  try {
    if (!(await isServerAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authors = await getAllAuthors();
    return NextResponse.json({ authors });
  } catch (error) {
    console.error("Error fetching authors:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
