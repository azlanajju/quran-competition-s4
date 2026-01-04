"use client";

import { useEffect, useRef, useState } from "react";

interface VideoUploadProps {
  onVideoSelect: (file: File | null) => void;
  acceptedFormats?: string[];
  value?: File | null; // Controlled value
}

export default function VideoUpload({ onVideoSelect, acceptedFormats = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/avi", "video/x-matroska"], value }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isCheckingDuration, setIsCheckingDuration] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reset when value prop changes to null (controlled component)
  useEffect(() => {
    if (value === null) {
      // Clear internal state when parent resets
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setVideoDuration(null);
      setError("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else if (value && value !== selectedFile) {
      // Sync with external value
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(value);
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      // Re-check duration for synced value
      checkVideoDuration(value)
        .then((duration) => {
          setVideoDuration(duration);
        })
        .catch(() => {
          // Ignore errors for synced values
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const checkVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error("Failed to load video metadata"));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setIsCheckingDuration(true);

    // Validate file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".3gp", ".flv", ".m4v"];
    const isValidType = acceptedFormats.includes(file.type) || allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      setError(`Invalid file type. Please upload: ${acceptedFormats.map((f) => f.split("/")[1].toUpperCase()).join(", ")}`);
      setIsCheckingDuration(false);
      return;
    }

    // Check video duration (max 2 minutes = 120 seconds)
    try {
      const duration = await checkVideoDuration(file);
      const maxDurationSeconds = 120; // 2 minutes

      if (duration > maxDurationSeconds) {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        setError(`Video duration (${minutes}:${seconds.toString().padStart(2, "0")}) exceeds maximum allowed length of 2 minutes.`);
        setIsCheckingDuration(false);
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // All validations passed
      setSelectedFile(file);
      setVideoDuration(duration);
      onVideoSelect(file);

      // Create preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Error checking video duration:", err);
      setError("Failed to validate video. Please try again.");
    } finally {
      setIsCheckingDuration(false);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setVideoDuration(null);
    setError("");
    onVideoSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Only show upload area if no file is selected */}
      {!selectedFile && (
        <div className="flex items-center justify-center w-full">
          <label htmlFor="video-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-[#C9A24D] border-dashed rounded-lg cursor-pointer bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors gold-border">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-12 h-12 mb-3 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mb-2 text-sm text-[#FFFFFF]">
                <span className="font-semibold text-[#D4AF37]">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-[#C7D1E0]">{acceptedFormats.map((f) => f.split("/")[1].toUpperCase()).join(", ")} (MAX. 2 minutes)</p>
            </div>
            <input ref={fileInputRef} id="video-upload" type="file" className="hidden" accept={acceptedFormats.join(",")} onChange={handleFileSelect} />
          </label>
        </div>
      )}

      {isCheckingDuration && (
        <div className="p-3 bg-blue-500/20 backdrop-blur-sm border-2 border-blue-400 rounded-lg">
          <p className="text-sm text-blue-100">Checking video duration...</p>
        </div>
      )}

      {previewUrl && selectedFile && !isCheckingDuration && (
        <div className="space-y-2">
          <div className="relative">
            <video ref={videoRef} src={previewUrl} controls className="w-full rounded-lg" style={{ maxHeight: "400px" }} />
            <button onClick={handleRemove} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors" aria-label="Remove video">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-sm text-[#FFFFFF]">
            <p className="font-medium">
              File: <span className="text-[#D4AF37]">{selectedFile.name}</span>
            </p>
            <p>
              Size: <span className="text-[#D4AF37]">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </p>
            {videoDuration !== null && (
              <p>
                Duration:{" "}
                <span className="text-[#D4AF37]">
                  {Math.floor(videoDuration / 60)}:
                  {Math.floor(videoDuration % 60)
                    .toString()
                    .padStart(2, "0")}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/20 backdrop-blur-sm border-2 border-red-400 rounded-lg">
          <p className="text-sm text-red-100">{error}</p>
        </div>
      )}
    </div>
  );
}
