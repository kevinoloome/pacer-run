import { supabase } from "./supabaseClient";
import { formatPace } from "./pace";
import { formatWhen, isPastRun } from "./when";

// Maps a raw Supabase `runs` row (snake_case, matching schema.sql plus
// 0002_auth_and_joins.sql) into the camelCase shape the components expect.
//
// `run_joins` comes back as an embedded aggregate (`run_joins(count)` in the
// select below), so `row.run_joins` is `[{ count: N }]`. The four seed runs
// from schema.sql also carry a legacy `joined` text[] (initials, no real
// accounts behind them), so joinedCount adds both together rather than
// picking one, that way the seed rows still look populated while real joins
// count correctly on top. Identical logic to pacer-native's runs.js, since
// both apps read from the same Supabase project and tables.
function mapRun(row, myJoinedRunIds) {
  const realJoinedCount = row.run_joins?.[0]?.count ?? 0;
  const legacyJoined = row.joined ?? [];

  return {
    id: row.id,
    location: row.location,
    city: row.city ?? "Nairobi, Kenya",
    tz: row.tz ?? "Africa/Nairobi",
    when: row.starts_at ? formatWhen(row.starts_at, row.tz ?? "Africa/Nairobi") : row.when_text,
    startsAt: row.starts_at ?? null,
    cancelled: !!row.cancelled_at,
    isPast: isPastRun(row.starts_at),
    distance: `${row.distance_km} km`,
    distanceKm: row.distance_km,
    surface: row.surface,
    dayCat: row.day_cat,
    pace: `${formatPace(row.pace_sec)} /km`,
    paceMinSec: row.pace_sec,
    weather: { icon: row.weather_icon, temp: row.weather_temp, rain: row.weather_rain },
    note: row.note,
    host: row.host_name,
    hostVerified: row.host_verified,
    hostMeta: row.host_meta,
    hostPhoto: row.host_photo,
    hostId: row.host_id,
    capacity: row.capacity,
    joinedInitials: legacyJoined,
    joinedCount: legacyJoined.length + realJoinedCount,
    isJoinedByMe: myJoinedRunIds.has(row.id),
  };
}

// Fetches every run plus how many real (post-launch) joins each has, and,
// when signed in, which of those the current user has already joined.
// `userId` is optional: Discover works the same for signed-out visitors,
// just without the "you're in" state.
export async function fetchRuns(userId) {
  const { data, error } = await supabase
    .from("runs")
    .select("*, run_joins(count)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  let myJoinedRunIds = new Set();
  if (userId) {
    const { data: myJoins, error: joinsError } = await supabase
      .from("run_joins")
      .select("run_id")
      .eq("user_id", userId);
    if (joinsError) throw joinsError;
    myJoinedRunIds = new Set((myJoins ?? []).map((r) => r.run_id));
  }

  return data.map((row) => mapRun(row, myJoinedRunIds));
}

// Result shapes for joinRun, so callers can tell "joined", "already joined"
// (not an error, just a no-op) and "full" apart from a real failure.
export const JOIN_RESULT = {
  JOINED: "joined",
  ALREADY_JOINED: "already_joined",
  FULL: "full",
  CLOSED: "closed", // cancelled, or already started
};

// Joins a run on behalf of the signed-in user. Capacity is checked
// client-side first using the count already loaded for this run (for an
// instant "this run is full" message), and enforced again by a database
// trigger that catches the race where two people join the last spot at the
// same instant.
export async function joinRun(run, userId) {
  if (run.isJoinedByMe) return JOIN_RESULT.ALREADY_JOINED;
  if (run.cancelled || run.isPast) return JOIN_RESULT.CLOSED;
  if (run.joinedCount >= run.capacity) return JOIN_RESULT.FULL;

  const { error } = await supabase
    .from("run_joins")
    .insert({ run_id: run.id, user_id: userId });

  if (error) {
    // 23505 = unique_violation (Postgres code): already joined, treat as success.
    if (error.code === "23505") return JOIN_RESULT.ALREADY_JOINED;
    // P0001 with message "run_full": the database's own capacity trigger
    // caught a race the client-side check above missed.
    if (/run_cancelled/.test(error.message ?? "")) return JOIN_RESULT.CLOSED;
    if (error.code === "P0001" || /run_full/.test(error.message ?? "")) {
      return JOIN_RESULT.FULL;
    }
    throw error;
  }
  return JOIN_RESULT.JOINED;
}

export async function leaveRun(runId, userId) {
  const { error } = await supabase
    .from("run_joins")
    .delete()
    .eq("run_id", runId)
    .eq("user_id", userId);
  if (error) throw error;
}

// Inserts a new run, hosted by the signed-in user. `input` uses the same
// camelCase shape the rest of the app reads, mapped to the snake_case
// columns schema.sql defines.
export async function postRun(input, userId, hostName) {
  const { data, error } = await supabase
    .from("runs")
    .insert({
      location: input.location,
      city: input.city,
      tz: input.tz,
      when_text: formatWhen(input.startsAt, input.tz),
      starts_at: input.startsAt,
      distance_km: input.distanceKm,
      surface: input.surface,
      day_cat: input.dayCat,
      pace_sec: input.paceSec,
      note: input.note || null,
      capacity: input.capacity,
      host_id: userId,
      host_name: hostName,
      host_verified: false,
      host_photo: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMyProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(userId, fields) {
  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId);
  if (error) throw error;
}

// Runs the signed-in user is hosting or has joined, newest first.
export async function fetchMyRuns(userId) {
  const { data: joins, error: joinsError } = await supabase
    .from("run_joins")
    .select("run_id")
    .eq("user_id", userId);
  if (joinsError) throw joinsError;

  const joinedIds = (joins ?? []).map((j) => j.run_id);
  let query = supabase.from("runs").select("*, run_joins(count)");
  query = joinedIds.length
    ? query.or(`host_id.eq.${userId},id.in.(${joinedIds.join(",")})`)
    : query.eq("host_id", userId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  const joinedSet = new Set(joinedIds);
  return data.map((row) => mapRun(row, joinedSet));
}

// One run by id, or null if it doesn't exist.
export async function fetchRun(runId, userId) {
  const { data, error } = await supabase
    .from("runs")
    .select("*, run_joins(count)")
    .eq("id", runId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  let joinedSet = new Set();
  if (userId) {
    const { data: mine, error: mineError } = await supabase
      .from("run_joins")
      .select("run_id")
      .eq("run_id", runId)
      .eq("user_id", userId);
    if (mineError) throw mineError;
    joinedSet = new Set((mine ?? []).map((r) => r.run_id));
  }
  return mapRun(data, joinedSet);
}

// Names of the signed-up people who joined a run, earliest first.
export async function fetchParticipants(runId) {
  const { data: joins, error } = await supabase
    .from("run_joins")
    .select("user_id, joined_at")
    .eq("run_id", runId)
    .order("joined_at", { ascending: true });
  if (error) throw error;

  const ids = (joins ?? []).map((j) => j.user_id);
  if (ids.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", ids);
  if (profilesError) throw profilesError;

  const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  return ids.map((id) => ({ id, name: names.get(id) || "Runner" }));
}

// Host edits their own run. `input` has the same shape as for postRun.
export async function updateRun(runId, userId, input) {
  const { error } = await supabase
    .from("runs")
    .update({
      location: input.location,
      city: input.city,
      tz: input.tz,
      when_text: formatWhen(input.startsAt, input.tz),
      starts_at: input.startsAt,
      distance_km: input.distanceKm,
      surface: input.surface,
      day_cat: input.dayCat,
      pace_sec: input.paceSec,
      note: input.note || null,
      capacity: input.capacity,
    })
    .eq("id", runId)
    .eq("host_id", userId);
  if (error) throw error;
}

// Host cancels their own run. The run disappears from Discover and can't be joined.
export async function cancelRun(runId, userId) {
  const { error } = await supabase
    .from("runs")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", runId)
    .eq("host_id", userId);
  if (error) throw error;
}
