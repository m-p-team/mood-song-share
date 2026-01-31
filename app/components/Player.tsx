"use client";

import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import { Play, Pause } from "lucide-react";

type Props = {
  videoId: string;
};

type YouTubeEvent = {
  target: YT.Player;
  data: number;
};

export default function Player({ videoId }: Props) {
  const playerRef = useRef<YT.Player | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isEnd, setIsEnd] = useState(false);

  // プレイヤー準備完了
  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;

    const interval = setInterval(() => {
      const duration = event.target.getDuration();
      if (duration > 0) {
        setDuration(duration);
        clearInterval(interval);
      }
    }, 200);

    event.target.playVideo();
  };

  const onStateChange = (event: YouTubeEvent) => {
    // 0 = ENDED
    if (event.data === 0) {
      setCurrentTime(duration);
      setIsEnd(true);
      setIsPlaying(false);
    }
    // 1 = PLAYING
    if (event.data === 1) {
      setIsEnd(false);
      setIsPlaying(true);
    }
    // 3 = BUFFERING
    if (event.data === 3) {
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
    playerRef.current?.seekTo(time, true);
  };

  // 秒 → 分:秒 に変換
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${seconds!.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center mt-10 gap-4">
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
      <button
        onClick={togglePlay}
        className="w-20 h-20 rounded-full bg-white text-3xl flex items-center justify-center shadow-xl"
      >
        {isPlaying ? (
          isEnd ? (
            <Play size={32} color="black" />
          ) : (
            <Pause size={32} color="black" />
          )
        ) : (
          <Play size={32} color="black" />
        )}
      </button>

      {/* 再生バー */}
      <input
        type="range"
        min={0}
        max={duration}
        value={currentTime}
        onChange={handleSeek}
        className="w-[300px] accent-gray-300"
      />

      {/* 時間表示 */}
      <div className="w-[300px] flex justify-between text-sm">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
