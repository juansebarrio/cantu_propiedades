"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Cuando la tab estuvo en background más de este umbral, al volver a
// foreground forzamos un router.refresh() para que el server vuelva a
// rendear la página con cookies frescas. Soluciona el caso "vuelvo al
// día siguiente y no carga nada hasta que F5".
const THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos

export function AutoRefreshOnFocus() {
  const router = useRouter();
  const lastHiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    // Rollback: setear NEXT_PUBLIC_AUTO_REFRESH_DISABLED=true en Vercel
    // para no instalar el listener (cliente vuelve al comportamiento de
    // antes de este componente).
    if (process.env.NEXT_PUBLIC_AUTO_REFRESH_DISABLED === "true") return;

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        lastHiddenAtRef.current = Date.now();
        return;
      }

      if (document.visibilityState === "visible") {
        const hiddenAt = lastHiddenAtRef.current;
        if (hiddenAt !== null && Date.now() - hiddenAt >= THRESHOLD_MS) {
          router.refresh();
        }
        lastHiddenAtRef.current = null;
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [router]);

  return null;
}
