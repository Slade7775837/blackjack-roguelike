import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export async function submitScore(data: {
  player_name: string;
  score: number;
  floor_reached: number;
  enemies_defeated: number;
}): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("scores").insert([data]);
  return !error;
}

export async function getLeaderboard(limit = 20) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data || [];
}

// SQL to create the table in Supabase:
// CREATE TABLE scores (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   player_name TEXT NOT NULL,
//   score INTEGER NOT NULL,
//   floor_reached INTEGER NOT NULL DEFAULT 1,
//   enemies_defeated INTEGER NOT NULL DEFAULT 0,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE INDEX ON scores(score DESC);
// ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Allow inserts" ON scores FOR INSERT WITH CHECK (true);
// CREATE POLICY "Allow reads" ON scores FOR SELECT USING (true);
