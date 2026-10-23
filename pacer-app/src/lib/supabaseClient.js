import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Both env vars are required. If either is missing, this throws immediately and
// clearly, rather than silently failing on the first query, so it's obvious during
// setup if .env.local hasn't been filled in yet.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Copy .env.local.example to .env.local and fill in your project URL and anon key from the Supabase dashboard (Settings → API)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
