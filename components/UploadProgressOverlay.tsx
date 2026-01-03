"use client";

interface UploadProgressOverlayProps {
  progress: number; // 0-100
  currentStep: string;
  isVisible: boolean;
  uploadedBytes?: number;
  totalBytes?: number;
}

export default function UploadProgressOverlay({ progress, currentStep, isVisible, uploadedBytes, totalBytes }: UploadProgressOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#D4AF37] rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4CAF50] rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-md w-full">
        {/* Islamic geometric pattern decoration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-[#D4AF37] rounded-full animate-spin" style={{ animationDuration: "3s" }}>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-4 border-[#4CAF50] rounded-full"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl">✦</div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-[#D4AF37] mb-4" style={{ textShadow: "0 0 20px rgba(212, 175, 55, 0.5)" }}>
          Uploading Your Submission
        </h2>

        {/* Current step */}
        <p className="text-lg text-[#FFFFFF] mb-6 opacity-90">{currentStep}</p>

        {/* Progress bar container */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#C7D1E0]">Upload Progress</span>
            <span className="text-lg font-bold text-[#D4AF37]">{Math.round(progress)}%</span>
          </div>
          
          {/* Show bytes uploaded if available */}
          {uploadedBytes !== undefined && totalBytes !== undefined && (
            <div className="text-xs text-[#C7D1E0] mb-2 opacity-75">
              {(uploadedBytes / (1024 * 1024)).toFixed(2)} MB / {(totalBytes / (1024 * 1024)).toFixed(2)} MB
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden border border-[#D4AF37]/30">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] via-[#F2D27A] to-[#D4AF37] rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  animation: "shimmer 2s infinite",
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Warning message */}
        <p className="text-sm text-[#C7D1E0] mt-6 opacity-75">Please do not close this page or go back</p>

        {/* Animated dots */}
        <div className="flex justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

