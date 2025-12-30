"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`transition-colors font-medium ${mounted && pathname === "/" ? "text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1" : "text-[#FFFFFF] hover:text-[#D4AF37]"}`}>
              Home
            </Link>
            <Link href="/leaderboard" className={`transition-colors font-medium ${mounted && pathname === "/leaderboard" ? "text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1" : "text-[#FFFFFF] hover:text-[#D4AF37]"}`}>
              Leaderboard
            </Link>
            <Link href="/contact" className={`transition-colors font-medium ${mounted && pathname === "/contact" ? "text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1" : "text-[#FFFFFF] hover:text-[#D4AF37]"}`}>
              Contact
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-[#FFFFFF]/50 text-[#FFFFFF] rounded-lg hover:bg-white/20 transition-all duration-300 font-medium">
              Login
            </Link>
            <Link href="/student/register" className="px-6 py-2 bg-[#4CAF50]/20 backdrop-blur-sm border-2 border-[#4CAF50] text-[#FFFFFF] rounded-lg hover:bg-[#4CAF50]/30 transition-all duration-300 font-semibold shadow-lg shadow-[#4CAF50]/20">
              Get Started
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
              <Link href="/" className={`transition-colors font-medium ${mounted && pathname === "/" ? "text-[#D4AF37]" : "text-[#FFFFFF] hover:text-[#D4AF37]"}`} onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <Link href="/leaderboard" className={`transition-colors font-medium ${mounted && pathname === "/leaderboard" ? "text-[#D4AF37]" : "text-[#FFFFFF] hover:text-[#D4AF37]"}`} onClick={() => setIsMenuOpen(false)}>
                Leaderboard
              </Link>
              <Link href="/contact" className={`transition-colors font-medium ${mounted && pathname === "/contact" ? "text-[#D4AF37]" : "text-[#FFFFFF] hover:text-[#D4AF37]"}`} onClick={() => setIsMenuOpen(false)}>
                Contact
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-[#9FB3D1]/30">
                <Link href="/login" className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-[#FFFFFF]/50 text-[#FFFFFF] rounded-lg hover:bg-white/20 transition-all duration-300 font-medium text-center" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/student/register" className="px-4 py-2 bg-[#4CAF50]/20 backdrop-blur-sm border-2 border-[#4CAF50] text-[#FFFFFF] rounded-lg hover:bg-[#4CAF50]/30 transition-all duration-300 font-semibold text-center shadow-lg shadow-[#4CAF50]/20" onClick={() => setIsMenuOpen(false)}>
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
