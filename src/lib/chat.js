import { supabase } from "./supabaseClient";

// Per-run chat. Row-level security in 0003_run_chat.sql means only the host
// and people who joined the run can read or write these messages.

export async function fetchMessages(runId) {
  const { data, error } = await supabase
    .from("run_messages")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: true })
    .limit(300);
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(runId, userId, senderName, body) {
  const { data, error } = await supabase
    .from("run_messages")
    .insert({ run_id: runId, user_id: userId, sender_name: senderName, body })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Calls onInsert(message) for every new message in this run's chat.
// Returns a function that stops listening.
export function subscribeToMessages(runId, onInsert) {
  const channel = supabase
    .channel(`run-chat-${runId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "run_messages", filter: `run_id=eq.${runId}` },
      (payload) => onInsert(payload.new)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
