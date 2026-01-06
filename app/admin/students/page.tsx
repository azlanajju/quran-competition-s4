"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import VideoPlayer from "@/components/VideoPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X, FileText, Eye, Play, Calendar } from "lucide-react";

interface Student {
  id: number;
  full_name: string;
  phone: string;
  date_of_birth: string;
  city: string;
  state: string;
  status: string;
  created_at: string;
  video_count: number;
  last_video_date: string | null;
  latest_submission_id: number | null;
  id_card_key: string | null;
  id_card_url: string | null;
}

export default function AdminStudents() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIdCard, setSelectedIdCard] = useState<{ studentId: number; signedUrl: string; fileName: string } | null>(null);
  const [loadingIdCard, setLoadingIdCard] = useState(false);
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
          fetchStudents();
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
      fetchStudents();
    }
  }, [page, statusFilter, search, dateFrom, dateTo, checkingAuth]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter) params.append("status", statusFilter);
      if (search) params.append("search", search);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(`/api/admin/students?${params}`);
      const data = await response.json();

      if (data.success) {
        setStudents(data.students);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (studentId: number, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const viewIdCard = async (studentId: number) => {
    try {
      setLoadingIdCard(true);
      const response = await fetch(`/api/admin/students/${studentId}/id-card`);
      const data = await response.json();

      if (data.success && data.signedUrl) {
        const fileName = data.idCardKey.split("/").pop() || "id-card";
        setSelectedIdCard({
          studentId,
          signedUrl: data.signedUrl,
          fileName,
        });
      } else {
        alert(data.error || "Failed to load ID card");
      }
    } catch (err) {
      console.error("Error loading ID card:", err);
      alert("Failed to load ID card");
    } finally {
      setLoadingIdCard(false);
    }
  };

  const openVideo = async (submissionId: number, studentName: string) => {
    setIsLoadingVideo(true);
    
    try {
      const response = await fetch(`/api/video/signed-url?submissionId=${submissionId}&type=original`);
      const data = await response.json();
      if (data.success && data.signedUrl) {
        setPreloadVideoUrl(data.signedUrl);
      }
      setSelectedVideo({ submissionId, name: studentName });
      setIsLoadingVideo(false);
    } catch (err) {
      console.error("Error fetching video URL:", err);
      setIsLoadingVideo(false);
    }
  };

  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
    setPage(1);
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
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">Student Registrations</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage and review student registrations</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, phone, or city..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent"
              />
            </div>
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
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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

        {/* Students Table */}
          <Card className="border-0 shadow-lg overflow-hidden">
          {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : students.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No students found</div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Videos
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      ID Card
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Registered
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                          <div className="text-sm text-gray-500">
                          DOB: {new Date(student.date_of_birth).toLocaleDateString()}
                        </div>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {student.phone}
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {student.city}, {student.state}
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{student.video_count || 0}</span>
                          {student.latest_submission_id && student.video_count > 0 && (
                            <Button
                              onClick={() => openVideo(student.latest_submission_id!, student.full_name)}
                              disabled={isLoadingVideo}
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                            >
                              <Play className="h-3.5 w-3.5" />
                              View Video
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.id_card_key ? (
                          <Button
                            onClick={() => viewIdCard(student.id)}
                            disabled={loadingIdCard}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View ID Card
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-400">No ID card</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(student.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(student.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            student.status === "approved"
                                ? "bg-green-100 text-green-800"
                              : student.status === "rejected"
                                ? "bg-red-100 text-red-800"
                              : student.status === "reviewed"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={student.status}
                          onChange={(e) => updateStatus(student.id, e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent"
                        >
                          <option value="pending">Pending</option>
                          <option value="submitted">Submitted</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {students.map((student) => (
                  <div key={student.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{student.full_name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          DOB: {new Date(student.date_of_birth).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{student.phone}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {student.city}, {student.state}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                          student.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : student.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : student.status === "reviewed"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {student.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-gray-500">Videos:</span>
                        <span className="ml-1 text-gray-900 font-medium">{student.video_count || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Registered:</span>
                        <span className="ml-1 text-gray-900">{new Date(student.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                      {student.latest_submission_id && student.video_count > 0 && (
                        <Button
                          onClick={() => openVideo(student.latest_submission_id!, student.full_name)}
                          disabled={isLoadingVideo}
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5" />
                          View Video
                        </Button>
                      )}
                      {student.id_card_key ? (
                        <Button
                          onClick={() => viewIdCard(student.id)}
                          disabled={loadingIdCard}
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View ID Card
                        </Button>
                      ) : (
                        <div className="text-xs text-gray-400 text-center py-2">No ID card</div>
                      )}
                      <select
                        value={student.status}
                        onChange={(e) => updateStatus(student.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent"
                      >
                        <option value="pending">Pending</option>
                        <option value="submitted">Submitted</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
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

          {/* Loading Overlay for Video */}
          {isLoadingVideo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#072F6B]"></div>
                <div className="text-gray-700 font-medium">Loading video...</div>
                <div className="text-sm text-gray-500">Please wait</div>
              </div>
            </div>
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

          {/* ID Card Modal */}
          {selectedIdCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
              <div className="relative w-full max-w-4xl h-[95vh] sm:h-[90vh] max-h-[800px] bg-white rounded-xl border-2 border-gray-200 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">ID Card - Student ID: {selectedIdCard.studentId}</h3>
                    <p className="text-sm text-gray-600">{selectedIdCard.fileName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedIdCard(null)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* ID Card Content */}
                <div className="relative bg-gray-100 flex-1 flex items-center justify-center overflow-auto p-4">
                  {selectedIdCard.signedUrl.endsWith(".pdf") ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <iframe
                        src={selectedIdCard.signedUrl}
                        className="w-full h-full min-h-[600px] border-0 rounded-lg"
                        title="ID Card PDF"
                      />
                      <div className="absolute bottom-4 right-4">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <a href={selectedIdCard.signedUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4" />
                            Open in New Tab
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={selectedIdCard.signedUrl}
                        alt="ID Card"
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

