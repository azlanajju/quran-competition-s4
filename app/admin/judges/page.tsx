"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit, Trash2, X } from "lucide-react";

interface Judge {
  id: number;
  username: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminJudges() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJudge, setEditingJudge] = useState<Judge | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    isActive: true,
  });

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/verify");
        const data = await response.json();

        if (data.success && data.authenticated) {
          fetchJudges();
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchJudges();
  }, []);

  const fetchJudges = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/judges");
      const data = await response.json();

      if (data.success) {
        setJudges(data.judges);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (judge?: Judge) => {
    if (judge) {
      setEditingJudge(judge);
      setFormData({
        username: judge.username,
        password: "",
        fullName: judge.full_name,
        isActive: judge.is_active,
      });
    } else {
      setEditingJudge(null);
      setFormData({
        username: "",
        password: "",
        fullName: "",
        isActive: true,
      });
    }
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingJudge(null);
    setFormData({
      username: "",
      password: "",
      fullName: "",
      isActive: true,
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const url = editingJudge ? "/api/admin/judges" : "/api/admin/judges";
      const method = editingJudge ? "PUT" : "POST";

      const body: any = {
        username: formData.username,
        fullName: formData.fullName,
        isActive: formData.isActive,
      };

      if (editingJudge) {
        body.id = editingJudge.id;
        if (formData.password) {
          body.password = formData.password;
        }
      } else {
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingJudge ? "Judge updated successfully" : "Judge created successfully");
        fetchJudges();
        setTimeout(() => {
          handleCloseModal();
        }, 1000);
      } else {
        setError(data.error || "Failed to save judge");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this judge? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/judges?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Judge deleted successfully");
        fetchJudges();
      } else {
        setError(data.error || "Failed to delete judge");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred");
    }
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Judge Management</h1>
              <p className="text-gray-600">Create and manage judge accounts</p>
          </div>
          <div className="flex gap-4">
              <Link href="/admin">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
            </Link>
              <Button
              onClick={() => handleOpenModal()}
                className="bg-[#072F6B] hover:bg-[#0B1A3A] text-white gap-2"
            >
                <Plus className="h-4 w-4" />
                Add Judge
              </Button>
          </div>
        </div>

        {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Judges Table */}
          <Card className="border-0 shadow-lg overflow-hidden">
          {loading ? (
              <div className="p-8 text-center text-gray-500">Loading judges...</div>
          ) : judges.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No judges found. Create your first judge account.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Full Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {judges.map((judge) => (
                      <tr key={judge.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{judge.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{judge.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              judge.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {judge.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(judge.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                            <Button
                            onClick={() => handleOpenModal(judge)}
                              size="sm"
                              variant="outline"
                              className="gap-1"
                          >
                              <Edit className="h-3 w-3" />
                            Edit
                            </Button>
                            <Button
                            onClick={() => handleDelete(judge.id)}
                              size="sm"
                              variant="outline"
                              className="gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                              <Trash2 className="h-3 w-3" />
                            Delete
                            </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </Card>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md mx-4 border-2 shadow-2xl bg-white">
            <CardContent className="pt-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{editingJudge ? "Edit Judge" : "Create Judge"}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseModal}
                  className="h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent"
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingJudge ? "(leave blank to keep current)" : "*"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingJudge}
                  minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent"
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent"
                />
              </div>

              {editingJudge && (
                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-[#072F6B] border-gray-300 rounded focus:ring-[#072F6B]"
                    />
                      <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                  <Button
                  type="submit"
                    className="flex-1 bg-[#072F6B] hover:bg-[#0B1A3A] text-white"
                >
                  {editingJudge ? "Update" : "Create"}
                  </Button>
                  <Button
                  type="button"
                  onClick={handleCloseModal}
                    variant="outline"
                >
                  Cancel
                  </Button>
              </div>
            </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

