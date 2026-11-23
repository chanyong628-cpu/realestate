"use client";

import { useEffect, useState } from "react";

let adminCheck: Promise<boolean> | null = null;

function checkAdmin() {
  adminCheck ??= fetch("/api/admin/session", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : { admin: false }))
    .then((data) => data.admin === true)
    .catch(() => false);
  return adminCheck;
}

// 관리자로 로그인한 경우에만 true. 정적 페이지를 유지하면서 목록에 수정·노출·삭제 버튼을 붙인다.
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    void checkAdmin().then((value) => {
      if (active) setIsAdmin(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return isAdmin;
}
