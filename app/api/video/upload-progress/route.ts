import { NextRequest, NextResponse } from "next/server";
import { uploadProgressStore } from "@/lib/upload-progress-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get("uploadId");

    if (!uploadId) {
      return NextResponse.json({ error: "Upload ID is required" }, { status: 400 });
    }

    const progress = uploadProgressStore.get(uploadId);

    if (!progress) {
      // Log for debugging - check if store is working
      console.log(`Progress not found for uploadId: ${uploadId}`);
      return NextResponse.json({ 
        success: false, 
        error: "Upload progress not found",
        message: "Upload may have completed or expired. Note: In serverless environments, progress may not persist across instances."
      }, { status: 404 });
    }

    console.log(`Progress found for uploadId: ${uploadId}`, { 
      percentage: progress.percentage, 
      status: progress.status,
      uploaded: progress.uploaded,
      total: progress.total 
    });

    return NextResponse.json({
      success: true,
      uploadId: uploadId,
      uploaded: progress.uploaded,
      total: progress.total,
      percentage: progress.percentage,
      status: progress.status,
      error: progress.error,
      // Format bytes for display
      uploadedMB: (progress.uploaded / (1024 * 1024)).toFixed(2),
      totalMB: (progress.total / (1024 * 1024)).toFixed(2),
    });
  } catch (error: any) {
    console.error("Progress tracking error:", error);
    return NextResponse.json({ error: "Failed to get upload progress", details: error.message }, { status: 500 });
  }
}

