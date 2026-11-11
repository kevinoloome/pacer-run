// Small helpers for the "set your name / save your account" prompts.
// A guest only gets asked after they've actually joined or posted a run.
const ENGAGED_KEY = "twenderun.engaged";
const BANNER_KEY = "twenderun.saveBannerHiddenUntil";
const NAME_KEY = "twenderun.nameAskedAt";
export const NUDGE_EVENT = "twenderun:engaged";

const safe = (fn, fallback) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export function markEngaged() {
  safe(() => localStorage.setItem(ENGAGED_KEY, "1"));
  window.dispatchEvent(new Event(NUDGE_EVENT));
}
export const isEngaged = () => safe(() => localStorage.getItem(ENGAGED_KEY) === "1", false);

// Save-account banner: hidden for 3 days after being dismissed.
export const bannerHidden = () =>
  safe(() => Number(localStorage.getItem(BANNER_KEY) || 0) > Date.now(), false);
export const hideBanner = () =>
  safe(() => localStorage.setItem(BANNER_KEY, String(Date.now() + 3 * 24 * 3600 * 1000)));

// Name prompt: don't ask more than once per day if they skip it.
export const nameAskedRecently = () =>
  safe(() => Date.now() - Number(localStorage.getItem(NAME_KEY) || 0) < 24 * 3600 * 1000, false);
export const markNameAsked = () => safe(() => localStorage.setItem(NAME_KEY, String(Date.now())));

export const isDefaultName = (name) => !name || /^Runner \d+$/.test(name);
