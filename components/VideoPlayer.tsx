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
      // Auto-play when video can play
      video.play().catch((err) => {
        console.error("Autoplay prevented:", err);
        // Autoplay might be blocked by browser, that's okay
      });
    });

    video.addEventListener("play", () => {
      setIsPlaying(true);
    });

    video.addEventListener("pause", () => {
      setIsPlaying(false);
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

  // If onClose is provided, render as modal. Otherwise, render inline.
  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="relative w-[800px] h-[600px] bg-white rounded-xl border-2 border-gray-200 shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{studentName ? `Video - ${studentName}` : "Video Player"}</h3>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Video Container - Fixed height */}
          <div className="relative bg-black flex-1 flex items-center justify-center" style={{ height: "500px" }}>
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-red-400 text-sm">{error}</div>
              </div>
            )}

            <video ref={videoRef} controls autoPlay className="w-full h-full object-contain" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}>
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Controls */}
          {!error && (
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">{isPlaying ? "Playing" : "Paused"}</div>
                <button onClick={handlePlayPause} disabled={!!error} className="px-4 py-1.5 bg-[#072F6B] hover:bg-[#0B1A3A] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {isPlaying ? "Pause" : "Play"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Inline video player (for dedicated page)
  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-white text-lg">Loading video...</div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-red-400 text-lg">{error}</div>
        </div>
      )}

      <video ref={videoRef} controls className="w-full h-full rounded-lg" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}>
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
