"use client";

import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { getMoodPlayerGradient, getMoodPlayerIconColor, parseMoods } from "@/app/lib/moods";

type Props = {
  videoId: string;
  mood?: string;
};

type YouTubeEvent = {
  target: YT.Player;
  data: number;
};

export default function Player({ videoId, mood }: Props) {
  const playerRef = useRef<YT.Player | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isEnd, setIsEnd] = useState(false);
  const [volume, setVolume] = useState(80);

  const firstMood = parseMoods(mood ?? "")[0] ?? "";
  const gradient = getMoodPlayerGradient(firstMood);
  const iconColor = getMoodPlayerIconColor(firstMood);

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    event.target.setVolume(80);

    const interval = setInterval(() => {
      const d = event.target.getDuration();
      if (d > 0) {
        setDuration(d);
        clearInterval(interval);
      }
    }, 200);

    event.target.playVideo();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume(v);
  };

  const onStateChange = (event: YouTubeEvent) => {
    if (event.data === 0) {
      setCurrentTime(duration);
      setIsEnd(true);
      setIsPlaying(false);
    }
    if (event.data === 1) {
      setIsEnd(false);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isEnd) {
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
      setIsEnd(false);
      setCurrentTime(0);
      return;
    }

    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    playerRef.current?.seekTo(time, true);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="rounded-2xl p-6 space-y-5 shadow-lg transition-all duration-700"
      style={{ background: gradient }}
    >
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

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="relative h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-white rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs text-white/70 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Play button */}
      <div className="flex items-center justify-center">
        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
          aria-label={isPlaying ? "一時停止" : "再生"}
        >
          {isEnd ? (
            <RotateCcw size={24} style={{ color: iconColor }} />
          ) : isPlaying ? (
            <Pause size={26} style={{ color: iconColor }} fill={iconColor} />
          ) : (
            <Play size={26} style={{ color: iconColor }} fill={iconColor} className="ml-1" />
          )}
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3">
        {volume === 0 ? (
          <VolumeX size={16} className="text-white/70 shrink-0" />
        ) : (
          <Volume2 size={16} className="text-white/70 shrink-0" />
        )}
        <div className="relative flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-white rounded-full"
            style={{ width: `${volume}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={handleVolumeChange}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            aria-label="音量"
          />
        </div>
        <span className="text-xs text-white/60 tabular-nums w-6 text-right">{volume}</span>
      </div>
    </div>
  );
}
