"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "pacer_splash_seen";
const SHOW_MS = 2600;
const FADE_MS = 450;

// Brand animation shown when the link first opens: "pacer" rises in, the lime
// dot drops and bounces, a pace line runs underneath, then the tagline fades
// in. After it, the intro steps (first visit) or the runs appear.
//
// It renders visible on the server, so there's no flash of the app before it.
// Plays once per browser session (refreshing doesn't replay it), and a tap
// skips it. Reduced-motion users see the static logo, briefly.
export default function Splash() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    if (alreadySeen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
      return;
    }

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const showFor = reduced ? 900 : SHOW_MS;
    const t1 = setTimeout(() => setLeaving(true), showFor);
    const t2 = setTimeout(() => {
      setVisible(false);
      try {
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}
    }, showFor + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  function skip() {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      try {
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}
    }, FADE_MS);
  }

  const letters = "pacer".split("");

  return (
    <div
      onClick={skip}
      aria-hidden="true"
      className="fixed inset-0 z-[200] bg-bg flex flex-col items-center justify-center"
      style={{ opacity: leaving ? 0 : 1, transition: `opacity ${FADE_MS}ms ease` }}
    >
      <div className="flex items-end font-display font-bold text-[64px] leading-none">
        {letters.map((ch, i) => (
          <span key={i} className="splash-letter" style={{ animationDelay: `${i * 0.08}s` }}>
            {ch}
          </span>
        ))}
        <span className="splash-dot text-accent">.</span>
      </div>

      <div className="relative w-[170px] h-[2px] mt-6 bg-line rounded-full">
        <div className="splash-track absolute inset-0 bg-accent rounded-full" />
        <div className="splash-runner absolute -top-[4px] w-[10px] h-[10px] rounded-full bg-accent" />
      </div>

      <div className="splash-tagline mt-5 text-muted text-[13px] tracking-wide">
        Find your next run
      </div>
    </div>
  );
}
