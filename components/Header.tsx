"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0000]/80 backdrop-blur-md border-b border-[#9fb3d1]/10">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <Image src="/images/logo.png" alt="Qira'at Logo" width={50} height={50} className="w-10 h-10 md:w-12 md:h-12 object-contain" priority />
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-bold text-[#FFFFFF] tracking-tight">QIRA&apos;AT</span>
              <span className="text-xs md:text-sm text-[#D4AF37] font-semibold" dir="rtl" style={{ fontFamily: "serif" }}>
                القراءة
              </span>
            </div>
          </Link>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/student/register" className="px-6 py-2 bg-[#4CAF50]/20 backdrop-blur-sm border-2 border-[#4CAF50] text-[#FFFFFF] rounded-lg hover:bg-[#4CAF50]/30 transition-all duration-300 font-semibold shadow-lg shadow-[#4CAF50]/20">
              Register
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-[#FFFFFF] p-2" aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#9FB3D1]/30">
            <div className="flex flex-col space-y-4">
              <Link href="/student/register" className="px-4 py-2 bg-[#4CAF50]/20 backdrop-blur-sm border-2 border-[#4CAF50] text-[#FFFFFF] rounded-lg hover:bg-[#4CAF50]/30 transition-all duration-300 font-semibold text-center shadow-lg shadow-[#4CAF50]/20" onClick={() => setIsMenuOpen(false)}>
                Register
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
