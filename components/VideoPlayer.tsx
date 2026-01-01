"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  signedUrl?: string;
  submissionId?: number;
  onClose?: () => void;
  studentName?: string;
}

export default function VideoPlayer({ signedUrl, submissionId, onClose, studentName }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");

  // Get video URL from API
  useEffect(() => {
    if (submissionId && !signedUrl) {
      // Fetch video URL from API
      fetch(`/api/video/signed-url?submissionId=${submissionId}&type=original`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.signedUrl) {
            setVideoUrl(data.signedUrl);
          } else {
            setError(data.error || "Failed to load video URL");
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Error fetching video URL:", err);
          setError("Failed to load video");
          setLoading(false);
        });
    } else if (signedUrl) {
      setVideoUrl(signedUrl);
    }
  }, [submissionId, signedUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setLoading(true);

    // Set video source
    video.src = videoUrl;

    video.addEventListener("loadedmetadata", () => {
      setLoading(false);
      setError("");
    });

    video.addEventListener("canplay", () => {
      setLoading(false);
    });

    video.addEventListener("error", (e) => {
      console.error("Video error:", e);
      setError("Failed to load video. Please check console for details.");
      setLoading(false);
    });

    return () => {
      // Cleanup
      video.src = "";
    };
  }, [videoUrl]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl mx-4 bg-[#0B1A3A] rounded-xl border-2 border-[#D4AF37] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white/5 border-b border-[#D4AF37]/30">
          <div>
            <h3 className="text-lg font-semibold text-white">{studentName ? `Video - ${studentName}` : "Video Player"}</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white hover:text-red-400 transition-colors p-2" aria-label="Close">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Video Container */}
        <div className="relative bg-black aspect-video">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-lg">Loading video...</div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-red-400 text-lg">{error}</div>
            </div>
          )}

          <video ref={videoRef} controls className="w-full h-full" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}>
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Controls */}
        <div className="p-4 bg-white/5 border-t border-[#D4AF37]/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#C7D1E0]">{!loading && !error && <span>{isPlaying ? "Playing" : "Paused"}</span>}</div>
            <button onClick={handlePlayPause} disabled={loading || !!error} className="px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37] text-white rounded hover:bg-[#D4AF37]/30 disabled:opacity-50 disabled:cursor-not-allowed">
              {isPlaying ? "Pause" : "Play"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
