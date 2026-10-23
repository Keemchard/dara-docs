"use client";

import { useEffect, useRef } from "react";

export function PageTracker() {
  const sent = useRef<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (sent.current === path) return;
    sent.current = path;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  return null;
}
