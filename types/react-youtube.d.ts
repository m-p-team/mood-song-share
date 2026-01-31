declare module "react-youtube" {
  import * as React from "react";

  export type YouTubeEvent = {
    target: YT.Player;
    data: number;
  };

  export interface YouTubeProps {
    videoId?: string;
    opts?: YT.PlayerOptions;
    onReady?: (event: YouTubeEvent) => void;
    onStateChange?: (event: YouTubeEvent) => void;
    onPlay?: (event: YouTubeEvent) => void;
    onPause?: (event: YouTubeEvent) => void;
    onEnd?: (event: YouTubeEvent) => void;
  }

  const YouTube: React.FC<YouTubeProps>;
  export default YouTube;
}
