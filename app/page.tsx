import { supabase } from "./lib/supabaseClient";

export default async function HomePage() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return <pre>{JSON.stringify(error, null, 2)}</pre>;
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">投稿一覧</h1>

      {posts?.map((post) => (
        <div key={post.id} className="border rounded p-4 space-y-1">
          <div>🎵 {post.video_title}</div>
          <div>😊 気分： {post.mood}</div>
          <div className="text-xs text-gray-500">
            {new Date(post.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </main>
  );
}
