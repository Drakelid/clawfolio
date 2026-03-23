"use client";

import { useSyncExternalStore } from "react";

function subscribeToNothing() {
  return () => {};
}

export function useHasMounted(): boolean {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false);
}

export function useMediaQuery(query: string, serverSnapshot = false): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const mediaQuery = window.matchMedia(query);
      const handleChange = () => onStoreChange();

      mediaQuery.addEventListener("change", handleChange);

      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    },
    () => window.matchMedia(query).matches,
    () => serverSnapshot
  );
}
