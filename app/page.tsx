export const dynamic = "force-dynamic";

import { getPosts } from "@/app/lib/postService";
import HomePageClient from "@/app/components/HomePageClient";

export default async function HomePage() {
  const posts = await getPosts();
  return <HomePageClient posts={posts} />;
}
