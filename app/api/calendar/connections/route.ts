import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/calendar/connections — List user's calendar connections.
 * Returns provider, email, enabled status. Never returns tokens.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connections = await prisma.calendarConnection.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      provider: true,
      providerEmail: true,
      enabled: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ connections });
}

/**
 * DELETE /api/calendar/connections — Remove a calendar connection.
 * Body: { connectionId: string }
 * Cascades: deletes related CalendarEvents.
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { connectionId } = body;

  if (!connectionId) {
    return NextResponse.json({ error: "connectionId required" }, { status: 400 });
  }

  // Verify ownership
  const connection = await prisma.calendarConnection.findFirst({
    where: { id: connectionId, userId: user.id },
  });

  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  await prisma.calendarConnection.delete({
    where: { id: connectionId },
  });

  return NextResponse.json({ deleted: true });
}

/**
 * PATCH /api/calendar/connections — Toggle a connection on/off.
 * Body: { connectionId: string, enabled: boolean }
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { connectionId, enabled } = body;

  if (!connectionId || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "connectionId and enabled (boolean) required" }, { status: 400 });
  }

  const connection = await prisma.calendarConnection.findFirst({
    where: { id: connectionId, userId: user.id },
  });

  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const updated = await prisma.calendarConnection.update({
    where: { id: connectionId },
    data: { enabled },
    select: { id: true, provider: true, providerEmail: true, enabled: true },
  });

  return NextResponse.json({ connection: updated });
}
