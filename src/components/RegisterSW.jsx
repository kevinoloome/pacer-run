"use client";

import { useEffect } from "react";

// Registers the service worker (needed for "Install app" on Android).
export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
