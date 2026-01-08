"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatStudentId } from "@/lib/utils";
import { ArrowLeft, Medal, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface LeaderboardEntry {
  rank: number;
  submission_id: number;
  student_id: number;
  full_name: string;
  phone: string;
  city: string;
  state: string;
  date_of_birth: string;
  submission_date: string;
  scoreA: number | null;
  scoreB: number | null;
  averageScore: number;
  hasBothScores: boolean;
}

export default function AdminLeaderboard() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/verify");
        const data = await response.json();

        if (data.success && data.authenticated) {
          fetchLeaderboard();
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

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/leaderboard");
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.leaderboard);
      } else {
        setError(data.error || "Failed to load leaderboard");
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="h-6 w-6 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="h-6 w-6 text-gray-400" />;
    } else if (rank === 3) {
      return <Medal className="h-6 w-6 text-amber-600" />;
    }
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) {
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    } else if (rank === 2) {
      return "bg-gray-100 text-gray-800 border-gray-300";
    } else if (rank === 3) {
      return "bg-amber-100 text-amber-800 border-amber-300";
    }
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight flex items-center gap-2 sm:gap-3">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-yellow-500" />
                Leaderboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Top performers ranked by average scores</p>
            </div>
            <Link href="/admin">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>

          {/* Leaderboard Table */}
          <Card className="border-0 shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading leaderboard...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No scores available yet</div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-[#072F6B] to-[#0B1A3A] text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Score A</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Score B</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Average</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaderboard.map((entry) => (
                        <tr key={entry.submission_id} className={`hover:bg-gray-50 transition-colors ${entry.rank <= 3 ? "bg-gradient-to-r from-yellow-50/30 to-transparent" : ""}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>{getRankIcon(entry.rank) || entry.rank}</div>
                              {entry.rank <= 3 && <span className="text-xs font-semibold text-gray-600">{entry.rank === 1 ? "🥇 Gold" : entry.rank === 2 ? "🥈 Silver" : "🥉 Bronze"}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-[#072F6B]">{formatStudentId(entry.student_id)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">{entry.full_name}</div>
                            <div className="text-xs text-gray-500">{entry.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">{entry.scoreA !== null ? <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">{entry.scoreA}</span> : <span className="text-xs text-gray-400">-</span>}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">{entry.scoreB !== null ? <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">{entry.scoreB}</span> : <span className="text-xs text-gray-400">-</span>}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="inline-flex items-center px-4 py-2 rounded-lg text-lg font-bold bg-[#072F6B]/10 text-[#072F6B] border-2 border-[#072F6B]/20">{entry.averageScore}</span>
                              {entry.rank <= 3 && <TrendingUp className="h-5 w-5 text-yellow-500" />}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {entry.city}, {entry.state}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(entry.submission_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200">
                  {leaderboard.map((entry) => (
                    <div key={entry.submission_id} className={`p-4 space-y-3 ${entry.rank <= 3 ? "bg-gradient-to-r from-yellow-50/30 to-transparent" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>{getRankIcon(entry.rank) || entry.rank}</div>
                          <div>
                            <div className="text-xs font-semibold text-[#072F6B] mb-1">{formatStudentId(entry.student_id)}</div>
                            <div className="text-sm font-semibold text-gray-900">{entry.full_name}</div>
                            <div className="text-xs text-gray-500">{entry.phone}</div>
                          </div>
                        </div>
                        {entry.rank <= 3 && <span className="text-xs font-semibold text-gray-600">{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span>}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
                        <div>
                          <span className="text-gray-500">Score A:</span>
                          <span className="ml-1 text-gray-900 font-medium">{entry.scoreA !== null ? entry.scoreA : "-"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Score B:</span>
                          <span className="ml-1 text-gray-900 font-medium">{entry.scoreB !== null ? entry.scoreB : "-"}</span>
                        </div>
                        <div className="col-span-2 flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-gray-500">Average:</span>
                          <span className="text-lg font-bold text-[#072F6B]">{entry.averageScore}</span>
                        </div>
                        <div className="col-span-2 text-xs text-gray-500">
                          {entry.city}, {entry.state}
                        </div>
                        <div className="col-span-2 text-xs text-gray-500">Submitted: {new Date(entry.submission_date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Summary Stats */}
            {leaderboard.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    Total entries: <span className="font-semibold text-gray-900">{leaderboard.length}</span>
                  </div>
                  <div className="text-gray-600">{leaderboard.filter((e) => e.hasBothScores).length} entries with both scores</div>
                </div>
              </div>
            )}
          </Card>

          {/* Top 3 Highlight Cards */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
              {/* 2nd Place */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4 border-4 border-gray-300">
                      <Medal className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-700 mb-1">2nd Place</div>
                    <div className="text-xs font-semibold text-[#072F6B] mb-1">{formatStudentId(leaderboard[1].student_id)}</div>
                    <div className="text-lg font-semibold text-gray-900 mb-2">{leaderboard[1].full_name}</div>
                    <div className="text-3xl font-bold text-[#072F6B] mb-2">{leaderboard[1].averageScore}</div>
                    <div className="text-sm text-gray-600">
                      {leaderboard[1].city}, {leaderboard[1].state}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 1st Place */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 transform scale-105">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-yellow-200 flex items-center justify-center mb-4 border-4 border-yellow-400">
                      <Trophy className="h-10 w-10 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-700 mb-1">1st Place</div>
                    <div className="text-xs font-semibold text-[#072F6B] mb-1">{formatStudentId(leaderboard[0].student_id)}</div>
                    <div className="text-lg font-semibold text-gray-900 mb-2">{leaderboard[0].full_name}</div>
                    <div className="text-4xl font-bold text-[#072F6B] mb-2">{leaderboard[0].averageScore}</div>
                    <div className="text-sm text-gray-600">
                      {leaderboard[0].city}, {leaderboard[0].state}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3rd Place */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center mb-4 border-4 border-amber-300">
                      <Medal className="h-8 w-8 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-700 mb-1">3rd Place</div>
                    <div className="text-xs font-semibold text-[#072F6B] mb-1">{formatStudentId(leaderboard[2].student_id)}</div>
                    <div className="text-lg font-semibold text-gray-900 mb-2">{leaderboard[2].full_name}</div>
                    <div className="text-3xl font-bold text-[#072F6B] mb-2">{leaderboard[2].averageScore}</div>
                    <div className="text-sm text-gray-600">
                      {leaderboard[2].city}, {leaderboard[2].state}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
