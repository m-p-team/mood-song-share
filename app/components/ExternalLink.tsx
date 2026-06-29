import { ExternalLink as ExternalLinkIcon } from "lucide-react";

type Props = {
  url: string;
};

export default function ExternalLink({ url }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors"
    >
      YouTubeで開く
      <ExternalLinkIcon size={13} strokeWidth={2} />
    </a>
  );
}
