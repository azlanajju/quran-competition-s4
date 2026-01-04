"use client";

import { useEffect, useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ConversionProgressPopupProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: number;
  studentName: string;
}

interface ConversionStatus {
  status: "idle" | "downloading" | "converting" | "uploading" | "cleaning" | "completed" | "error";
  progress: number;
  message: string;
  error?: string;
}

export default function ConversionProgressPopup({
  isOpen,
  onClose,
  submissionId,
  studentName,
}: ConversionProgressPopupProps) {
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>({
    status: "idle",
    progress: 0,
    message: "Initializing conversion...",
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset status when popup closes
      setConversionStatus({
        status: "idle",
        progress: 0,
        message: "Starting conversion...",
      });
      return;
    }

    // Reset status when popup opens
    setConversionStatus({
      status: "idle",
      progress: 0,
      message: "Starting conversion...",
    });

    let pollInterval: NodeJS.Timeout | null = null;
    let isPolling = true;

    // Poll for conversion status
    const startPolling = () => {
      pollInterval = setInterval(async () => {
        if (!isPolling) {
          if (pollInterval) clearInterval(pollInterval);
          return;
        }

        try {
          const response = await fetch(`/api/admin/submissions/${submissionId}/convert-hls/status`);
          const data = await response.json();

          if (data.success) {
            const currentStatus = data.status || "idle";
            const currentProgress = data.progress || 0;
            
            setConversionStatus({
              status: currentStatus,
              progress: currentProgress,
              message: data.message || "",
              error: data.error,
            });

            // If completed or error, stop polling immediately
            if (currentStatus === "completed" || currentStatus === "error") {
              isPolling = false;
              if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
              return; // Exit early to prevent further polling
            }

            // If status is "idle" but we were previously in progress, check if conversion actually completed
            // This handles the case where progress was cleared from memory but conversion finished
            if (currentStatus === "idle" && currentProgress === 0 && conversionStatus.status !== "idle") {
              // Check database to see if conversion completed
              const checkResponse = await fetch(`/api/admin/submissions/${submissionId}/convert-hls/status`);
              const checkData = await checkResponse.json();
              
              if (checkData.success && checkData.status === "completed") {
                setConversionStatus({
                  status: "completed",
                  progress: 100,
                  message: "Conversion completed successfully",
                });
                isPolling = false;
                if (pollInterval) {
                  clearInterval(pollInterval);
                  pollInterval = null;
                }
                return;
              }
            }
          } else {
            // If status endpoint returns error, stop polling after a few attempts
            console.warn("Status endpoint returned error, stopping polling");
            isPolling = false;
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          }
        } catch (err) {
          console.error("Error polling conversion status:", err);
          // On error, stop polling after a few attempts
          isPolling = false;
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      }, 1000); // Poll every second
    };

    startPolling();

    return () => {
      isPolling = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isOpen, submissionId]);

  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (conversionStatus.status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Loader2 className="h-6 w-6 text-[#072F6B] animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (conversionStatus.status) {
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-[#072F6B]";
    }
  };

  const getStepDetails = () => {
    const steps = [
      { key: "downloading", label: "Downloading video from S3", progress: 20 },
      { key: "converting", label: "Converting to HLS format", progress: 50 },
      { key: "uploading", label: "Uploading HLS chunks to S3", progress: 80 },
      { key: "cleaning", label: "Cleaning up and finalizing", progress: 95 },
      { key: "completed", label: "Conversion completed", progress: 100 },
    ];

    return steps.map((step, index) => {
      const isActive = conversionStatus.status === step.key;
      const isCompleted =
        steps.findIndex((s) => s.key === conversionStatus.status) > index ||
        conversionStatus.status === "completed";
      const isError = conversionStatus.status === "error" && isActive;

      return (
        <div key={step.key} className="flex items-start gap-3 py-2">
          <div className="mt-1">
            {isCompleted && !isError ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : isActive ? (
              <Loader2 className="h-5 w-5 text-[#072F6B] animate-spin" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
            )}
          </div>
          <div className="flex-1">
            <div className={`text-sm font-medium ${isActive ? getStatusColor() : isCompleted ? "text-green-600" : "text-gray-500"}`}>
              {step.label}
            </div>
            {isActive && conversionStatus.message && (
              <div className="text-xs text-gray-600 mt-1">{conversionStatus.message}</div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 shadow-2xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">Converting Video to HLS</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 bg-white">
          {/* Student Info */}
          <div className="pb-4 border-b border-gray-200">
            <div className="text-sm text-gray-600">Student:</div>
            <div className="text-lg font-semibold text-gray-900">{studentName}</div>
            <div className="text-xs text-gray-500 mt-1">Submission ID: {submissionId}</div>
          </div>

          {/* Status Header */}
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <div className={`text-lg font-semibold ${getStatusColor()}`}>
                {conversionStatus.status === "completed"
                  ? "Conversion Completed!"
                  : conversionStatus.status === "error"
                  ? "Conversion Failed"
                  : "Converting..."}
              </div>
              <div className="text-sm text-gray-600 mt-1">{conversionStatus.message}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#072F6B]">{conversionStatus.progress}%</div>
              <div className="text-xs text-gray-500">Progress</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#072F6B] to-[#0B1A3A] transition-all duration-500 ease-out"
              style={{ width: `${conversionStatus.progress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-1">{getStepDetails()}</div>

          {/* Error Message */}
          {conversionStatus.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-red-800">Error</div>
                  <div className="text-sm text-red-700 mt-1">{conversionStatus.error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            {conversionStatus.status === "completed" || conversionStatus.status === "error" ? (
              <Button onClick={onClose} className="bg-[#072F6B] hover:bg-[#0B1A3A] text-white">
                Close
              </Button>
            ) : (
              <Button variant="outline" onClick={onClose} disabled>
                Cancel (Conversion in progress...)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

