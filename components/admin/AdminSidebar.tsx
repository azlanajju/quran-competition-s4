"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  UserCog, 
  FileText,
  Trophy,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Registrations",
    href: "/admin/students",
    icon: Users,
    description: "Manage student registrations",
  },
  {
    title: "Submissions",
    href: "/admin/submissions",
    icon: Video,
    description: "Review video submissions",
  },
  {
    title: "Judges",
    href: "/admin/judges",
    icon: UserCog,
    description: "Manage judge accounts",
  },
  {
    title: "Leaderboard",
    href: "/admin/leaderboard",
    icon: Trophy,
    description: "View top performers",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname() || "";
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white border border-gray-200 shadow-md"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white transition-transform",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      <div className="flex h-full flex-col">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#072F6B] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                  )}
                />
                <div className="flex-1">
                  <div>{item.title}</div>
                  {item.description && (
                    <div className={cn(
                      "text-xs mt-0.5",
                      isActive ? "text-white/80" : "text-gray-500"
                    )}>
                      {item.description}
                    </div>
                  )}
                </div>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-900">Need help?</p>
            <p className="text-xs text-gray-500 mt-1">Contact support</p>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}

