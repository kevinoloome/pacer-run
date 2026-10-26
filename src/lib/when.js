// Run dates. Pacer is Nairobi-based, and Nairobi has no daylight saving
// (always UTC+03:00), so every date is read and shown in Africa/Nairobi time
// no matter what time zone the viewer's phone is set to.

const TZ = "Africa/Nairobi";
const RUN_LENGTH_MS = 3 * 60 * 60 * 1000; // a run counts as over 3 hours after it starts

function dayKey(date) {
  return date.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
}

// "Today, 6:00 AM", "Tomorrow, 6:30 AM", "Sat 1 Nov, 6:30 AM"
export function formatWhen(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
  const now = new Date();
  let day;
  if (dayKey(d) === dayKey(now)) day = "Today";
  else if (dayKey(d) === dayKey(new Date(now.getTime() + 24 * 60 * 60 * 1000))) day = "Tomorrow";
  else day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
  return `${day}, ${time}`;
}

// A run is "past" once it has been going for more than 3 hours.
// Runs without a date are never treated as past.
export function isPastRun(startsAt) {
  if (!startsAt) return false;
  return new Date(startsAt).getTime() + RUN_LENGTH_MS < Date.now();
}

// ISO timestamp -> value for <input type="datetime-local"> (Nairobi time).
export function toInputValue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("sv-SE", { timeZone: TZ }).replace(" ", "T").slice(0, 16);
}

// Value from <input type="datetime-local"> (read as Nairobi time) -> ISO timestamp.
export function fromInputValue(value) {
  if (!value) return null;
  const d = new Date(`${value}:00+03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// 'weekday' | 'weekend' for a start time, in Nairobi time.
export function dayCatOf(iso) {
  const wd = new Date(iso).toLocaleDateString("en-US", { weekday: "short", timeZone: TZ });
  return wd === "Sat" || wd === "Sun" ? "weekend" : "weekday";
}
