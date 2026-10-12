"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { verifyAdminCredentials } from "@/lib/auth/credentials";
import {
  createAdminSession,
  deleteAdminSession,
} from "@/lib/auth/session";
import { hashNetworkAddress } from "@/lib/analytics/visit";
import { createAnalyticsClient, getAnalyticsSharedSecret } from "@/lib/supabase/analytics";

export interface LoginState {
  error?: string;
}

const loginSchema = z.object({
  id: z.string().trim().min(1),
  password: z.string().min(1),
});

async function recordLoginAttempt(succeeded: boolean) {
  try {
    const requestHeaders = await headers();
    await createAnalyticsClient().rpc("record_admin_login_attempt", {
      p_secret: getAnalyticsSharedSecret(),
      p_network_hash: hashNetworkAddress(requestHeaders),
      p_succeeded: succeeded,
    });
  } catch (error) {
    console.error("Admin login analytics failed:", {
      code: error instanceof Error ? error.name : "UNKNOWN",
    });
  }
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    id: formData.get("id"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "아이디와 비밀번호를 입력해 주세요." };
  }

  if (!verifyAdminCredentials(parsed.data.id, parsed.data.password)) {
    await recordLoginAttempt(false);
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  await recordLoginAttempt(true);
  await createAdminSession(parsed.data.id);
  redirect("/admin");
}

export async function logoutAction() {
  await deleteAdminSession();
  redirect("/admin/login");
}
