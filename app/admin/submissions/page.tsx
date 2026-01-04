"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import VideoPlayer from "@/components/VideoPlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, TrendingUp } from "lucide-react";

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
  const [selectedVideo, setSelectedVideo] = useState<{ submissionId: number; name: string } | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [preloadVideoUrl, setPreloadVideoUrl] = useState<string | null>(null);

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
  }, [page, statusFilter, checkingAuth]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter) params.append("status", statusFilter);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Video Submissions</h1>
              <p className="text-gray-600">Review and manage video submissions</p>
            </div>
            <Link href="/admin">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Filter */}
          <Card className="mb-6 border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="max-w-xs">
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
            </CardContent>
          </Card>

          {/* Submissions Table */}
          <Card className="border-0 shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No submissions found</div>
            ) : (
              <div className="overflow-x-auto">
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
                                      {submission.scores.scoreA.score % 1 === 0 
                                        ? submission.scores.scoreA.score 
                                        : submission.scores.scoreA.score.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                                {submission.scores.scoreB && (
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-lg border border-purple-200">
                                    <span className="text-xs font-semibold text-purple-700">B:</span>
                                    <span className="text-sm font-bold text-[#072F6B]">
                                      {submission.scores.scoreB.score % 1 === 0 
                                        ? submission.scores.scoreB.score 
                                        : submission.scores.scoreB.score.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {submission.scores.average && (
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
                          {submission.processing_status === "completed" && (
                            <Button 
                              onClick={() => openVideo(submission.id, submission.full_name)} 
                              size="sm"
                              className="bg-[#072F6B] hover:bg-[#0B1A3A] text-white"
                            >
                              View Video
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
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

    </div>
  );
}
