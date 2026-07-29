"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyAdminCredentials } from "@/lib/auth/credentials";
import {
  createAdminSession,
  deleteAdminSession,
} from "@/lib/auth/session";

export interface LoginState {
  error?: string;
}

const loginSchema = z.object({
  id: z.string().trim().min(1),
  password: z.string().min(1),
});

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
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  await createAdminSession(parsed.data.id);
  redirect("/admin");
}

export async function logoutAction() {
  await deleteAdminSession();
  redirect("/admin/login");
}
