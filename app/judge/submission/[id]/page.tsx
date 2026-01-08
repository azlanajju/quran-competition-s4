"use client";

import JudgeHeader from "@/components/judge/JudgeHeader";
import JudgeSidebar from "@/components/judge/JudgeSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VideoPlayer from "@/components/VideoPlayer";
import { formatStudentId } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Submission {
  id: number;
  student_id: number;
  full_name: string;
  original_video_key: string;
  original_video_url: string;
  created_at: string;
}

interface JudgeScore {
  id: number;
  submission_id: number;
  judge_id: number;
  judge_name: string;
  judge_username?: string;
  judge_full_name?: string;
  score_type: "A" | "B";
  score: number;
  description: string | null;
  created_at: string;
  updated_at?: string;
}

export default function JudgeSubmissionPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [judge, setJudge] = useState<{ id: number; username: string; fullName: string; scoreType?: "A" | "B" | null; sequenceFrom?: number | null; sequenceTo?: number | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [descriptionA, setDescriptionA] = useState("");
  const [descriptionB, setDescriptionB] = useState("");
  const [existingScoreA, setExistingScoreA] = useState<JudgeScore | null>(null);
  const [existingScoreB, setExistingScoreB] = useState<JudgeScore | null>(null);
  const [allScoresA, setAllScoresA] = useState<JudgeScore[]>([]);
  const [allScoresB, setAllScoresB] = useState<JudgeScore[]>([]);
  const [editingA, setEditingA] = useState(false);
  const [editingB, setEditingB] = useState(false);
  const [submittingA, setSubmittingA] = useState(false);
  const [submittingB, setSubmittingB] = useState(false);
  const [messageA, setMessageA] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [messageB, setMessageB] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submissionId, setSubmissionId] = useState<string>("");

  useEffect(() => {
    // Resolve params if it's a Promise
    const resolveParams = async () => {
      const resolvedParams = await Promise.resolve(params);
      setSubmissionId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!submissionId) return;

    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/judge/auth/verify");
        const data = await response.json();

        if (data.success && data.authenticated) {
          setJudge(data.judge);
          // fetchSubmission will be called in useEffect when judge is set
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
  }, [router, submissionId]);

  const fetchSubmission = async () => {
    if (!submissionId || !judge?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/judge/submissions/${submissionId}?judgeId=${judge.id}`);
      const data = await response.json();

      if (data.success && data.submission) {
        setSubmission(data.submission);
        // Fetch existing scores
        fetchExistingScores(data.submission.id, judge.id);
      } else {
        setMessageA({ type: "error", text: data.error || "Submission not found" });
      }
    } catch (err) {
      console.error("Error fetching submission:", err);
      setMessageA({ type: "error", text: "Failed to load submission" });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingScores = async (submissionId: number, judgeId: number) => {
    try {
      // Fetch all scores for this submission (from all judges)
      const response = await fetch(`/api/judge/submissions/${submissionId}/scores`);
      const data = await response.json();

      if (data.success) {
        // Set all scores
        setAllScoresA(data.scores.A || []);
        setAllScoresB(data.scores.B || []);

        // Find current judge's scores
        const myScoreA = data.scores.A?.find((s: JudgeScore) => s.judge_id === judgeId);
        const myScoreB = data.scores.B?.find((s: JudgeScore) => s.judge_id === judgeId);

        if (myScoreA) {
          setExistingScoreA(myScoreA);
          // Ensure score is converted to string properly
          const scoreValue = typeof myScoreA.score === "number" ? myScoreA.score : parseFloat(myScoreA.score);
          setScoreA(isNaN(scoreValue) ? "" : scoreValue.toString());
          setDescriptionA(myScoreA.description || "");
          setEditingA(false); // Don't show edit mode by default
        } else {
          setExistingScoreA(null);
          setScoreA("");
          setDescriptionA("");
          setEditingA(false);
        }

        if (myScoreB) {
          setExistingScoreB(myScoreB);
          // Ensure score is converted to string properly
          const scoreValue = typeof myScoreB.score === "number" ? myScoreB.score : parseFloat(myScoreB.score);
          setScoreB(isNaN(scoreValue) ? "" : scoreValue.toString());
          setDescriptionB(myScoreB.description || "");
          setEditingB(false); // Don't show edit mode by default
        } else {
          setExistingScoreB(null);
          setScoreB("");
          setDescriptionB("");
          setEditingB(false);
        }
      }
    } catch (err) {
      console.error("Error fetching existing scores:", err);
    }
  };

  useEffect(() => {
    if (judge?.id && submissionId) {
      fetchSubmission();
    }
  }, [judge, submissionId]);

  useEffect(() => {
    if (judge?.id && submission) {
      fetchExistingScores(submission.id, judge.id);
    }
  }, [judge, submission]);

  const handleSubmitScoreA = async () => {
    if (!submission || !judge?.id) {
      setMessageA({ type: "error", text: "Missing required information" });
      return;
    }

    if (!scoreA || isNaN(parseFloat(scoreA)) || parseFloat(scoreA) < 0 || parseFloat(scoreA) > 10) {
      setMessageA({ type: "error", text: "Please enter a valid score between 0 and 10" });
      return;
    }

    setSubmittingA(true);
    setMessageA(null);

    try {
      const response = await fetch("/api/judge/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: submission.id,
          judgeId: judge.id,
          scoreType: "A",
          score: parseFloat(scoreA),
          description: descriptionA || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessageA({ type: "success", text: existingScoreA ? "Score A updated successfully!" : "Score A submitted successfully!" });
        setEditingA(false); // Exit edit mode after successful update
        // Refresh score data
        if (judge.id) {
          fetchExistingScores(submission.id, judge.id);
        }
      } else {
        setMessageA({ type: "error", text: data.error || "Failed to submit score" });
      }
    } catch (err) {
      console.error("Error submitting score A:", err);
      setMessageA({ type: "error", text: "An error occurred while submitting the score" });
    } finally {
      setSubmittingA(false);
    }
  };

  const handleSubmitScoreB = async () => {
    if (!submission || !judge?.id) {
      setMessageB({ type: "error", text: "Missing required information" });
      return;
    }

    if (!scoreB || isNaN(parseFloat(scoreB)) || parseFloat(scoreB) < 0 || parseFloat(scoreB) > 10) {
      setMessageB({ type: "error", text: "Please enter a valid score between 0 and 10" });
      return;
    }

    setSubmittingB(true);
    setMessageB(null);

    try {
      const response = await fetch("/api/judge/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: submission.id,
          judgeId: judge.id,
          scoreType: "B",
          score: parseFloat(scoreB),
          description: descriptionB || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessageB({ type: "success", text: existingScoreB ? "Score B updated successfully!" : "Score B submitted successfully!" });
        setEditingB(false); // Exit edit mode after successful update
        // Refresh score data (fetch all scores again)
        if (judge.id) {
          fetchExistingScores(submission.id, judge.id);
        }
      } else {
        setMessageB({ type: "error", text: data.error || "Failed to submit score" });
      }
    } catch (err) {
      console.error("Error submitting score B:", err);
      setMessageB({ type: "error", text: "An error occurred while submitting the score" });
    } finally {
      setSubmittingB(false);
    }
  };

  if (checkingAuth || loading) {
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

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <JudgeHeader />
        <JudgeSidebar />
        <div className="lg:ml-64 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Submission Not Found</h1>
            <Button onClick={() => router.push("/judge")} className="bg-[#072F6B] hover:bg-[#0B1A3A] text-white">
              Back to Judge Panel
            </Button>
          </div>
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
          {/* Header */}
          <div className="mb-6">
            <Button onClick={() => router.push("/judge")} variant="ghost" className="mb-4 text-[#072F6B] hover:text-[#0B1A3A] hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Submissions
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluate Submission</h1>
            <div className="flex items-center gap-4">
              <p className="text-gray-600">
                Student ID: <span className="font-semibold text-[#072F6B]">{formatStudentId(submission.student_id)}</span>
              </p>
              <p className="text-gray-600">
                Name: <span className="font-semibold text-gray-900">{submission.full_name}</span>
              </p>
            </div>
            {judge && (
              <p className="text-sm text-[#072F6B] mt-1">
                Logged in as: <span className="font-semibold">{judge.fullName}</span> ({judge.username})
              </p>
            )}
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Video Player Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Video Submission</CardTitle>
              </CardHeader>
              <CardContent>{judge && <VideoPlayer submissionId={submission.id} studentName={submission.full_name} />}</CardContent>
            </Card>

            {/* Scoring Panel - Two Separate Cards */}
            <div className={`grid gap-6 ${judge?.scoreType ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              {/* Score A Card - Only show if judge can score A or both */}
              {(!judge?.scoreType || judge.scoreType === "A") && (
                <Card>
                  <CardHeader>
                    <CardTitle>Score A</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Show all existing Score A from all judges */}
                    {allScoresA.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <p className="text-xs font-medium text-gray-700 mb-2">All Score A Evaluations:</p>
                        {allScoresA.map((score) => (
                          <div key={score.id} className={`p-3 rounded-lg border ${score.judge_id === judge?.id ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-200"}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Score: <span className="font-semibold text-[#072F6B]">{score.score}</span>
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Judge: {score.judge_full_name || score.judge_name || score.judge_username || "Unknown"}
                                  {score.judge_id === judge?.id && <span className="ml-2 text-blue-600 font-medium">(You)</span>}
                                </p>
                              </div>
                            </div>
                            {score.description && <p className="text-xs text-gray-600 mt-2">{score.description}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show current judge's existing score if any */}
                    {existingScoreA && !editingA && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-blue-600 mb-1 font-medium">Your Score A:</p>
                            <p className="text-sm text-gray-900">
                              Score: <span className="font-semibold text-[#072F6B]">{existingScoreA.score}</span>
                            </p>
                            {existingScoreA.description && <p className="text-xs text-gray-600 mt-1">{existingScoreA.description}</p>}
                          </div>
                          <Button
                            onClick={() => {
                              setEditingA(true);
                              const scoreValue = typeof existingScoreA.score === "number" ? existingScoreA.score : parseFloat(existingScoreA.score);
                              setScoreA(isNaN(scoreValue) ? "" : scoreValue.toString());
                              setDescriptionA(existingScoreA.description || "");
                              setMessageA(null); // Clear any previous messages
                            }}
                            variant="outline"
                            size="sm"
                            className="ml-2 text-[#072F6B] border-[#072F6B] hover:bg-[#072F6B] hover:text-white"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Show form when editing or when no score exists */}
                    {(editingA || !existingScoreA) && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Score A (out of 10) *</label>
                          <input type="number" step="0.01" min="0" max="10" value={scoreA} onChange={(e) => setScoreA(e.target.value)} placeholder="Enter score (0-10)" className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                          <textarea value={descriptionA} onChange={(e) => setDescriptionA(e.target.value)} placeholder="Add description or comments..." rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent resize-none" />
                        </div>
                      </div>
                    )}

                    {/* Message A */}
                    {messageA && (
                      <div className={`mt-4 p-3 rounded-lg ${messageA.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                        <p className={`text-sm ${messageA.type === "success" ? "text-green-800" : "text-red-800"}`}>{messageA.text}</p>
                      </div>
                    )}

                    {/* Submit/Cancel Buttons A */}
                    {(editingA || !existingScoreA) && (
                      <div className="flex gap-2 mt-4">
                        <Button onClick={handleSubmitScoreA} disabled={!scoreA || submittingA} className="flex-1 bg-[#072F6B] hover:bg-[#0B1A3A] text-white">
                          {submittingA ? "Submitting..." : existingScoreA ? "Update Score A" : "Submit Score A"}
                        </Button>
                        {editingA && existingScoreA && (
                          <Button
                            onClick={() => {
                              setEditingA(false);
                              if (existingScoreA) {
                                const scoreValue = typeof existingScoreA.score === "number" ? existingScoreA.score : parseFloat(existingScoreA.score);
                                setScoreA(isNaN(scoreValue) ? "" : scoreValue.toString());
                                setDescriptionA(existingScoreA.description || "");
                              }
                              setMessageA(null);
                            }}
                            variant="outline"
                            className="border-gray-300"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Score B Card - Only show if judge can score B or both */}
              {(!judge?.scoreType || judge.scoreType === "B") && (
                <Card>
                  <CardHeader>
                    <CardTitle>Score B</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Show all existing Score B from all judges */}
                    {allScoresB.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <p className="text-xs font-medium text-gray-700 mb-2">All Score B Evaluations:</p>
                        {allScoresB.map((score) => (
                          <div key={score.id} className={`p-3 rounded-lg border ${score.judge_id === judge?.id ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200"}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Score: <span className="font-semibold text-[#072F6B]">{score.score}</span>
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Judge: {score.judge_full_name || score.judge_name || score.judge_username || "Unknown"}
                                  {score.judge_id === judge?.id && <span className="ml-2 text-green-600 font-medium">(You)</span>}
                                </p>
                              </div>
                            </div>
                            {score.description && <p className="text-xs text-gray-600 mt-2">{score.description}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show current judge's existing score if any */}
                    {existingScoreB && !editingB && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-green-600 mb-1 font-medium">Your Score B:</p>
                            <p className="text-sm text-gray-900">
                              Score: <span className="font-semibold text-[#072F6B]">{existingScoreB.score}</span>
                            </p>
                            {existingScoreB.description && <p className="text-xs text-gray-600 mt-1">{existingScoreB.description}</p>}
                          </div>
                          <Button
                            onClick={() => {
                              setEditingB(true);
                              const scoreValue = typeof existingScoreB.score === "number" ? existingScoreB.score : parseFloat(existingScoreB.score);
                              setScoreB(isNaN(scoreValue) ? "" : scoreValue.toString());
                              setDescriptionB(existingScoreB.description || "");
                              setMessageB(null); // Clear any previous messages
                            }}
                            variant="outline"
                            size="sm"
                            className="ml-2 text-[#072F6B] border-[#072F6B] hover:bg-[#072F6B] hover:text-white"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Show form when editing or when no score exists */}
                    {(editingB || !existingScoreB) && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Score B (out of 10) *</label>
                          <input type="number" step="0.01" min="0" max="10" value={scoreB} onChange={(e) => setScoreB(e.target.value)} placeholder="Enter score (0-10)" className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                          <textarea value={descriptionB} onChange={(e) => setDescriptionB(e.target.value)} placeholder="Add description or comments..." rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#072F6B] focus:border-transparent resize-none" />
                        </div>
                      </div>
                    )}

                    {/* Message B */}
                    {messageB && (
                      <div className={`mt-4 p-3 rounded-lg ${messageB.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                        <p className={`text-sm ${messageB.type === "success" ? "text-green-800" : "text-red-800"}`}>{messageB.text}</p>
                      </div>
                    )}

                    {/* Submit/Cancel Buttons B */}
                    {(editingB || !existingScoreB) && (
                      <div className="flex gap-2 mt-4">
                        <Button onClick={handleSubmitScoreB} disabled={!scoreB || submittingB} className="flex-1 bg-[#072F6B] hover:bg-[#0B1A3A] text-white">
                          {submittingB ? "Submitting..." : existingScoreB ? "Update Score B" : "Submit Score B"}
                        </Button>
                        {editingB && existingScoreB && (
                          <Button
                            onClick={() => {
                              setEditingB(false);
                              if (existingScoreB) {
                                const scoreValue = typeof existingScoreB.score === "number" ? existingScoreB.score : parseFloat(existingScoreB.score);
                                setScoreB(isNaN(scoreValue) ? "" : scoreValue.toString());
                                setDescriptionB(existingScoreB.description || "");
                              }
                              setMessageB(null);
                            }}
                            variant="outline"
                            className="border-gray-300"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
