import Link from "next/link";
import { getMoodStyle, getMoodEmoji } from "@/app/lib/moods";

type Props = {
  mood: string;
  clickable?: boolean;
};

export default function MoodBadge({ mood, clickable = true }: Props) {
  const colorClass = getMoodStyle(mood);
  const emoji = getMoodEmoji(mood);

  const inner = (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${colorClass} transition-opacity`}
    >
      <span>{emoji}</span>
      <span>{mood}</span>
    </span>
  );

  if (!clickable) return inner;

  return (
    <Link
      href={`/search?mood=${encodeURIComponent(mood)}`}
      className="hover:opacity-80 transition-opacity"
    >
      {inner}
    </Link>
  );
}
