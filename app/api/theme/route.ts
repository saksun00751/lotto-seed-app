import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { apiPost, ApiError } from "@/lib/api/client";
import { getTheme, isTheme, isValidColor, THEME_KEYS, type Theme } from "@/lib/api/theme";

export async function GET() {
  const theme = await getTheme();
  return NextResponse.json(theme);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice("bearer ".length).trim();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Body must be an object" }, { status: 400 });
  }

  const candidate = body as Record<string, unknown>;
  const extraKeys = Object.keys(candidate).filter(
    (k) => !(THEME_KEYS as ReadonlyArray<string>).includes(k),
  );
  if (extraKeys.length > 0) {
    return NextResponse.json(
      { message: `Unknown keys: ${extraKeys.join(", ")}` },
      { status: 400 },
    );
  }

  const invalid: string[] = [];
  for (const key of THEME_KEYS) {
    if (!isValidColor(candidate[key])) invalid.push(key);
  }
  if (invalid.length > 0) {
    return NextResponse.json(
      { message: `Invalid color values for: ${invalid.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const saved = await apiPost<unknown>("/admin/theme", candidate, token);
    const theme: Theme = isTheme(saved)
      ? saved
      : isTheme((saved as { data?: unknown })?.data)
        ? ((saved as { data: Theme }).data)
        : (candidate as unknown as Theme);

    revalidateTag("theme", "max");
    return NextResponse.json(theme);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { message: err.message, payload: err.payload },
        { status: err.status },
      );
    }
    return NextResponse.json({ message: "Upstream error" }, { status: 502 });
  }
}
