export const dynamic = "force-dynamic";

import { getUserPosts, getUserProfile, getFollowCounts } from "@/app/lib/postService";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User } from "lucide-react";
import ProfileEditButton from "@/app/components/ProfileEditButton";
import ProfileInteractive from "@/app/components/ProfileInteractive";
import PlaylistSection from "@/app/components/PlaylistSection";
import ProfilePostsClient from "@/app/components/ProfilePostsClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;

  const [profile, posts, followCounts] = await Promise.all([
    getUserProfile(id),
    getUserPosts(id),
    getFollowCounts(id),
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
          {/* Avatar — pulled up over banner, no button here */}
          <div className="-mt-10 mb-3 relative z-10">
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

          {/* Name + edit button */}
          <div className="space-y-0.5 mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">{displayName}</h1>
              <ProfileEditButton profileUserId={id} />
            </div>
            {profile?.email && (
              <p className="text-sm text-slate-500">{profile.email}</p>
            )}
          </div>

          {/* Follow button, DM, stats — client component */}
          <ProfileInteractive
            targetUserId={id}
            postCount={posts.length}
            totalLikes={totalLikes}
            followerCount={followCounts.followers}
            followingCount={followCounts.following}
          />
        </div>
      </div>

      {/* Playlists */}
      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-5">
        <PlaylistSection profileUserId={id} />
      </div>

      {/* Posts */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-700">投稿した曲</h2>
        <ProfilePostsClient posts={posts} profileUserId={id} />
      </div>
    </main>
  );
}
