"use client";

import { useSupabaseUser } from "./lib/useSupabaseUser";

export default function HomePage() {
  const { user, loading } = useSupabaseUser();

  if (loading) return <div>Loading...</div>;

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Home</h1>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </main>
  );
}
