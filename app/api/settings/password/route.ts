/**
 * POST /api/settings/password — Change the current user's password
 */

import { NextResponse } from "next/server";
import { getCurrentUser, changePassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmNewPassword } = body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json(
        { error: "Current password, new password, and confirmation are required" },
        { status: 400 },
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
        { status: 400 },
      );
    }

    const result = await changePassword(user.id, currentPassword, newPassword);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
