import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Segment key is required" }, { status: 400 });
    }

    // Proxy the segment through our server to avoid CORS issues
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    try {
      const response = await s3Client.send(command);

      // Determine content type
      let contentType = "video/mp2t";
      if (key.endsWith(".m3u8")) {
        contentType = "application/vnd.apple.mpegurl";
      }

      // Return the stream directly - Next.js can handle ReadableStream
      return new NextResponse(response.Body as any, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    } catch (error: any) {
      console.error("Error fetching segment from S3:", error);
      return NextResponse.json({ error: "Failed to fetch segment", details: error.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Segment proxy error:", error);
    return NextResponse.json({ error: "Failed to proxy segment", details: error.message }, { status: 500 });
  }
}
