// First-join safety note. askSafety() resolves true straight away if this
// device has already seen it; otherwise it opens the pop-up and resolves with
// the person's choice (true = join, false = cancel).
const KEY = "twenderun.safetySeen";
export const SAFETY_EVENT = "twenderun:safety";

const seen = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};
export const markSafetySeen = () => {
  try {
    localStorage.setItem(KEY, "1");
  } catch {}
};

export function askSafety() {
  if (typeof window === "undefined" || seen()) return Promise.resolve(true);
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent(SAFETY_EVENT, { detail: { resolve } }));
  });
}
