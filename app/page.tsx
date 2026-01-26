import { supabase } from "./lib/supabaseClient";

export default async function Page() {
  const { data, error } = await supabase.from("posts").select("*").limit(1);

  return (
    <main className="p-4">
      <h1>Supabase 接続テスト</h1>
      <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
    </main>
  );
}
