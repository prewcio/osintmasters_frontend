"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { FastForward, Pause, Play, Rewind, Volume2, VolumeX, Maximize, Minimize, Shield, Cpu } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  src: string
  poster?: string
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100)
      setCurrentTime(video.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleWaiting = () => setIsBuffering(true)
    const handlePlaying = () => setIsBuffering(false)

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("playing", handlePlaying)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("playing", handlePlaying)
    }
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          togglePlay()
          break
        case "m":
          toggleMute()
          break
        case "f":
          toggleFullscreen()
          break
        case "arrowleft":
          skip(-10)
          break
        case "arrowright":
          skip(10)
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const width = bounds.width
    const percentage = (x / width) * 100
    if (videoRef.current) {
      videoRef.current.currentTime = (percentage / 100) * duration
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      {/* Scanlines Effect */}
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-5" />

      {/* Video Element */}
      <video ref={videoRef} className="h-full w-full" poster={poster} onClick={togglePlay}>
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Cyber Frame */}
      <div className="absolute inset-0 pointer-events-none border border-[#0f0]/30">
        <div className="absolute top-0 left-0 border-t-2 border-l-2 border-[#0f0] w-8 h-8" />
        <div className="absolute top-0 right-0 border-t-2 border-r-2 border-[#0f0] w-8 h-8" />
        <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-[#0f0] w-8 h-8" />
        <div className="absolute bottom-0 right-0 border-b-2 border-r-2 border-[#0f0] w-8 h-8" />
      </div>

      {/* Status Overlay */}
      <div className="absolute top-4 right-4 flex items-center gap-4 text-xs font-mono text-[#0f0]/80">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="animate-pulse">SECURE_STREAM</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          <span>{isBuffering ? "BUFFERING..." : "STREAM_ACTIVE"}</span>
        </div>
      </div>

      {/* Play/Pause Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
          "bg-black/20 opacity-0 group-hover:opacity-100",
        )}
      >
        <button
          onClick={togglePlay}
          className="rounded-full bg-[#0f0]/20 p-6 backdrop-blur-sm transition-transform hover:scale-110 border border-[#0f0]/50 hover:border-[#0f0]"
        >
          {isPlaying ? <Pause className="h-8 w-8 text-[#0f0]" /> : <Play className="h-8 w-8 text-[#0f0]" />}
        </button>
      </div>

      {/* Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col gap-2 pb-2 pt-20",
          "bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100",
        )}
      >
        {/* Progress Bar */}
        <div className="relative mx-4 h-1 cursor-pointer" onClick={handleProgressClick}>
          <div className="absolute h-full w-full rounded-full bg-[#0f0]/20" />
          <div
            className="absolute h-full rounded-full bg-[#0f0] transition-all duration-100"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute -right-2 -top-1.5 h-4 w-4 rounded-full border-2 border-[#0f0] bg-black" />
          </div>
        </div>

        {/* Control Bar */}
        <div className="flex items-center gap-4 px-4 font-mono">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="rounded-lg p-1.5 transition-colors hover:bg-[#0f0]/10">
            {isPlaying ? <Pause className="h-5 w-5 text-[#0f0]" /> : <Play className="h-5 w-5 text-[#0f0]" />}
          </button>

          {/* Rewind/Forward */}
          <button onClick={() => skip(-10)} className="rounded-lg p-1.5 transition-colors hover:bg-[#0f0]/10">
            <Rewind className="h-5 w-5 text-[#0f0]" />
          </button>
          <button onClick={() => skip(10)} className="rounded-lg p-1.5 transition-colors hover:bg-[#0f0]/10">
            <FastForward className="h-5 w-5 text-[#0f0]" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="rounded-lg p-1.5 transition-colors hover:bg-[#0f0]/10">
              {isMuted ? <VolumeX className="h-5 w-5 text-[#0f0]" /> : <Volume2 className="h-5 w-5 text-[#0f0]" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-[#0f0]/20"
              style={{
                backgroundImage: `linear-gradient(to right, #0f0 ${
                  (isMuted ? 0 : volume) * 100
                }%, rgba(0,255,0,0.2) ${(isMuted ? 0 : volume) * 100}%)`,
              }}
            />
          </div>

          {/* Time */}
          <div className="ml-auto text-sm text-[#0f0]">
            <span className="opacity-90">{formatTime(currentTime)}</span>
            <span className="mx-1 opacity-60">/</span>
            <span className="opacity-60">{formatTime(duration)}</span>
          </div>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="rounded-lg p-1.5 transition-colors hover:bg-[#0f0]/10">
            {isFullscreen ? <Minimize className="h-5 w-5 text-[#0f0]" /> : <Maximize className="h-5 w-5 text-[#0f0]" />}
          </button>
        </div>
      </div>
    </div>
  )
}

