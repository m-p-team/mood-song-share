"use client";

type Props = {
  mood: string;
};

export default function MoodBadge({ mood }: Props) {
  return (
    <span
      onClick={() => alert(`mood: ${mood}`)}
      className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-pointer"
    >
      #{mood}
    </span>
  );
}
