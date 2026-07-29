"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label htmlFor="id" className="mb-2 block text-sm font-bold">
          관리자 아이디
        </label>
        <input
          id="id"
          name="id"
          autoComplete="username"
          required
          className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none focus:border-forest-600 focus:ring-3 focus:ring-forest-100"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-bold">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none focus:border-forest-600 focus:ring-3 focus:ring-forest-100"
        />
      </div>
      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-forest-700 font-bold text-white transition hover:bg-forest-900 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "확인 중..." : "로그인"}
      </button>
    </form>
  );
}
