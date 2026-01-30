import { getPostById } from "@/app/lib/postService";
import MoodBadge from "@/app/components/MoodBadge";
import ExternalLink from "@/app/components/ExternalLink";
import Player from "@/app/components/Player";
import Image from "next/image";

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
      <div className="aspect-video rounded-full">
        <Image
          src={`https://img.youtube.com/vi/${post.video_id}/maxresdefault.jpg`}
          alt="thumbnail"
          width={800}
          height={450}
        />
      </div>
      <Player videoId={`${post.video_id}`} />;
      <ExternalLink url={post.video_url} />
      <div className="text-xs text-gray-400">
        投稿日: {new Date(post.created_at).toLocaleString()}
      </div>
    </div>
  );
}
