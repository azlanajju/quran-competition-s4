"use client";

import { useEffect } from "react";

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: number | null;
  submissionId?: number | null;
  studentName?: string;
}

export default function SuccessPopup({ isOpen, onClose }: SuccessPopupProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Popup */}
      <div className="relative bg-gradient-to-br from-[#072F6B] to-[#0A1F3D] border-2 border-[#D4AF37] rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#C7D1E0] hover:text-[#D4AF37] transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-400">
            <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[#D4AF37] mb-4">Registration Successful!</h2>
        <p className="text-center text-[#C7D1E0] mb-6">Your registration has been completed successfully.</p>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full bg-[#D4AF37] hover:bg-[#C9A24D] text-[#072F6B] font-semibold py-3 rounded-lg transition-colors shadow-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
}

