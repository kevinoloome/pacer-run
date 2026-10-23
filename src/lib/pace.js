// Compares a run's pace against the viewer's comfortable pace range and
// returns a badge describing how good the match is. Mirrors the logic from
// the original prototype.

export function matchBadge(runPaceSec, paceRange) {
  const { min, max } = paceRange;
  if (runPaceSec >= min && runPaceSec <= max) {
    return { text: "Great pace match", cls: "great" };
  }
  if (runPaceSec < min) {
    return { text: "Faster than your pace", cls: "fast" };
  }
  return { text: "Easier than your pace", cls: "easy" };
}

export function formatPace(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Parses a "m:ss" pace string (e.g. "5:30") typed into the Post a Run or
// Profile forms into total seconds per km. Returns null for anything that
// doesn't look like a valid pace, so the form can show an inline error
// instead of silently saving garbage. Identical to pacer-native's version.
export function parsePace(text) {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(text.trim());
  if (!match) return null;
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const total = minutes * 60 + seconds;
  if (total <= 0) return null;
  return total;
}
