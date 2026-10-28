// Run dates. Every run has its own time zone (the one of the city it's in),
// and its date and time are entered and shown in that zone, no matter where
// the viewer's phone is. Runs from before cities existed default to Nairobi.

import { DEFAULT_TZ } from "./cities";

const RUN_LENGTH_MS = 3 * 60 * 60 * 1000; // a run counts as over 3 hours after it starts

function dayKey(date, tz) {
  return date.toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
}

// How far ahead of UTC a time zone is at a given moment, in ms.
function offsetMs(tz, utcMs) {
  const wall = new Date(utcMs).toLocaleString("sv-SE", { timeZone: tz }); // "YYYY-MM-DD HH:MM:SS"
  return Date.parse(wall.replace(" ", "T") + "Z") - utcMs;
}

// "Today, 6:00 AM", "Tomorrow, 6:30 AM", "Sat 1 Nov, 6:30 AM" (in the run's zone)
export function formatWhen(iso, tz = DEFAULT_TZ) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
  const now = new Date();
  let day;
  if (dayKey(d, tz) === dayKey(now, tz)) day = "Today";
  else if (dayKey(d, tz) === dayKey(new Date(now.getTime() + 24 * 60 * 60 * 1000), tz)) day = "Tomorrow";
  else day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: tz });
  return `${day}, ${time}`;
}

// A run is "past" once it has been going for more than 3 hours.
// Runs without a date are never treated as past.
export function isPastRun(startsAt) {
  if (!startsAt) return false;
  return new Date(startsAt).getTime() + RUN_LENGTH_MS < Date.now();
}

// ISO timestamp -> value for <input type="datetime-local"> (time in `tz`).
export function toInputValue(iso, tz = DEFAULT_TZ) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("sv-SE", { timeZone: tz }).replace(" ", "T").slice(0, 16);
}

// Value from <input type="datetime-local"> (read as time in `tz`) -> ISO timestamp.
export function fromInputValue(value, tz = DEFAULT_TZ) {
  if (!value) return null;
  const guess = Date.parse(`${value}:00Z`);
  if (Number.isNaN(guess)) return null;
  let t = guess - offsetMs(tz, guess);
  t = guess - offsetMs(tz, t); // second pass settles daylight-saving edges
  return new Date(t).toISOString();
}

// 'weekday' | 'weekend' for a start time, in `tz`.
export function dayCatOf(iso, tz = DEFAULT_TZ) {
  const wd = new Date(iso).toLocaleDateString("en-US", { weekday: "short", timeZone: tz });
  return wd === "Sat" || wd === "Sun" ? "weekend" : "weekday";
}
