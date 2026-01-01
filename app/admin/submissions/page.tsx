"use client";

import Header from "@/components/Header";
import VideoPlayer from "@/components/VideoPlayer";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Submission {
  id: number;
  student_id: number;
  full_name: string;
  phone: string;
  city: string;
  state: string;
  hls_master_playlist_key: string;
  hls_master_playlist_url: string;
  video_resolution: string;
  processing_status: string;
  processing_error: string | null;
  created_at: string;
}

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<{ submissionId: number; name: string } | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [page, statusFilter]);

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

  const openVideo = (submissionId: number, studentName: string) => {
    setSelectedVideo({ submissionId, name: studentName });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1A3A] to-[#0F2447]">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Video Submissions</h1>
            <p className="text-[#C7D1E0]">Review and manage video submissions</p>
          </div>
          <Link href="/admin" className="px-4 py-2 bg-white/10 border border-[#D4AF37]/50 text-white rounded-lg hover:bg-white/20 transition-all">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Filter */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-[#D4AF37]/30">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-white mb-2">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-white/10 border border-[#C9A24D] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-[#D4AF37]/30 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-white">Loading...</div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-[#C7D1E0]">No submissions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">Resolution</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{submission.full_name}</div>
                        <div className="text-sm text-[#C7D1E0]">{submission.phone}</div>
                        <div className="text-xs text-[#C7D1E0]">
                          {submission.city}, {submission.state}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#C7D1E0]">{submission.video_resolution}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${submission.processing_status === "completed" ? "bg-green-500/20 text-green-300" : submission.processing_status === "failed" ? "bg-red-500/20 text-red-300" : submission.processing_status === "processing" ? "bg-yellow-500/20 text-yellow-300" : "bg-gray-500/20 text-gray-300"}`}>{submission.processing_status}</span>
                        {submission.processing_error && <div className="text-xs text-red-400 mt-1 max-w-xs truncate">{submission.processing_error}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#C7D1E0]">{new Date(submission.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {submission.processing_status === "completed" && (
                          <button onClick={() => openVideo(submission.id, submission.full_name)} className="px-3 py-1 bg-[#4CAF50]/20 border border-[#4CAF50] text-white rounded hover:bg-[#4CAF50]/30 text-xs">
                            View Video
                          </button>
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
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <div className="text-sm text-[#C7D1E0]">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white/10 border border-[#C9A24D] rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20">
                  Previous
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-white/10 border border-[#C9A24D] rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && <VideoPlayer submissionId={selectedVideo.submissionId} studentName={selectedVideo.name} onClose={() => setSelectedVideo(null)} />}
    </div>
  );
}
