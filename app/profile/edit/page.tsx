"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { ArrowLeft, Camera, ImagePlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("users")
      .select("avatar_url, banner_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setAvatarUrl(data?.avatar_url ?? null);
        setBannerUrl(data?.banner_url ?? null);
        setFetching(false);
      });
  }, [user]);

  if (!loading && !user) {
    router.replace("/login");
    return null;
  }

  async function uploadImage(
    file: File,
    type: "avatar" | "banner"
  ): Promise<string | null> {
    if (!user) return null;

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${type}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("画像のアップロードに失敗しました");
      console.error(uploadError);
      return null;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    const url = await uploadImage(file, "avatar");
    if (url) {
      setAvatarUrl(url);
      const { error } = await supabase
        .from("users")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (error) toast.error("プロフィール画像の保存に失敗しました");
      else toast.success("プロフィール画像を更新しました");
    }
    setUploadingAvatar(false);
    e.target.value = "";
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingBanner(true);
    const url = await uploadImage(file, "banner");
    if (url) {
      setBannerUrl(url);
      const { error } = await supabase
        .from("users")
        .update({ banner_url: url })
        .eq("id", user.id);
      if (error) toast.error("背景画像の保存に失敗しました");
      else toast.success("背景画像を更新しました");
    }
    setUploadingBanner(false);
    e.target.value = "";
  }

  return (
    <main className="max-w-md mx-auto px-4 py-6">
      <Link
        href={user ? `/profile/${user.id}` : "/"}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        戻る
      </Link>

      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-violet-600 to-purple-500 px-6 py-5">
          <h1 className="text-xl font-bold text-white">プロフィール編集</h1>
          <p className="text-violet-200 text-sm mt-0.5">プロフィール画像・背景を変更できます</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Banner upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">背景画像</label>
            <div
              className="relative h-28 rounded-xl overflow-hidden bg-linear-to-r from-violet-600 to-purple-500 group cursor-pointer"
              onClick={() => bannerInputRef.current?.click()}
            >
              {bannerUrl && (
                <Image
                  src={bannerUrl}
                  alt="バナー"
                  fill
                  className="object-cover"
                  sizes="448px"
                />
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium">
                {uploadingBanner ? (
                  <span className="text-xs">アップロード中...</span>
                ) : (
                  <>
                    <ImagePlus size={18} />
                    背景画像を変更
                  </>
                )}
              </div>
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerChange}
            />
            <p className="text-xs text-slate-400">推奨サイズ: 1200×300px</p>
          </div>

          {/* Avatar upload */}
          <div className="flex justify-center">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md cursor-pointer group"
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="アバター"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                    {!fetching && (
                      <Camera size={24} className="text-violet-400" />
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={20} className="text-white" />
                </div>
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs">...</span>
                </div>
              )}
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <button
            type="button"
            onClick={() => router.push(user ? `/profile/${user.id}` : "/")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            完了
          </button>
        </div>
      </div>
    </main>
  );
}
