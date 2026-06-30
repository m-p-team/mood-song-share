"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, BellOff, Monitor, Heart, Save } from "lucide-react";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { useNotifications } from "@/app/lib/useNotifications";
import {
  getNotificationSettings,
  upsertNotificationSettings,
  type NotificationSettings,
} from "@/app/lib/postService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const SETTINGS_KEY = "v_tuune_notif_settings";

const defaultSettings: Omit<NotificationSettings, "user_id"> = {
  likes_enabled: true,
  desktop_enabled: false,
};

type ToggleRowProps = {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
};

function ToggleRow({ icon, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-4 py-4 cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? "bg-violet-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

export default function NotificationSettingsPage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const router = useRouter();
  const { updateSettingsCache } = useNotifications(user?.id ?? null);

  const [settings, setSettings] = useState<Omit<NotificationSettings, "user_id">>(defaultSettings);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setDesktopPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    getNotificationSettings(user.id).then((data) => {
      if (data) {
        setSettings({
          likes_enabled: data.likes_enabled,
          desktop_enabled: data.desktop_enabled,
        });
      }
      setFetching(false);
    });
  }, [user]);

  const update = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const requestDesktopPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("このブラウザはデスクトップ通知をサポートしていません");
      return;
    }
    const permission = await Notification.requestPermission();
    setDesktopPermission(permission);
    if (permission === "granted") {
      update("desktop_enabled", true);
      toast.success("デスクトップ通知を許可しました");
    } else {
      update("desktop_enabled", false);
      toast.error("デスクトップ通知が拒否されました。ブラウザの設定から許可してください。");
    }
  };

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      await upsertNotificationSettings(user.id, settings);
      const full: NotificationSettings = { user_id: user.id, ...settings };
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(full)); } catch {}
      updateSettingsCache(full);
      toast.success("通知設定を保存しました");
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-6 space-y-5">
      <Link
        href="/notifications"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors"
      >
        <ArrowLeft size={16} />
        通知一覧へ
      </Link>

      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-violet-600 to-purple-500 px-6 py-5">
          <h1 className="text-xl font-bold text-white">通知設定</h1>
          <p className="text-violet-200 text-sm mt-0.5">受け取る通知の種類を設定します</p>
        </div>

        <div className="px-6 divide-y divide-slate-100">
          <div className="py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">通知の種類</p>
          </div>

          <ToggleRow
            icon={<Heart size={16} className="text-rose-500" />}
            label="いいね"
            description="自分の投稿にいいねされたとき"
            checked={settings.likes_enabled}
            onChange={(v) => update("likes_enabled", v)}
          />

          {/* Desktop notifications */}
          <div className="py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">デスクトップ通知</p>
          </div>

          <div className="py-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Monitor size={16} className="text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">ブラウザ通知</p>
                <p className="text-xs text-slate-500">
                  {desktopPermission === "granted"
                    ? "通知が許可されています"
                    : desktopPermission === "denied"
                    ? "通知がブロックされています（ブラウザ設定から変更）"
                    : "通知の許可が必要です"}
                </p>
              </div>
              {desktopPermission === "granted" ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.desktop_enabled}
                  onClick={() => update("desktop_enabled", !settings.desktop_enabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    settings.desktop_enabled ? "bg-violet-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings.desktop_enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              ) : (
                <button
                  onClick={requestDesktopPermission}
                  disabled={desktopPermission === "denied"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {desktopPermission === "denied" ? (
                    <><BellOff size={12} /> ブロック中</>
                  ) : (
                    <><Bell size={12} /> 許可する</>
                  )}
                </button>
              )}
            </div>

            {settings.desktop_enabled && desktopPermission === "granted" && (
              <p className="text-xs text-slate-400 pl-12">
                いいね通知のみデスクトップ通知が届きます
              </p>
            )}
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-white bg-linear-to-r from-violet-600 to-purple-500 disabled:opacity-50 hover:opacity-90 transition-all shadow-sm"
          >
            <Save size={16} />
            {saving ? "保存中..." : "設定を保存する"}
          </button>
        </div>
      </div>
    </main>
  );
}
