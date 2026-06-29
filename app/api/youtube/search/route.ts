import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query?.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const apiKey =
    process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("key", apiKey);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(url.toString(), {
    headers: {
      // APIキーにHTTP参照元制限がある場合に対応
      Referer: siteUrl,
      Origin: siteUrl,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const message: string = data.error?.message ?? "YouTube API error";
    const isBlocked =
      message.includes("blocked") || message.includes("PERMISSION_DENIED");

    return NextResponse.json(
      {
        error: isBlocked
          ? "YouTube Data API v3 が無効またはAPIキーに制限があります。Google Cloud Console で「YouTube Data API v3」が有効になっているか、APIキーの制限を確認してください。"
          : message,
      },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
