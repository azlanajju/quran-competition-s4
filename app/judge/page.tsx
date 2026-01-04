"use client";

import JudgeHeader from "@/components/judge/JudgeHeader";
import JudgeSidebar from "@/components/judge/JudgeSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Submission {
  id: number;
  student_id: number;
  full_name: string;
  phone: string;
  city: string;
  state: string;
  original_video_key: string;
  original_video_url: string;
  created_at: string;
  score_status?: "scored" | "partial" | "pending";
}

interface Statistics {
  total: number;
  scored: number;
  partial: number;
  pending: number;
}

export default function JudgePanel() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [judge, setJudge] = useState<{ id: number; username: string; fullName: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [statistics, setStatistics] = useState<Statistics>({ total: 0, scored: 0, partial: 0, pending: 0 });
  const [filter, setFilter] = useState<"all" | "pending" | "partial" | "scored">("all");
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/judge/auth/verify");
        const data = await response.json();

        if (data.success && data.authenticated) {
          setJudge(data.judge);
          fetchSubmissions(data.judge.id);
          fetchStatistics(data.judge.id);
        } else {
          router.push("/judge/login");
        }
      } catch (err) {
        console.error("Auth check error:", err);
        router.push("/judge/login");
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (judge?.id) {
      setPage(1); // Reset to first page when filter changes
      fetchSubmissions(judge.id);
    }
  }, [filter, judge]);

  useEffect(() => {
    if (judge?.id) {
      fetchSubmissions(judge.id);
    }
  }, [page, judge]);

  const fetchStatistics = async (judgeId: number) => {
    try {
      const response = await fetch(`/api/judge/statistics?judgeId=${judgeId}`);
      const data = await response.json();

      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  const fetchSubmissions = async (judgeId: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        filter: filter,
        judgeId: judgeId.toString(),
      });

      const response = await fetch(`/api/judge/submissions?${params}`);
      const data = await response.json();

      if (data.success) {
        setSubmissions(data.submissions);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <JudgeHeader />
        <JudgeSidebar />
        <div className="lg:ml-64 flex items-center justify-center min-h-screen">
          <div className="text-gray-900 text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <JudgeHeader />
      <JudgeSidebar />
      <div className="lg:ml-64">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Judge Panel</h1>
            <p className="text-gray-600">Evaluate video submissions</p>
            {judge && (
              <p className="text-sm text-[#072F6B] mt-2">
                Logged in as: <span className="font-semibold">{judge.fullName}</span> ({judge.username})
              </p>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setFilter("all")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-[#072F6B]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setFilter("scored")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fully Scored</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.scored}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setFilter("partial")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Partially Scored</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.partial}</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setFilter("pending")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.pending}</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Clock className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-[#072F6B] hover:bg-[#0B1A3A] text-white" : ""}
            >
              All
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
              className={filter === "pending" ? "bg-[#072F6B] hover:bg-[#0B1A3A] text-white" : ""}
            >
              Pending ({statistics.pending})
            </Button>
            <Button
              variant={filter === "partial" ? "default" : "outline"}
              onClick={() => setFilter("partial")}
              className={filter === "partial" ? "bg-[#072F6B] hover:bg-[#0B1A3A] text-white" : ""}
            >
              Partial ({statistics.partial})
            </Button>
            <Button
              variant={filter === "scored" ? "default" : "outline"}
              onClick={() => setFilter("scored")}
              className={filter === "scored" ? "bg-[#072F6B] hover:bg-[#0B1A3A] text-white" : ""}
            >
              Fully Scored ({statistics.scored})
            </Button>
          </div>

          {/* Submissions List */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-gray-600">Loading submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No submissions found</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Submitted</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {submissions.map((submission) => {
                          const getStatusBadge = () => {
                            if (submission.score_status === "scored") {
                              return (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Fully Scored
                                </span>
                              );
                            } else if (submission.score_status === "partial") {
                              return (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Partial
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </span>
                              );
                            }
                          };

                          return (
                            <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{submission.full_name}</div>
                                <div className="text-sm text-gray-600">{submission.phone}</div>
                                <div className="text-xs text-gray-500">
                                  {submission.city}, {submission.state}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(submission.created_at).toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Button onClick={() => router.push(`/judge/submission/${submission.id}`)} className="bg-[#072F6B] hover:bg-[#0B1A3A] text-white">
                                  View & Score
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                      <div className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} variant="outline" className="disabled:opacity-50 disabled:cursor-not-allowed">
                          Previous
                        </Button>
                        <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="outline" className="disabled:opacity-50 disabled:cursor-not-allowed">
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
