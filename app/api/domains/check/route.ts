import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkDomains } from "@/lib/openprovider";

const DEFAULT_EXTENSIONS = ["com", "net", "org", "io", "dev", "co"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const query = (body.query ?? "").trim().toLowerCase();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  // Parse "mysite.com" into name + extension, or search default TLDs
  let name: string;
  let extensions: string[];

  const dotIndex = query.lastIndexOf(".");
  if (dotIndex > 0 && dotIndex < query.length - 1) {
    name = query.slice(0, dotIndex);
    const ext = query.slice(dotIndex + 1);
    // Search the specific extension plus a few popular alternatives
    extensions = [ext, ...DEFAULT_EXTENSIONS.filter((e) => e !== ext)];
  } else {
    name = query;
    extensions = DEFAULT_EXTENSIONS;
  }

  try {
    const results = await checkDomains(name, extensions);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Domain check failed:", err);
    return NextResponse.json(
      { error: "Failed to check domain availability" },
      { status: 500 }
    );
  }
}
