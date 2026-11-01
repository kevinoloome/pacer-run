import { supabase } from "./supabaseClient";

export async function sendFeedback({ userId, message, contact, page }) {
  const { error } = await supabase.from("feedback").insert({
    user_id: userId,
    message,
    contact: contact || null,
    page: page || null,
  });
  if (error) throw error;
}

export const REPORT_REASONS = [
  "Unsafe or suspicious",
  "Fake or spam",
  "Inappropriate",
  "Something else",
];

export async function reportRun({ reporterId, run, reason, details }) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    run_id: run.id,
    reported_user_id: run.hostId ?? null,
    reason,
    details: details || null,
  });
  if (error) throw error;
}

// People this user has blocked. Returns an empty set if anything goes wrong
// (for example before the 0006 SQL has been run), so Discover keeps working.
export async function fetchBlockedIds(userId) {
  try {
    const { data, error } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", userId);
    if (error) throw error;
    return new Set((data ?? []).map((r) => r.blocked_id));
  } catch {
    return new Set();
  }
}

export async function blockUser(blockerId, blockedId) {
  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  // 23505 = already blocked
  if (error && error.code !== "23505") throw error;
}

export async function unblockUser(blockerId, blockedId) {
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}

export async function fetchBlockedPeople(userId) {
  const ids = [...(await fetchBlockedIds(userId))];
  if (ids.length === 0) return [];
  const { data } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  const names = new Map((data ?? []).map((p) => [p.id, p.display_name]));
  return ids.map((id) => ({ id, name: names.get(id) || "Runner" }));
}
