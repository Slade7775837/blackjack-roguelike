import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ configured: false, scores: [] });
  }

  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, scores: data || [] });
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ ok: false, message: "Leaderboard not configured" });
  }

  const body = await req.json();
  const { player_name, score, floor_reached, enemies_defeated } = body;

  if (!player_name || typeof score !== "number") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { error } = await supabase.from("scores").insert([
    {
      player_name: player_name.slice(0, 30),
      score: Math.max(0, Math.floor(score)),
      floor_reached: Math.min(3, Math.max(1, floor_reached)),
      enemies_defeated: Math.max(0, enemies_defeated),
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
