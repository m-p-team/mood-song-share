"use client";

type Props = {
  url: string;
};

export default function ExternalLink({ url }: Props) {
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        window.open(url, "_blank");
      }}
      className="text-blue-500 underline cursor-pointer"
    >
      YouTubeで開く
    </span>
  );
}
