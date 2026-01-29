import { getPostById } from "@/app/lib/postService";
import MoodBadge from "@/app/components/MoodBadge";
import ExternalLink from "@/app/components/ExternalLink";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(id);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{post.video_title}</h1>
      <div className="text-sm text-gray-500">
        <MoodBadge mood={post.mood} />
      </div>
      <div className="aspect-video">
        <iframe
          className="w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${post.video_id}`}
          allowFullScreen
        />
      </div>
      <ExternalLink url={post.video_url} />
      <div className="text-xs text-gray-400">
        投稿日: {new Date(post.created_at).toLocaleString()}
      </div>
    </div>
  );
}
