"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Video, TrendingUp, FileText, UserCheck, ArrowUpRight, ArrowRight } from "lucide-react";

interface DashboardStats {
  totalRegistrations: number;
  totalSubmissions: number;
  completedSubmissions: number;
  recentActivity: number;
  recentRegistrations: number;
  recentSubmissions: number;
  studentsWithVideos: number;
  studentsByStatus: Record<string, number>;
  submissionsByStatus: Record<string, number>;
  registrationsOverTime: Array<{ date: string; count: number }>;
  submissionsOverTime: Array<{ date: string; count: number }>;
}

const COLORS = {
  primary: "#072F6B",
  secondary: "#0B1A3A",
  accent: "#D4AF37",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
};

const CHART_COLORS = ["#072F6B", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ id: number; email: string; fullName: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/verify");
        const data = await response.json();

        if (data.success && data.authenticated) {
          setAdmin(data.admin);
          fetchDashboardStats();
        } else {
          router.push("/admin/login");
        }
      } catch (err) {
        console.error("Auth check error:", err);
        router.push("/admin/login");
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

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

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <AdminSidebar />
        <div className="lg:ml-64">
          <AdminHeader />
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-500 text-lg">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <AdminSidebar />
        <div className="lg:ml-64">
          <AdminHeader />
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-red-500 text-lg">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const activityChartData = (stats?.registrationsOverTime || []).map((reg: any) => {
    const sub = (stats?.submissionsOverTime || []).find((s: any) => s.date === reg.date);
    return {
      date: new Date(reg.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Registrations: reg.count,
      Submissions: sub?.count || 0,
    };
  });

  const statusPieData = [
    { name: "Completed", value: stats?.completedSubmissions || 0 },
    { name: "Processing", value: (stats?.submissionsByStatus?.processing || 0) },
    { name: "Pending", value: (stats?.submissionsByStatus?.pending || 0) },
    { name: "Failed", value: (stats?.submissionsByStatus?.failed || 0) },
  ].filter(item => item.value > 0);

  const registrationStatusData = Object.entries(stats?.studentsByStatus || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm sm:text-base md:text-lg">Welcome back! Here's what's happening with your registrations.</p>
        </div>

        {/* Stats Cards - Modern Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-blue-50">
                  <Users className="h-6 w-6 text-[#072F6B]" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalRegistrations || 0}</p>
                <p className="text-xs text-gray-500">All student registrations</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-purple-50">
                  <Video className="h-6 w-6 text-[#072F6B]" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Video Submissions</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalSubmissions || 0}</p>
                <p className="text-xs text-gray-500">{stats?.completedSubmissions || 0} completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-green-50">
                  <UserCheck className="h-6 w-6 text-[#072F6B]" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">With Videos</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.studentsWithVideos || 0}</p>
                <p className="text-xs text-gray-500">Students with submissions</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-orange-50">
                  <TrendingUp className="h-6 w-6 text-[#072F6B]" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.recentActivity || 0}</p>
                <p className="text-xs text-gray-500">Last 7 days</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row - Modern Styling */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Activity Over Time */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Activity Over Time</CardTitle>
              <CardDescription className="text-gray-500">30-day trend of registrations and submissions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={activityChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Registrations" 
                    stroke={COLORS.primary} 
                    strokeWidth={3}
                    dot={{ fill: COLORS.primary, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Submissions" 
                    stroke={COLORS.info} 
                    strokeWidth={3}
                    dot={{ fill: COLORS.info, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Submission Status */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Submission Status</CardTitle>
              <CardDescription className="text-gray-500">Distribution of submission statuses</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Registration Status</CardTitle>
              <CardDescription className="text-gray-500">Students by registration status</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={registrationStatusData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    fill={COLORS.primary}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Submission Breakdown</CardTitle>
              <CardDescription className="text-gray-500">Detailed submission status distribution</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {Object.entries(stats?.submissionsByStatus || {}).map(([status, count], index) => {
                  const total = Object.values(stats?.submissionsByStatus || {}).reduce((a: number, b: number) => a + b, 0);
                  const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                        <span className="text-sm font-semibold text-gray-900">{count as number}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
            }}
          />
        </div>
                      <p className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</p>
                    </div>
                  );
                })}
                {Object.keys(stats?.submissionsByStatus || {}).length === 0 && (
                  <div className="text-gray-400 text-center py-12">No submission data available</div>
                )}
              </div>
            </CardContent>
          </Card>
            </div>

        {/* Quick Actions - Modern Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 group">
            <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#072F6B]/10 group-hover:bg-[#072F6B]/20 transition-colors">
                    <FileText className="h-6 w-6 text-[#072F6B]" />
                  </div>
              <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">View Registrations</CardTitle>
                    <CardDescription className="text-gray-500">Manage all student registrations</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#072F6B] group-hover:translate-x-1 transition-all" />
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/admin/students">
                <Button className="w-full bg-[#072F6B] hover:bg-[#0B1A3A] text-white shadow-md hover:shadow-lg transition-all">
                  Open Registrations
                </Button>
          </Link>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 group">
            <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#072F6B]/10 group-hover:bg-[#072F6B]/20 transition-colors">
                    <Video className="h-6 w-6 text-[#072F6B]" />
                  </div>
              <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">View Submissions</CardTitle>
                    <CardDescription className="text-gray-500">Review video submissions</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#072F6B] group-hover:translate-x-1 transition-all" />
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/admin/submissions">
                <Button className="w-full bg-[#072F6B] hover:bg-[#0B1A3A] text-white shadow-md hover:shadow-lg transition-all">
                  Open Submissions
                </Button>
              </Link>
            </CardContent>
          </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
