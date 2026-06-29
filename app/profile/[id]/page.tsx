import { getUserPosts, getUserProfile } from "@/app/lib/postService";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User, Music2, Heart, Play } from "lucide-react";
import MoodBadge from "@/app/components/MoodBadge";
import ProfileEditButton from "@/app/components/ProfileEditButton";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;

  const [profile, posts] = await Promise.all([
    getUserProfile(id),
    getUserPosts(id),
  ]);

  const totalLikes = posts.reduce((sum, p) => sum + (p.like_count ?? 0), 0);
  const displayName = profile?.name ?? "ユーザー";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors"
      >
        <ArrowLeft size={16} />
        戻る
      </Link>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="relative h-32">
          {profile?.banner_url ? (
            <Image
              src={profile.banner_url}
              alt="バナー"
              fill
              className="object-cover"
              sizes="672px"
              priority
            />
          ) : (
            <div className="h-full bg-linear-to-r from-violet-600 to-purple-500" />
          )}
        </div>

        <div className="px-5 pb-5">
          <div className="-mt-10 mb-4 relative z-10">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                  {profile ? (
                    <span className="text-3xl font-bold text-violet-600">{initial}</span>
                  ) : (
                    <User size={32} className="text-violet-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">{displayName}</h1>
              <ProfileEditButton profileUserId={id} />
            </div>
            {profile?.email && (
              <p className="text-sm text-slate-500">{profile.email}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-violet-50">
            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Music2 size={14} className="text-violet-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">{posts.length}</p>
                <p className="text-xs text-slate-500">投稿</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                <Heart size={14} className="text-rose-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">{totalLikes}</p>
                <p className="text-xs text-slate-500">いいね合計</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-700">投稿した曲</h2>

        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-2xl">
              🎵
            </div>
            <p className="text-slate-500 text-sm">まだ投稿がありません</p>
          </div>
        )}

        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="flex gap-3 bg-white border border-violet-100 rounded-2xl p-3 hover:shadow-md hover:border-violet-200 transition-all group"
          >
            <div className="relative w-28 shrink-0 rounded-xl overflow-hidden" style={{ height: "72px" }}>
              <Image
                src={`https://img.youtube.com/vi/${post.video_id}/mqdefault.jpg`}
                alt={post.video_title}
                fill
                className="object-cover"
                sizes="112px"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/20">
                <Play size={18} className="text-white" fill="white" />
              </div>
            </div>
            <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
              <p className="font-medium text-sm text-slate-800 line-clamp-2 leading-snug">
                {post.video_title}
              </p>
              <div className="flex items-center justify-between">
                <MoodBadge mood={post.mood} clickable={false} />
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Heart size={11} className="text-rose-400" fill="currentColor" />
                  <span>{post.like_count ?? 0}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
