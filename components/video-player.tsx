"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { FastForward, Pause, Play, Rewind, Volume2, VolumeX, Maximize, Minimize, Shield, Cpu } from "lucide-react"
import { cn } from "@/lib/utils"
import AnimatedButton from "./animated-button"

interface VideoPlayerProps {
  src: string
  poster?: string
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
    }

    const handleError = () => {
      setError("Nie udało się załadować wideo")
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("error", handleError)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("error", handleError)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
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
      if (isMuted) {
        videoRef.current.volume = volume
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setIsMuted(newVolume === 0)
    }
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pos * duration
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div 
      className="relative group bg-black rounded-lg overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Scanlines Effect */}
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-5" />

      {/* Video Element */}
      <video
        ref={videoRef}
        className="h-full w-full object-contain bg-black"
        poster={poster}
        onClick={togglePlay}
      >
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
          <span>{isLoading ? "BUFFERING..." : "STREAM_ACTIVE"}</span>
        </div>
      </div>

      {/* Video Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 sm:p-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div 
          ref={progressBarRef}
          className="relative h-1 sm:h-1.5 bg-gray-600 cursor-pointer mb-2 sm:mb-4 rounded-full overflow-hidden"
          onClick={handleProgressBarClick}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-[#39FF14]"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-[#39FF14] transition-colors text-lg sm:text-xl"
            >
              {isPlaying ? "⏸" : "▶"}
            </button>

            {/* Volume Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-[#39FF14] transition-colors text-lg sm:text-xl"
              >
                {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20"
              />
            </div>

            {/* Time Display */}
            <div className="text-white text-xs sm:text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-[#39FF14] transition-colors text-lg sm:text-xl"
          >
            {isFullscreen ? "⤓" : "⤢"}
          </button>
        </div>
      </div>

      {/* Play/Pause Overlay */}
      {!isPlaying && !error && !isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="text-4xl sm:text-6xl text-white hover:text-[#39FF14] transition-colors">
            ▶
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-red-500">{error}</div>
        </div>
      )}
    </div>
  )
}

