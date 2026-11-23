"use client";

import { useEffect } from "react";

// 이미지 우클릭 저장·드래그를 막는다. (간단한 억제 장치일 뿐 완전한 차단은 아니다.)
// 관리자 화면과 입력창에서는 동작하지 않는다.
export function ImageProtect() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;

    const isImage = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.tagName === "IMG" || target.closest("[data-gallery], figure, picture"));

    const onContextMenu = (event: MouseEvent) => {
      if (isImage(event.target)) event.preventDefault();
    };
    const onDragStart = (event: DragEvent) => {
      if (event.target instanceof HTMLImageElement) event.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  return null;
}
