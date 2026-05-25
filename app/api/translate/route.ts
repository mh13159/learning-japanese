import { NextRequest } from "next/server";
import { translate } from "@/lib/translate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let input: string | undefined;
  try {
    const body = await req.json();
    input = typeof body?.input === "string" ? body.input : undefined;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (input === undefined || input === null) {
    return Response.json({ error: "Missing 'input' field" }, { status: 400 });
  }

  try {
    const result = await translate(input);
    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-Detected": result.meta.detected,
        "X-Cached": result.meta.cached ? "1" : "0",
      },
    });
  } catch (err) {
    console.error("[/api/translate] failed:", err);
    return Response.json(
      { error: "Translation pipeline failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({ ok: true, route: "/api/translate", method: "POST" });
}
