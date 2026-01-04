"use client";

import JudgeHeader from "@/components/judge/JudgeHeader";
import JudgeSidebar from "@/components/judge/JudgeSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Award, CheckCircle2, XCircle } from "lucide-react";

// Format date consistently to avoid hydration issues
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

interface Evaluation {
  submission_id: number;
  student_name: string;
  student_phone: string;
  student_city: string;
  student_state: string;
  score_a: number | null;
  score_b: number | null;
  description_a: string | null;
  description_b: string | null;
  submitted_at: string;
  created_at: string;
}

export default function JudgeEvaluationsPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [judge, setJudge] = useState<{ id: number; username: string; fullName: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/judge/auth/verify");
        const data = await response.json();

        if (data.success && data.authenticated) {
          setJudge(data.judge);
          fetchEvaluations(data.judge.id);
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
  }, [router, page]);

  const fetchEvaluations = async (judgeId: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      const response = await fetch(`/api/judge/evaluations?judgeId=${judgeId}&${params}`);
      const data = await response.json();

      if (data.success) {
        setEvaluations(data.evaluations);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score: number | null | string) => {
    if (score === null || score === undefined) return "—";
    // Convert to number if it's a string
    const numScore = typeof score === "string" ? parseFloat(score) : score;
    if (isNaN(numScore)) return "—";
    const formatted = parseFloat(numScore.toFixed(1));
    return formatted % 1 === 0 ? formatted.toString() : formatted.toFixed(1);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Evaluations</h1>
            <p className="text-gray-600">View all submissions you have evaluated</p>
            {judge && (
              <p className="text-sm text-[#072F6B] mt-2">
                Logged in as: <span className="font-semibold">{judge.fullName}</span> ({judge.username})
              </p>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-gray-600">Loading evaluations...</div>
              ) : evaluations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Award className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p>No evaluations found</p>
                  <p className="text-sm text-gray-400 mt-2">Start evaluating submissions from the dashboard</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Score A</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Score B</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Evaluated</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {evaluations.map((evaluation) => {
                          const hasScoreA = evaluation.score_a !== null;
                          const hasScoreB = evaluation.score_b !== null;
                          const isComplete = hasScoreA && hasScoreB;
                          
                          return (
                            <tr key={evaluation.submission_id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{evaluation.student_name}</div>
                                <div className="text-sm text-gray-600">{evaluation.student_phone}</div>
                                <div className="text-xs text-gray-500">
                                  {evaluation.student_city}, {evaluation.student_state}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {hasScoreA ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {formatScore(evaluation.score_a)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {hasScoreB ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {formatScore(evaluation.score_b)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {isComplete ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Complete
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                    <XCircle className="w-4 h-4" />
                                    Partial
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(evaluation.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Button 
                                  onClick={() => router.push(`/judge/submission/${evaluation.submission_id}`)} 
                                  variant="outline"
                                  size="sm"
                                  className="text-[#072F6B] border-[#072F6B] hover:bg-[#072F6B] hover:text-white"
                                >
                                  View / Edit
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
                        <Button 
                          onClick={() => setPage((p) => Math.max(1, p - 1))} 
                          disabled={page === 1} 
                          variant="outline"
                          className="disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </Button>
                        <Button 
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
                          disabled={page === totalPages} 
                          variant="outline"
                          className="disabled:opacity-50 disabled:cursor-not-allowed"
                        >
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

