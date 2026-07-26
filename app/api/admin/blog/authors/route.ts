import { NextResponse } from "next/server";
import { getAllAuthors } from "@/lib/blog/blog-service";
import { getServerUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authors = await getAllAuthors();
    return NextResponse.json({ authors });
  } catch (error) {
    console.error("Error fetching authors:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
