// Remembers the pace range a runner picked during onboarding, in this
// browser, so the Discover filter fits them even before they have an account.
// Signed-in runners' saved profile pace takes priority over this.
// localStorage can throw (private windows, blocked storage), so every access
// is wrapped and the app works fine without it.

const PACE_KEY = "pacer_pace_range";
const ONBOARDED_KEY = "pacer_onboarded";
export const PACE_CHANGED_EVENT = "pacer:pace-changed";

export function getLocalPace() {
  try {
    const raw = window.localStorage.getItem(PACE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.min === "number" && typeof parsed?.max === "number") return parsed;
  } catch {}
  return null;
}

export function setLocalPace(range) {
  try {
    window.localStorage.setItem(PACE_KEY, JSON.stringify(range));
  } catch {}
  window.dispatchEvent(new Event(PACE_CHANGED_EVENT));
}

export function hasOnboarded() {
  try {
    return window.localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboarded() {
  try {
    window.localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {}
}
