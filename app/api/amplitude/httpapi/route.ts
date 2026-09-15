import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for Amplitude Browser SDK ingest.
 * Ad blockers often block api2.amplitude.com; posting via /api keeps local
 * setup verification working while the SDK payload stays unchanged.
 */
export async function POST(request: Request) {
  const body = await request.arrayBuffer();
  const contentType = request.headers.get("content-type") || "application/json";

  try {
    const upstream = await fetch("https://api2.amplitude.com/2/httpapi", {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        Accept: "*/*",
      },
      body,
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("[amplitude proxy] upstream failed", err);
    return NextResponse.json(
      { code: 500, error: "Amplitude proxy upstream failed" },
      { status: 502 },
    );
  }
}
