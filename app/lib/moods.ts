export const MOODS = [
  { emoji: "😊", label: "うれしい",       color: "bg-amber-100 text-amber-700 border-amber-200",   gradient: "linear-gradient(135deg, #f59e0b, #f97316)", iconColor: "#f59e0b" },
  { emoji: "😎", label: "テンション高め", color: "bg-orange-100 text-orange-700 border-orange-200", gradient: "linear-gradient(135deg, #f97316, #ef4444)", iconColor: "#f97316" },
  { emoji: "😌", label: "落ち着いた",     color: "bg-teal-100 text-teal-700 border-teal-200",       gradient: "linear-gradient(135deg, #0d9488, #06b6d4)", iconColor: "#0d9488" },
  { emoji: "💪", label: "やる気満々",     color: "bg-green-100 text-green-700 border-green-200",    gradient: "linear-gradient(135deg, #16a34a, #10b981)", iconColor: "#16a34a" },
  { emoji: "🥰", label: "恋愛気分",       color: "bg-pink-100 text-pink-700 border-pink-200",       gradient: "linear-gradient(135deg, #ec4899, #f43f5e)", iconColor: "#ec4899" },
  { emoji: "😢", label: "悲しい",         color: "bg-blue-100 text-blue-700 border-blue-200",       gradient: "linear-gradient(135deg, #3b82f6, #6366f1)", iconColor: "#3b82f6" },
  { emoji: "😔", label: "センチメンタル", color: "bg-purple-100 text-purple-700 border-purple-200", gradient: "linear-gradient(135deg, #9333ea, #7c3aed)", iconColor: "#9333ea" },
  { emoji: "😤", label: "もやもや",       color: "bg-gray-100 text-gray-600 border-gray-200",       gradient: "linear-gradient(135deg, #64748b, #94a3b8)", iconColor: "#64748b" },
  { emoji: "😴", label: "眠い",           color: "bg-indigo-100 text-indigo-700 border-indigo-200", gradient: "linear-gradient(135deg, #4338ca, #6366f1)", iconColor: "#4338ca" },
  { emoji: "🎉", label: "祝いたい",       color: "bg-yellow-100 text-yellow-700 border-yellow-200", gradient: "linear-gradient(135deg, #eab308, #f59e0b)", iconColor: "#eab308" },
  { emoji: "🤔", label: "考え中",         color: "bg-violet-100 text-violet-700 border-violet-200", gradient: "linear-gradient(135deg, #7c3aed, #a855f7)", iconColor: "#7c3aed" },
  { emoji: "🔥", label: "集中したい",     color: "bg-red-100 text-red-700 border-red-200",          gradient: "linear-gradient(135deg, #ef4444, #f97316)", iconColor: "#ef4444" },
] as const;

export type MoodLabel = (typeof MOODS)[number]["label"];

export function getMoodStyle(label: string): string {
  return MOODS.find((m) => m.label === label)?.color ?? "bg-violet-100 text-violet-700 border-violet-200";
}

export function getMoodEmoji(label: string): string {
  return MOODS.find((m) => m.label === label)?.emoji ?? "🎵";
}

export function getMoodPlayerGradient(label: string): string {
  return MOODS.find((m) => m.label === label)?.gradient ?? "linear-gradient(135deg, #7c3aed, #9333ea)";
}

export function getMoodPlayerIconColor(label: string): string {
  return MOODS.find((m) => m.label === label)?.iconColor ?? "#7c3aed";
}

export function parseMoods(mood: string): string[] {
  return mood ? mood.split(",").filter(Boolean) : [];
}

export function serializeMoods(moods: string[]): string {
  return moods.join(",");
}
