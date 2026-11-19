import { supabase } from "./supabaseClient";

// Run stories: short notes from people who were on a run. Needs the 0007 SQL;
// before that has been run, fetchStories just returns an empty list.
export async function fetchStories() {
  try {
    const { data, error } = await supabase
      .from("run_stories")
      .select("id, run_id, user_id, author_name, body, created_at, runs(location, city, when_text)")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    return (data ?? []).map((s) => ({
      id: s.id,
      runId: s.run_id,
      userId: s.user_id,
      author: s.author_name,
      body: s.body,
      createdAt: s.created_at,
      location: s.runs?.location ?? "",
      city: s.runs?.city ?? "",
      when: s.runs?.when_text ?? "",
    }));
  } catch {
    return [];
  }
}

// Returns "ok" | "duplicate" and throws on anything else.
export async function postStory({ userId, runId, authorName, body }) {
  const { error } = await supabase
    .from("run_stories")
    .insert({ user_id: userId, run_id: runId, author_name: authorName, body });
  if (error) {
    if (error.code === "23505") return "duplicate";
    throw error;
  }
  return "ok";
}

export async function deleteStory(id) {
  const { error } = await supabase.from("run_stories").delete().eq("id", id);
  if (error) throw error;
}

export async function reportStory({ reporterId, story }) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    run_id: story.runId,
    reported_user_id: story.userId,
    reason: "Story",
    details: `story:${story.id}`,
  });
  if (error) throw error;
}

// Groups stories by author, most recent author first.
export function groupByAuthor(stories) {
  const map = new Map();
  for (const s of stories) {
    if (!map.has(s.userId)) map.set(s.userId, { userId: s.userId, author: s.author, stories: [] });
    map.get(s.userId).stories.push(s);
  }
  return [...map.values()];
}
