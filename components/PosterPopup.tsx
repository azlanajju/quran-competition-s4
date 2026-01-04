"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PosterPopup() {
  const [isOpen, setIsOpen] = useState(false);

  // Show popup on mount
  useEffect(() => {
    setIsOpen(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Popup */}
      <div className="relative bg-gradient-to-br from-[#072F6B] to-[#0A1F3D] border-2 border-[#D4AF37] rounded-2xl shadow-2xl w-[90vw] max-w-2xl h-[85vh] max-h-[700px] p-4 md:p-6 animate-in fade-in zoom-in duration-300 flex flex-col">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-[#C7D1E0] hover:text-[#D4AF37] transition-colors z-10 bg-black/50 rounded-full p-2 hover:bg-black/70"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Poster Image */}
        <div className="relative w-full flex-1 mb-6 rounded-lg overflow-hidden flex items-center justify-center">
          <Image
            src="/images/poster.jpg"
            alt="Qiraat Competition Season-4 Poster"
            width={800}
            height={1000}
            className="w-full h-full object-contain rounded-lg"
            priority
          />
        </div>

        {/* Register Button */}
        <div className="flex justify-center">
          <Button
            asChild
            className="bg-[#4CAF50]/20 backdrop-blur-sm border-2 border-[#4CAF50] text-[#FFFFFF] hover:bg-[#4CAF50]/30 font-semibold shadow-xl shadow-[#4CAF50]/20 px-6 py-3 rounded-lg hover:scale-105 transition-all duration-300"
            size="default"
          >
            <Link href="/student/register" onClick={() => setIsOpen(false)}>Register Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

