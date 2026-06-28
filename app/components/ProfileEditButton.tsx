"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";

type Props = {
  profileUserId: string;
};

export default function ProfileEditButton({ profileUserId }: Props) {
  const { user, loading } = useSupabaseUser();

  if (loading || user?.id !== profileUserId) return null;

  return (
    <Link
      href="/profile/edit"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-violet-200 text-violet-600 hover:bg-violet-50 transition-all"
    >
      <Pencil size={12} />
      編集
    </Link>
  );
}
