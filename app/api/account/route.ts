import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  assertAccountDeleteRateLimit,
  assertDeleteConfirmation,
  deleteUserAccount,
  touchAccountDeleteAttempt,
  AccountDeleteConfirmError,
  AccountDeleteRateLimitError,
} from "@/lib/account/delete-account";

/**
 * DELETE /api/account — permanently delete the signed-in user's account.
 * Body: { confirm: "delete" }
 */

const bodySchema = z.object({
  confirm: z.string(),
});

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await assertAccountDeleteRateLimit(user.id);
  } catch (e) {
    if (e instanceof AccountDeleteRateLimitError) {
      return NextResponse.json(
        { error: "Please wait a minute before trying again." },
        { status: 429 }
      );
    }
    throw e;
  }

  try {
    assertDeleteConfirmation(parsed.data.confirm);
  } catch (e) {
    if (e instanceof AccountDeleteConfirmError) {
      await touchAccountDeleteAttempt(user.id);
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  await touchAccountDeleteAttempt(user.id);

  try {
    const result = await deleteUserAccount(user.id);
    return NextResponse.json({ ok: true, stripe: result.stripe });
  } catch (e) {
    console.error("[api/account] delete failed:", e);
    const message = e instanceof Error ? e.message : "Account deletion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
