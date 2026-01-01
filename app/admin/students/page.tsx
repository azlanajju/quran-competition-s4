"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";

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
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchStudents();
  }, [page, statusFilter, search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter) params.append("status", statusFilter);
      if (search) params.append("search", search);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1A3A] to-[#0F2447]">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Student Registrations</h1>
            <p className="text-[#C7D1E0]">Manage and review student registrations</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-white/10 border border-[#D4AF37]/50 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-[#D4AF37]/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, phone, or city..."
                className="w-full px-4 py-2 bg-white/10 border border-[#C9A24D] rounded-md text-white placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
            <div>
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
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-[#D4AF37]/30 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-white">Loading...</div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-[#C7D1E0]">No students found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                      Videos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{student.full_name}</div>
                        <div className="text-sm text-[#C7D1E0]">
                          DOB: {new Date(student.date_of_birth).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#C7D1E0]">
                        {student.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#C7D1E0]">
                        {student.city}, {student.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {student.video_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            student.status === "approved"
                              ? "bg-green-500/20 text-green-300"
                              : student.status === "rejected"
                              ? "bg-red-500/20 text-red-300"
                              : student.status === "reviewed"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={student.status}
                          onChange={(e) => updateStatus(student.id, e.target.value)}
                          className="px-3 py-1 bg-white/10 border border-[#C9A24D] rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
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
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <div className="text-sm text-[#C7D1E0]">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white/10 border border-[#C9A24D] rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white/10 border border-[#C9A24D] rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

