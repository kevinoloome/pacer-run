"use client";

// Shared styled text field for sign-in/sign-up/post/profile forms, matching
// the app's dark elevated-surface input style used elsewhere.
export default function AuthInput({ label, className = "", ...inputProps }) {
  return (
    <label className="block mb-3.5">
      {label ? <div className="text-[12px] font-medium text-muted mb-1.5">{label}</div> : null}
      <input
        className={`w-full bg-bg-elevated border border-line rounded-xl px-3.5 py-3 text-[14px] text-text placeholder:text-muted focus:outline-none focus:border-accent ${className}`}
        {...inputProps}
      />
    </label>
  );
}
