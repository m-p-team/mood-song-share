import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PostRow = {
  id: string;
  mood: string;
  video_id: string;
  video_title: string;
};

type Recommendation = {
  id: string;
  reason: string;
};

const MOOD_EMOJI: Record<string, string> = {
  うれしい: "😊",
  "テンション高め": "😎",
  "落ち着いた": "😌",
  "やる気満々": "💪",
  "恋愛気分": "🥰",
  悲しい: "😢",
  センチメンタル: "😔",
  もやもや: "😤",
  眠い: "😴",
  "祝いたい": "🎉",
  "考え中": "🤔",
  "集中したい": "🔥",
};

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY が設定されていません" },
      { status: 503 }
    );
  }

  const { query } = await req.json();
  if (!query?.trim()) {
    return NextResponse.json({ error: "クエリが必要です" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public" } }
  );

  const { data: posts } = await supabase
    .from("posts")
    .select("id, mood, video_id, video_title")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!posts?.length) {
    return NextResponse.json({
      message: "まだ投稿がありません。",
      recommendations: [],
    });
  }

  const postsContext = posts
    .map(
      (p: PostRow) =>
        `ID:${p.id}|"${p.video_title}"|${MOOD_EMOJI[p.mood] ?? ""}${p.mood}`
    )
    .join("\n");

  const systemPrompt =
    "あなたは音楽SNS「V-Tuune」のAIアシスタントです。ユーザーの気分や状況に合った動画を推薦し、必ずJSONのみで回答してください。";

  const userPrompt = `## 動画リスト
${postsContext}

## ユーザーのリクエスト
「${query}」

以下のJSONを返してください（キーは必ず message と recommendations）:
{
  "message": "ユーザーへの一言メッセージ（2文以内、絵文字OK）",
  "recommendations": [
    {"id": "投稿ID", "reason": "この動画を勧める理由（1文）"}
  ]
}

最大5件まで推薦してください。リスト内のIDのみ使用してください。`;

  const groqRes = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
    }
  );

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}));
    const msg =
      (err as { error?: { message?: string } })?.error?.message ??
      groqRes.statusText;
    return NextResponse.json({ error: `AI エラー: ${msg}` }, { status: groqRes.status });
  }

  const groqData = await groqRes.json();
  const text: string = groqData.choices?.[0]?.message?.content ?? "{}";

  let parsed: { message: string; recommendations: Recommendation[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ message: text, recommendations: [] });
  }

  const validRecs = (parsed.recommendations ?? [])
    .filter((r: Recommendation) => posts.some((p: PostRow) => p.id === r.id))
    .slice(0, 5);

  const enriched = validRecs.map((r: Recommendation) => ({
    ...r,
    post: posts.find((p: PostRow) => p.id === r.id) as PostRow,
  }));

  return NextResponse.json({
    message: parsed.message,
    recommendations: enriched,
  });
}
