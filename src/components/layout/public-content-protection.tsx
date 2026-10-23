"use client";

import { useEffect } from "react";

function isImage(target: EventTarget | null): target is HTMLImageElement {
  return target instanceof HTMLImageElement;
}

type ShortcutEvent = Pick<
  KeyboardEvent,
  "altKey" | "ctrlKey" | "key" | "metaKey" | "shiftKey"
>;

export function isBlockedPublicShortcut(event: ShortcutEvent) {
  const key = event.key.toLowerCase();

  if (event.key === "F12") return true;

  const controlShortcut = event.ctrlKey || event.metaKey;
  const developerPanelShortcut =
    controlShortcut && event.shiftKey && ["c", "i", "j"].includes(key);
  const macDeveloperPanelShortcut =
    event.metaKey && event.altKey && ["c", "i", "j"].includes(key);
  const sourceShortcut = controlShortcut && key === "u";
  const saveShortcut = controlShortcut && key === "s";

  return (
    developerPanelShortcut ||
    macDeveloperPanelShortcut ||
    sourceShortcut ||
    saveShortcut
  );
}

export function PublicContentProtection() {
  useEffect(() => {
    const root = document.documentElement;

    function preventImageMenu(event: MouseEvent) {
      if (isImage(event.target)) event.preventDefault();
    }

    function preventImageDrag(event: DragEvent) {
      if (isImage(event.target)) event.preventDefault();
    }

    function preventDeveloperShortcuts(event: KeyboardEvent) {
      if (!isBlockedPublicShortcut(event)) return;

      event.preventDefault();
      event.stopPropagation();
    }

    root.classList.add("cy-public-content-protected");
    document.addEventListener("contextmenu", preventImageMenu, true);
    document.addEventListener("dragstart", preventImageDrag, true);
    document.addEventListener("keydown", preventDeveloperShortcuts, true);

    return () => {
      root.classList.remove("cy-public-content-protected");
      document.removeEventListener("contextmenu", preventImageMenu, true);
      document.removeEventListener("dragstart", preventImageDrag, true);
      document.removeEventListener("keydown", preventDeveloperShortcuts, true);
    };
  }, []);

  return null;
}
