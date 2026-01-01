"use client";

import Header from "@/components/Header";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalStudents: number;
  totalSubmissions: number;
  studentsWithVideos: number;
  recentRegistrations: number;
  recentSubmissions: number;
  studentsByStatus: Record<string, number>;
  submissionsByStatus: Record<string, number>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/dashboard");
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || "Failed to load dashboard");
      }
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1A3A] to-[#0F2447]">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1A3A] to-[#0F2447]">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-400 text-xl">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1A3A] to-[#0F2447]">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-[#C7D1E0]">Overview of registrations and video submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Students" value={stats?.totalStudents || 0} icon="👥" color="from-blue-500 to-blue-600" />
          <StatCard title="Video Submissions" value={stats?.totalSubmissions || 0} icon="🎥" color="from-purple-500 to-purple-600" />
          <StatCard title="Students with Videos" value={stats?.studentsWithVideos || 0} icon="✅" color="from-green-500 to-green-600" />
          <StatCard title="Recent (7 days)" value={`${stats?.recentRegistrations || 0} / ${stats?.recentSubmissions || 0}`} subtitle="Registrations / Submissions" icon="📊" color="from-yellow-500 to-yellow-600" />
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StatusCard
            title="Students by Status"
            data={stats?.studentsByStatus || {}}
            colors={{
              submitted: "bg-blue-500",
              pending: "bg-gray-500",
              reviewed: "bg-yellow-500",
              approved: "bg-green-500",
              rejected: "bg-red-500",
            }}
          />
          <StatusCard
            title="Submissions by Status"
            data={stats?.submissionsByStatus || {}}
            colors={{
              pending: "bg-gray-500",
              processing: "bg-yellow-500",
              completed: "bg-green-500",
              failed: "bg-red-500",
            }}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/students" className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">View All Students</h3>
                <p className="text-[#C7D1E0]">Manage student registrations</p>
              </div>
              <div className="text-4xl">→</div>
            </div>
          </Link>

          <Link href="/admin/submissions" className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">View Video Submissions</h3>
                <p className="text-[#C7D1E0]">Review and manage video submissions</p>
              </div>
              <div className="text-4xl">→</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }: { title: string; value: string | number; subtitle?: string; icon: string; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-6 shadow-xl`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-4xl">{icon}</div>
        <div className="text-white/80 text-sm">{title}</div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {subtitle && <div className="text-white/70 text-sm">{subtitle}</div>}
    </div>
  );
}

function StatusCard({ title, data, colors }: { title: string; data: Record<string, number>; colors: Record<string, string> }) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-[#D4AF37]/30">
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {Object.entries(data).map(([status, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={status}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[#C7D1E0] capitalize">{status}</span>
                <span className="text-white font-semibold">{count}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className={`${colors[status] || "bg-gray-500"} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
        {Object.keys(data).length === 0 && <div className="text-[#C7D1E0] text-center py-4">No data available</div>}
      </div>
    </div>
  );
}
