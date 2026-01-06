"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import VideoPlayer from "@/components/VideoPlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, TrendingUp, Calendar, X } from "lucide-react";

interface Score {
  id: number;
  submission_id: number;
  judge_id: number;
  judge_name: string;
  judge_full_name?: string;
  judge_username?: string;
  score_type: "A" | "B";
  score: number;
  description: string | null;
  created_at: string;
  updated_at?: string;
}

interface Submission {
  id: number;
  student_id: number;
  full_name: string;
  phone: string;
  city: string;
  state: string;
  original_video_key: string | null;
  hls_master_playlist_key: string | null;
  hls_master_playlist_url: string | null;
  video_resolution: string;
  processing_status: string;
  processing_error: string | null;
  created_at: string;
  scores?: {
    scoreA: Score | null;
    scoreB: Score | null;
    allScoresA?: Score[];
    allScoresB?: Score[];
    average: string | null;
    totalScores: number;
  };
}

export default function AdminSubmissions() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<{ submissionId: number; name: string } | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [preloadVideoUrl, setPreloadVideoUrl] = useState<string | null>(null);
  const [selectedScores, setSelectedScores] = useState<Submission | null>(null);
  const [loadingScores, setLoadingScores] = useState(false);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/verify");
        const data = await response.json();

        if (data.success && data.authenticated) {
          fetchSubmissions();
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

  useEffect(() => {
    if (!checkingAuth) {
      fetchSubmissions();
    }
  }, [page, statusFilter, dateFrom, dateTo, checkingAuth]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter) params.append("status", statusFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(`/api/admin/submissions?${params}`);
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

  const viewScores = async (submission: Submission) => {
    setLoadingScores(true);
    try {
      // Fetch all scores for this submission
      const response = await fetch(`/api/judge/submissions/${submission.id}/scores`);
      const data = await response.json();
      
      if (data.success) {
        // Get latest scores of each type
        const latestScoreA = data.scores.A && data.scores.A.length > 0 ? data.scores.A[0] : null;
        const latestScoreB = data.scores.B && data.scores.B.length > 0 ? data.scores.B[0] : null;
        
        // Calculate average - use both scores if available, otherwise use single score
        let averageScore = null;
        if (latestScoreA && latestScoreB) {
          const scoreAValue = typeof latestScoreA.score === 'string' ? parseFloat(latestScoreA.score) : latestScoreA.score;
          const scoreBValue = typeof latestScoreB.score === 'string' ? parseFloat(latestScoreB.score) : latestScoreB.score;
          if (!isNaN(scoreAValue) && !isNaN(scoreBValue)) {
            const avg = (scoreAValue + scoreBValue) / 2;
            averageScore = avg % 1 === 0 ? avg.toString() : avg.toFixed(2);
          }
        } else if (latestScoreA) {
          const scoreAValue = typeof latestScoreA.score === 'string' ? parseFloat(latestScoreA.score) : latestScoreA.score;
          if (!isNaN(scoreAValue)) {
            averageScore = scoreAValue % 1 === 0 ? scoreAValue.toString() : scoreAValue.toFixed(2);
          }
        } else if (latestScoreB) {
          const scoreBValue = typeof latestScoreB.score === 'string' ? parseFloat(latestScoreB.score) : latestScoreB.score;
          if (!isNaN(scoreBValue)) {
            averageScore = scoreBValue % 1 === 0 ? scoreBValue.toString() : scoreBValue.toFixed(2);
          }
        }
        
        // Calculate total scores count
        const totalScoresCount = (data.scores.A?.length || 0) + (data.scores.B?.length || 0);
        
        // Update submission with all scores and recalculated average
        const updatedSubmission = {
          ...submission,
          scores: {
            ...submission.scores,
            scoreA: latestScoreA || submission.scores?.scoreA || null,
            scoreB: latestScoreB || submission.scores?.scoreB || null,
            allScoresA: data.scores.A || [],
            allScoresB: data.scores.B || [],
            average: averageScore,
            totalScores: totalScoresCount,
          },
        };
        setSelectedScores(updatedSubmission);
      } else {
        alert(data.error || "Failed to load scores");
      }
    } catch (err) {
      console.error("Error loading scores:", err);
      alert("Failed to load scores");
    } finally {
      setLoadingScores(false);
    }
  };

  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const openVideo = async (submissionId: number, studentName: string) => {
    setIsLoadingVideo(true);
    
    // Fetch video URL and open popup immediately
    try {
      const response = await fetch(`/api/video/signed-url?submissionId=${submissionId}&type=original`);
      const data = await response.json();
      if (data.success && data.signedUrl) {
        setPreloadVideoUrl(data.signedUrl);
      }
      // Open popup immediately after fetching URL
      setSelectedVideo({ submissionId, name: studentName });
      setIsLoadingVideo(false);
    } catch (err) {
      console.error("Error fetching video URL:", err);
      setIsLoadingVideo(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">Video Submissions</h1>
              <p className="text-sm sm:text-base text-gray-600">Review and manage video submissions</p>
            </div>
            <Link href="/admin">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Date To
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setPage(1);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent"
                    />
                    {(dateFrom || dateTo) && (
                      <Button
                        onClick={clearDateFilters}
                        variant="outline"
                        size="sm"
                        className="px-3"
                        title="Clear date filters"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submissions Table */}
          <Card className="border-0 shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No submissions found</div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Resolution</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Scores</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{submission.full_name}</div>
                          <div className="text-sm text-gray-600">{submission.phone}</div>
                          <div className="text-xs text-gray-500">
                            {submission.city}, {submission.state}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{submission.video_resolution}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            submission.processing_status === "completed" 
                              ? "bg-green-100 text-green-800" 
                              : submission.processing_status === "failed" 
                              ? "bg-red-100 text-red-800" 
                              : submission.processing_status === "processing" 
                              ? "bg-yellow-100 text-yellow-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {submission.processing_status}
                          </span>
                          {submission.processing_error && (
                            <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={submission.processing_error}>
                              {submission.processing_error}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {submission.scores && submission.scores.totalScores > 0 ? (
                            <div className="space-y-2 min-w-[200px]">
                              <div className="flex flex-wrap items-center gap-2">
                                {submission.scores.scoreA && (
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-200">
                                    <span className="text-xs font-semibold text-blue-700">A:</span>
                                    <span className="text-sm font-bold text-[#072F6B]">
                                      {(() => {
                                        const scoreValue = typeof submission.scores.scoreA.score === 'number' 
                                          ? submission.scores.scoreA.score 
                                          : parseFloat(submission.scores.scoreA.score);
                                        if (isNaN(scoreValue)) return submission.scores.scoreA.score;
                                        return scoreValue % 1 === 0 ? scoreValue : scoreValue.toFixed(1);
                                      })()}
                                    </span>
                                  </div>
                                )}
                                {submission.scores.scoreB && (
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-lg border border-purple-200">
                                    <span className="text-xs font-semibold text-purple-700">B:</span>
                                    <span className="text-sm font-bold text-[#072F6B]">
                                      {(() => {
                                        const scoreValue = typeof submission.scores.scoreB.score === 'number' 
                                          ? submission.scores.scoreB.score 
                                          : parseFloat(submission.scores.scoreB.score);
                                        if (isNaN(scoreValue)) return submission.scores.scoreB.score;
                                        return scoreValue % 1 === 0 ? scoreValue : scoreValue.toFixed(1);
                                      })()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {submission.scores.average && !isNaN(parseFloat(submission.scores.average)) && (
                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#072F6B]/10 rounded-lg border border-[#072F6B]/20">
                                  <TrendingUp className="h-4 w-4 text-[#072F6B]" />
                                  <span className="text-xs font-medium text-gray-700">Avg:</span>
                                  <span className="text-sm font-bold text-[#072F6B]">{submission.scores.average}</span>
                                </div>
                              )}
                              {(submission.scores.scoreA?.judge_full_name || submission.scores.scoreB?.judge_full_name) && (
                                <div className="text-xs text-gray-500 space-y-0.5">
                                  {submission.scores.scoreA?.judge_full_name && (
                                    <div className="truncate" title={submission.scores.scoreA.judge_full_name}>
                                      A: {submission.scores.scoreA.judge_full_name}
                                    </div>
                                  )}
                                  {submission.scores.scoreB?.judge_full_name && (
                                    <div className="truncate" title={submission.scores.scoreB.judge_full_name}>
                                      B: {submission.scores.scoreB.judge_full_name}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No scores yet</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(submission.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col gap-2">
                            {submission.processing_status === "completed" && (
                              <Button 
                                onClick={() => openVideo(submission.id, submission.full_name)} 
                                size="sm"
                                className="bg-[#072F6B] hover:bg-[#0B1A3A] text-white"
                              >
                                View Video
                              </Button>
                            )}
                            {submission.scores && submission.scores.totalScores > 0 && (
                              <Button 
                                onClick={() => viewScores(submission)} 
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                disabled={loadingScores}
                              >
                                <Award className="h-3.5 w-3.5" />
                                View Scores
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">{submission.full_name}</div>
                          <div className="text-xs text-gray-600 mt-1">{submission.phone}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {submission.city}, {submission.state}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                          submission.processing_status === "completed" 
                            ? "bg-green-100 text-green-800" 
                            : submission.processing_status === "failed" 
                            ? "bg-red-100 text-red-800" 
                            : submission.processing_status === "processing" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {submission.processing_status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Resolution:</span>
                          <span className="ml-1 text-gray-900">{submission.video_resolution}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Submitted:</span>
                          <span className="ml-1 text-gray-900">{new Date(submission.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {submission.scores && submission.scores.totalScores > 0 && (
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <div className="flex flex-wrap items-center gap-2">
                            {submission.scores.scoreA && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-200">
                                <span className="text-xs font-semibold text-blue-700">A:</span>
                                <span className="text-sm font-bold text-[#072F6B]">
                                  {(() => {
                                    const scoreValue = typeof submission.scores.scoreA.score === 'number' 
                                      ? submission.scores.scoreA.score 
                                      : parseFloat(submission.scores.scoreA.score);
                                    if (isNaN(scoreValue)) return submission.scores.scoreA.score;
                                    return scoreValue % 1 === 0 ? scoreValue : scoreValue.toFixed(1);
                                  })()}
                                </span>
                              </div>
                            )}
                            {submission.scores.scoreB && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-lg border border-purple-200">
                                <span className="text-xs font-semibold text-purple-700">B:</span>
                                <span className="text-sm font-bold text-[#072F6B]">
                                  {(() => {
                                    const scoreValue = typeof submission.scores.scoreB.score === 'number' 
                                      ? submission.scores.scoreB.score 
                                      : parseFloat(submission.scores.scoreB.score);
                                    if (isNaN(scoreValue)) return submission.scores.scoreB.score;
                                    return scoreValue % 1 === 0 ? scoreValue : scoreValue.toFixed(1);
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                          {submission.scores.average && !isNaN(parseFloat(submission.scores.average)) && (
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#072F6B]/10 rounded-lg border border-[#072F6B]/20">
                              <TrendingUp className="h-4 w-4 text-[#072F6B]" />
                              <span className="text-xs font-medium text-gray-700">Avg:</span>
                              <span className="text-sm font-bold text-[#072F6B]">{submission.scores.average}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-2 pt-2">
                        {submission.processing_status === "completed" && (
                          <Button 
                            onClick={() => openVideo(submission.id, submission.full_name)} 
                            size="sm"
                            className="w-full bg-[#072F6B] hover:bg-[#0B1A3A] text-white"
                          >
                            View Video
                          </Button>
                        )}
                        {submission.scores && submission.scores.totalScores > 0 && (
                          <Button 
                            onClick={() => viewScores(submission)} 
                            size="sm"
                            variant="outline"
                            className="w-full gap-1.5"
                            disabled={loadingScores}
                          >
                            <Award className="h-3.5 w-3.5" />
                            View Scores
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                  >
                    First
                  </Button>
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          className={page === pageNum ? "bg-[#072F6B] hover:bg-[#0B1A3A] text-white" : ""}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                  <Button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Last
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoadingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#072F6B]"></div>
            <div className="text-gray-700 font-medium">Loading video...</div>
            <div className="text-sm text-gray-500">Please wait</div>
          </div>
        </div>
      )}

      {/* Hidden video for preloading during delay - starts playing in background */}
      {isLoadingVideo && preloadVideoUrl && (
        <video
          src={preloadVideoUrl}
          preload="auto"
          autoPlay
          muted
          playsInline
          className="hidden"
          style={{ position: "absolute", visibility: "hidden", width: "1px", height: "1px" }}
          onLoadedData={(e) => {
            // Video is loaded, start playing to buffer
            const video = e.currentTarget;
            video.play().catch(() => {
              // Ignore autoplay errors
            });
          }}
        />
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer 
          submissionId={selectedVideo.submissionId} 
          studentName={selectedVideo.name} 
          signedUrl={preloadVideoUrl || undefined}
          onClose={() => {
            setSelectedVideo(null);
            setPreloadVideoUrl(null);
          }} 
        />
      )}

      {/* Loading Overlay for Scores */}
      {loadingScores && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#072F6B]"></div>
            <div className="text-gray-700 font-medium">Loading scores...</div>
            <div className="text-sm text-gray-500">Please wait</div>
          </div>
        </div>
      )}

      {/* Scores Modal */}
      {selectedScores && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-white rounded-xl border-2 border-gray-200 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Scores & Comments</h3>
                <p className="text-sm text-gray-600">
                  {selectedScores.full_name} - Submission #{selectedScores.id}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedScores(null)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scores Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Score A Section */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-700 font-bold">A</span>
                  </div>
                  Score A Evaluations
                </h4>
                {selectedScores.scores?.allScoresA && selectedScores.scores.allScoresA.length > 0 ? (
                  <div className="space-y-3">
                    {selectedScores.scores.allScoresA.map((score) => (
                      <div key={score.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-[#072F6B]">
                                {score.score % 1 === 0 ? score.score : score.score.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500">/ 10</span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              Judge: <span className="font-medium">
                                {score.judge_full_name || score.judge_name || score.judge_username || "Unknown"}
                              </span>
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 text-right">
                            <div>Created: {new Date(score.created_at).toLocaleString()}</div>
                            {score.updated_at && score.updated_at !== score.created_at && (
                              <div>Updated: {new Date(score.updated_at).toLocaleString()}</div>
                            )}
                          </div>
                        </div>
                        {score.description && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Comment:</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{score.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                    No Score A evaluations yet
                  </div>
                )}
              </div>

              {/* Score B Section */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-700 font-bold">B</span>
                  </div>
                  Score B Evaluations
                </h4>
                {selectedScores.scores?.allScoresB && selectedScores.scores.allScoresB.length > 0 ? (
                  <div className="space-y-3">
                    {selectedScores.scores.allScoresB.map((score) => (
                      <div key={score.id} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-[#072F6B]">
                                {score.score % 1 === 0 ? score.score : score.score.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500">/ 10</span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              Judge: <span className="font-medium">
                                {score.judge_full_name || score.judge_name || score.judge_username || "Unknown"}
                              </span>
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 text-right">
                            <div>Created: {new Date(score.created_at).toLocaleString()}</div>
                            {score.updated_at && score.updated_at !== score.created_at && (
                              <div>Updated: {new Date(score.updated_at).toLocaleString()}</div>
                            )}
                          </div>
                        </div>
                        {score.description && (
                          <div className="mt-3 pt-3 border-t border-purple-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Comment:</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{score.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                    No Score B evaluations yet
                  </div>
                )}
              </div>

              {/* Average Score */}
              {selectedScores.scores?.average && !isNaN(parseFloat(selectedScores.scores.average)) && (
                <div className="p-4 bg-[#072F6B]/10 border border-[#072F6B]/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#072F6B]" />
                    <span className="text-sm font-medium text-gray-700">Average Score:</span>
                    <span className="text-lg font-bold text-[#072F6B]">{selectedScores.scores.average}</span>
                    <span className="text-xs text-gray-500">/ 10</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <Button
                onClick={() => setSelectedScores(null)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
