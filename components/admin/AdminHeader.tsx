"use client";

import Image from "next/image";
import { Bell, Search, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AdminHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Image 
            src="/images/logo.png" 
            alt="Qira'at Logo" 
            width={32} 
            height={32} 
            className="object-contain sm:w-10 sm:h-10" 
            priority 
          />
          <div className="flex flex-col">
            <span className="text-sm sm:text-lg font-bold text-gray-900 tracking-tight">QIRA&apos;AT</span>
            <span className="text-[10px] sm:text-xs text-[#072F6B] font-semibold" dir="rtl" style={{ fontFamily: "serif" }}>
              القراءة
            </span>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          {/* Search */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm focus:border-[#072F6B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#072F6B]/20"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            <span className="absolute right-0.5 top-0.5 sm:right-1 sm:top-1 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500"></span>
          </Button>

          {/* Settings - Hidden on mobile */}
          <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 sm:h-10 sm:w-10">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          </Button>

          {/* Logout */}
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 sm:h-10 sm:w-10" title="Logout">
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          </Button>
        </div>
      </div>
    </header>
  );
}

