"use client";

import { useEffect, useState } from "react";
import { parsePace } from "@/lib/pace";
import { hasOnboarded, markOnboarded, setLocalPace } from "@/lib/localPace";

const PRESETS = [
  { label: "New to running", min: "8:00", max: "9:30" },
  { label: "Comfortable jogger", min: "6:30", max: "7:30" },
  { label: "Regular runner", min: "5:15", max: "6:00" },
  { label: "Fast / competitive", min: "4:00", max: "5:00" },
];

const TOTAL_STEPS = 4;

// First-visit intro, ported from the prototype: welcome, how it works,
// pace, safety. Shown once per browser (remembered in localStorage).
export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [paceMin, setPaceMin] = useState("5:15");
  const [paceMax, setPaceMax] = useState("6:00");
  const [error, setError] = useState("");

  // localStorage only exists in the browser, so the check has to run after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!hasOnboarded()) setOpen(true);
  }, []);

  if (!open) return null;

  function finish(savePace) {
    if (savePace) {
      const min = parsePace(paceMin);
      const max = parsePace(paceMax);
      if (min && max && min <= max) setLocalPace({ min, max });
    }
    markOnboarded();
    setOpen(false);
  }

  function nextFromPace() {
    const min = parsePace(paceMin);
    const max = parsePace(paceMax);
    if (!min || !max || min > max) {
      setError("Use m:ss, fastest first, e.g. 5:15 and 6:00.");
      return;
    }
    setError("");
    setStep(4);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-bg overflow-y-auto">
      <div className="mx-auto max-w-[430px] min-h-full flex flex-col px-6 pt-8 pb-8">
        <div className="flex gap-1.5 mb-7">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-[3px] rounded-sm ${i < step ? "bg-accent" : "bg-line"}`}
            />
          ))}
        </div>

        <div className="flex-1">
          {step === 1 && (
            <>
              <Icon>🏃</Icon>
              <h2 className="font-display font-bold text-[23px] leading-tight mb-2.5">
                Never run alone again
              </h2>
              <p className="text-muted text-[13.5px] leading-relaxed">
                Pacer matches you with runners nearby who want to go at the same time, at the same
                pace. Post a run or join one. It takes about a minute to get set up.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <Icon>👆</Icon>
              <h2 className="font-display font-bold text-[23px] leading-tight mb-4">
                How Pacer works
              </h2>
              <ul className="flex flex-col gap-4">
                <Point icon="♡">
                  <b className="text-text">Swipe right</b> (or tap the heart) on a run to join it.
                </Point>
                <Point icon="✕">
                  <b className="text-text">Swipe left</b> (or tap the cross) to skip it. Prefer a
                  list? Switch to <b className="text-text">List</b> at the top.
                </Point>
                <Point icon="🏃">
                  Joined runs live under <b className="text-text">My runs</b>, with the meeting
                  place on a map and a chat with the group.
                </Point>
                <Point icon="➕">
                  Tap <b className="text-text">Post</b> to host your own run and invite others.
                </Point>
                <Point icon="👤">
                  No sign-up needed. Just swipe, join and chat.
                </Point>
              </ul>
            </>
          )}

          {step === 3 && (
            <>
              <Icon>⏱</Icon>
              <h2 className="font-display font-bold text-[23px] leading-tight mb-2.5">
                What&apos;s your pace?
              </h2>
              <p className="text-muted text-[13.5px] leading-relaxed mb-5">
                Pace is how long it takes you to run one kilometre. Not sure of yours yet? Pick what
                feels closest. You can change it anytime in your profile.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {PRESETS.map((p) => {
                  const active = paceMin === p.min && paceMax === p.max;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setPaceMin(p.min);
                        setPaceMax(p.max);
                        setError("");
                      }}
                      className={`rounded-full border px-3.5 py-2 text-[12.5px] font-medium ${
                        active
                          ? "bg-accent/15 border-accent text-accent"
                          : "bg-bg-elevated border-line text-muted"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PaceField label="Fastest (min/km)" value={paceMin} onChange={setPaceMin} />
                <PaceField label="Easiest (min/km)" value={paceMax} onChange={setPaceMax} />
              </div>
              {error && <p className="text-accent-warm text-[12.5px] mt-3">{error}</p>}
            </>
          )}

          {step === 4 && (
            <>
              <Icon>🛡️</Icon>
              <h2 className="font-display font-bold text-[23px] leading-tight mb-4">
                Safety comes first
              </h2>
              <ul className="flex flex-col gap-4">
                <Point icon="✓">
                  Meet at public, well-lit places. Never agree to a private meeting point.
                </Point>
                <Point icon="✓">
                  Tell someone you trust where you are running and when you expect to be back.
                </Point>
                <Point icon="✓">
                  Trust your instincts. If a run or a person feels off, skip it.
                </Point>
              </ul>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {step === 1 && <Primary onClick={() => setStep(2)}>Get started</Primary>}
          {step === 2 && <Primary onClick={() => setStep(3)}>Continue</Primary>}
          {step === 3 && <Primary onClick={nextFromPace}>Continue</Primary>}
          {step === 4 && <Primary onClick={() => finish(true)}>Start browsing runs</Primary>}
          {step < 4 && (
            <button
              type="button"
              onClick={() => finish(false)}
              className="text-center text-[12.5px] text-muted py-1"
            >
              Skip intro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Icon({ children }) {
  return (
    <div className="w-[58px] h-[58px] rounded-2xl mb-5 bg-accent/10 border border-accent/30 flex items-center justify-center text-[25px]">
      {children}
    </div>
  );
}

function Point({ icon, children }) {
  return (
    <li className="flex gap-3 items-start text-[13px] text-[#C7CCD3] leading-snug">
      <span className="text-accent flex-shrink-0 w-4 text-center">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function Primary({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-accent text-bg font-display font-bold text-[15px] rounded-2xl py-3.5"
    >
      {children}
    </button>
  );
}

function PaceField({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="text-[12px] font-medium text-muted mb-1.5">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
        className="w-full bg-bg-elevated border border-line rounded-xl px-3.5 py-3 text-[14px] font-mono text-text focus:outline-none focus:border-accent"
      />
    </label>
  );
}
