"use client";

import { useEffect, useRef, useState } from "react";
import YouTube, { YouTubeEvent } from "react-youtube";
import type { YouTubePlayer } from "react-youtube";

type Props = {
  videoId: string;
};

export default function Player({ videoId }: Props) {
  const playerRef = useRef<YouTubePlayer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // プレイヤー準備完了
  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const onStateChange = (event: YouTubeEvent) => {
    // 1 = PLAYING
    if (event.data === 1) {
      const duration = event.target.getDuration();
      setDuration(duration);
    }
  };

  // 再生時間を0.5秒ごとに更新
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // ▶ 再生 / ⏸ 停止
  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  // バーを動かしたとき
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    playerRef.current?.seekTo(time);
  };

  return (
    <div style={styles.container}>
      <YouTube
        videoId={videoId}
        onReady={onReady}
        onStateChange={onStateChange}
        opts={{
          height: "0",
          width: "0",
          playerVars: { controls: 0 },
        }}
      />

      {/* 再生ボタン */}
      <button onClick={togglePlay} style={styles.button}>
        {isPlaying ? "⏸" : "▶"}
      </button>

      {/* 再生バー */}
      <input
        type="range"
        min={0}
        max={duration}
        value={currentTime}
        onChange={handleSeek}
        style={styles.slider}
      />

      {/* 時間表示 */}
      <div style={styles.time}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

// 秒 → 分:秒 に変換
function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "40px",
    gap: "16px",
  },
  button: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    border: "none",
    fontSize: "32px",
    background: "white",
    cursor: "pointer",
  },
  slider: {
    width: "300px",
  },
  time: {
    width: "300px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  },
};
