"use client";

import { useEffect, useState } from "react";
import { SAFETY_EVENT, markSafetySeen } from "@/lib/safetyNote";

export default function SafetyNote() {
  const [resolver, setResolver] = useState(null);

  useEffect(() => {
    const onAsk = (e) => setResolver(() => e.detail.resolve);
    window.addEventListener(SAFETY_EVENT, onAsk);
    return () => window.removeEventListener(SAFETY_EVENT, onAsk);
  }, []);

  if (!resolver) return null;
  const close = (ok) => {
    if (ok) markSafetySeen();
    resolver(ok);
    setResolver(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 px-4 pb-6">
      <div role="dialog" aria-modal="true" className="w-full max-w-[400px] rounded-2xl border border-line bg-bg-elevated p-5">
        <h2 className="font-display font-bold text-[18px] mb-3">Before you run</h2>
        <ul className="text-[14px] text-text space-y-2 mb-5">
          <li>📍 Meet at the public spot shown.</li>
          <li>💬 Tell a friend where you&apos;re going.</li>
          <li>🛡️ Leave if anything feels off.</li>
        </ul>
        <button onClick={() => close(true)} className="w-full bg-accent text-bg font-display font-bold rounded-2xl py-3 text-[14px]">
          Got it, join the run
        </button>
        <button onClick={() => close(false)} className="w-full text-muted text-[13px] mt-2 py-2">
          Cancel
        </button>
      </div>
    </div>
  );
}
