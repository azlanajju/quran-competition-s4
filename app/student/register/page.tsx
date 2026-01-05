"use client";

import FileUpload from "@/components/FileUpload";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SuccessPopup from "@/components/SuccessPopup";
import { Button } from "@/components/ui/button";
import UploadProgressOverlay from "@/components/UploadProgressOverlay";
import VideoUpload from "@/components/VideoUpload";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

// Form validation schema - all fields are mandatory
const registrationSchema = z.object({
  fullName: z.string().min(1, "Full name is required").min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(1, "Phone number is required").min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      return actualAge >= 5 && actualAge <= 18; // Age validation as per competition rules
    }, "Age must be between 5 and 18 years"),
  address: z.string().min(1, "Address is required").min(10, "Address must be at least 10 characters"),
  city: z.string().min(1, "City is required").min(2, "City must be at least 2 characters"),
  state: z.string().min(1, "State is required").min(2, "State must be at least 2 characters"),
  zipCode: z.string().min(1, "Zip code is required").min(5, "Zip code must be at least 5 characters"),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function StudentRegistration() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [isUploading, setIsUploading] = useState(false); // Lock to prevent concurrent uploads
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successData, setSuccessData] = useState<{
    studentId: number | null;
    submissionId: number | null;
    studentName: string;
  }>({
    studentId: null,
    submissionId: null,
    studentName: "",
  });
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState<{
    studentId: number;
    hasVideo: boolean;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const previousErrorsRef = useRef<typeof errors>({});

  // Show toast notifications for form validation errors
  useEffect(() => {
    // Only show toast for new errors (not previously shown errors)
    const currentErrorKeys = Object.keys(errors);
    const previousErrorKeys = Object.keys(previousErrorsRef.current);

    // Find new errors (errors that weren't present before)
    const newErrors = currentErrorKeys.filter((key) => !previousErrorKeys.includes(key));

    newErrors.forEach((errorKey) => {
      const error = errors[errorKey as keyof typeof errors];
      if (error?.message) {
        toast.error(error.message as string);
      }
    });

    previousErrorsRef.current = errors;
  }, [errors]);

  // Prevent navigation/closing during upload
  useEffect(() => {
    if (isSubmitting) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "Your registration is being uploaded. Are you sure you want to leave?";
        return e.returnValue;
      };

      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [isSubmitting]);

  // Upload file directly to S3 with presigned URL and REAL progress tracking
  const uploadToS3WithProgress = (file: File, presignedUrl: string, onProgress: (progress: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track REAL upload progress (bytes uploaded / total bytes)
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && e.total > 0) {
          // Calculate real progress: bytes uploaded / total bytes * 100
          const progress = Math.min(100, Math.max(0, (e.loaded / e.total) * 100));
          onProgress(progress);
        } else if (e.loaded > 0) {
          // If total is unknown but we have loaded bytes, show indeterminate progress
          onProgress(50); // Show 50% as placeholder
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during S3 upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("S3 upload was aborted"));
      });

      // Upload directly to S3 using presigned URL
      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
      xhr.send(file);
    });
  };

  // Upload file with REAL progress tracking using XMLHttpRequest (for ID card)
  const uploadFileWithProgress = (url: string, formData: FormData, onProgress: (progress: number) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track REAL upload progress (bytes uploaded / total bytes)
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && e.total > 0) {
          // Calculate real progress: bytes uploaded / total bytes * 100
          const progress = Math.min(100, Math.max(0, (e.loaded / e.total) * 100));
          onProgress(progress);
        } else if (e.loaded > 0) {
          // If total is unknown but we have loaded bytes, show indeterminate progress
          // This shouldn't happen often, but handle it gracefully
          onProgress(50); // Show 50% as placeholder
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Set progress to 90% on upload completion to server
            // Progress will gradually increase from 90% to 100% after upload
            onProgress(90);
            // Create a Response-like object
            const mockResponse = {
              ok: true,
              status: xhr.status,
              json: async () => response,
            };
            resolve(mockResponse);
          } catch (e) {
            reject(new Error("Failed to parse response"));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed - network error"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted"));
      });

      // Start the upload
      xhr.open("POST", url);
      xhr.send(formData);
    });
  };

  const onSubmit = async (data: RegistrationFormData) => {
    // Prevent multiple simultaneous submissions
    if (isUploading || isSubmitting) {
      return;
    }

    if (!videoFile) {
      toast.error("Please upload a video file");
      return;
    }

    if (!idCardFile) {
      toast.error("Please upload an ID card proof");
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true); // Lock upload
    setUploadProgress(0);
    setUploadedBytes(0);
    setTotalBytes(idCardFile.size + videoFile.size);
    setCurrentStep("Preparing your submission...");

    try {
      // Step 1: Upload ID card first - ONE FILE AT A TIME
      setCurrentStep("Uploading ID card proof...");
      const idCardFormData = new FormData();
      idCardFormData.append("file", idCardFile);

      // ID card upload: 0-20% of total progress
      // Wait for this upload to complete before proceeding
      const idCardUploadResponse = await uploadFileWithProgress("/api/upload/file", idCardFormData, (progress) => {
        // Real progress: 0-20% based on actual bytes uploaded
        const totalProgress = progress * 0.2;
        setUploadProgress(Math.round(totalProgress * 10) / 10); // Round to 1 decimal
        // Track actual bytes uploaded
        const bytesUploaded = (progress / 100) * idCardFile.size;
        setUploadedBytes(bytesUploaded);
      });

      if (!idCardUploadResponse.ok) {
        const errorData = await idCardUploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload ID card");
      }

      const { fileKey: idCardFileKey, fileUrl: idCardFileUrl } = await idCardUploadResponse.json();
      setUploadProgress(20);
      setUploadedBytes(idCardFile.size); // ID card fully uploaded

      // Step 2: Register student with ID card reference
      // Wait for registration to complete before uploading video
      setCurrentStep("Registering your information...");
      const registrationResponse = await fetch("/api/student/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          idCardKey: idCardFileKey,
          idCardUrl: idCardFileUrl || `s3://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || "bucket"}/${idCardFileKey}`,
        }),
      });

      if (!registrationResponse.ok) {
        const errorData = await registrationResponse.json().catch(() => ({}));
        // Check if it's a duplicate phone number error
        if (registrationResponse.status === 409 && errorData.duplicate) {
          // Check if video already exists
          if (errorData.hasVideo) {
            setIsSubmitting(false);
            setIsUploading(false);
            setUploadProgress(0);
            setCurrentStep("");
            throw new Error(errorData.message || "A registration with this phone number already exists and has a video submission.");
          }
          // Show modal to ask if user wants to upload only video
          setDuplicateData({
            studentId: errorData.studentId,
            hasVideo: errorData.hasVideo,
            message: errorData.message || "A registration with this phone number already exists. Would you like to upload only the video?",
          });
          setShowDuplicateModal(true);
          setIsSubmitting(false);
          setIsUploading(false);
          setUploadProgress(0);
          setCurrentStep("");
          return; // Exit early, user will decide via modal
        }
        throw new Error(errorData.error || "Failed to complete registration");
      }

      setUploadProgress(30);
      const { studentId } = await registrationResponse.json();

      // Step 3: Upload video directly to S3 - ONLY AFTER ID CARD IS COMPLETE
      // This ensures only one file uploads at a time
      setCurrentStep("Uploading your video...");

      // Step 3a: Get presigned URL from server
      const presignedUrlResponse = await fetch("/api/video/presigned-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId.toString(),
          fileName: videoFile.name,
          fileType: videoFile.type,
          fileSize: videoFile.size,
        }),
      });

      if (!presignedUrlResponse.ok) {
        const errorData = await presignedUrlResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      const { presignedUrl, videoKey } = await presignedUrlResponse.json();

      // Step 3b: Upload directly to S3 with real progress tracking
      // Video upload: 30-100% (direct to S3, no server in between)
      await uploadToS3WithProgress(videoFile, presignedUrl, (progress) => {
        // Real progress: 30% + (video progress * 70%)
        // When upload to S3 completes (progress = 100%), we get: 30 + (100 * 0.70) = 100%
        const totalProgress = 30 + progress * 0.7;
        setUploadProgress(Math.round(totalProgress * 10) / 10);
        // Track actual bytes uploaded (ID card already done + video progress)
        const videoBytesUploaded = (progress / 100) * videoFile.size;
        setUploadedBytes(idCardFile.size + videoBytesUploaded);
      });

      // Step 3c: Notify server that upload is complete
      setCurrentStep("Finalizing...");
      const uploadCompleteResponse = await fetch("/api/video/upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId.toString(),
          videoKey: videoKey,
        }),
      });

      if (!uploadCompleteResponse.ok) {
        const errorData = await uploadCompleteResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to complete upload");
      }

      const videoData = await uploadCompleteResponse.json();

      // Video uploaded successfully - progress already at 100%
      setUploadedBytes(totalBytes);

      // Store success data for popup
      setSuccessData({
        studentId: parseInt(studentId),
        submissionId: videoData.submissionId || null,
        studentName: data.fullName,
      });

      // Reset form first
      reset();
      setVideoFile(null);
      setIdCardFile(null);

      // Close overlay and show success popup
      setIsSubmitting(false);
      setIsUploading(false); // Release upload lock

      // Reset progress
      setUploadProgress(0);
      setCurrentStep("");
      setUploadedBytes(0);
      setTotalBytes(0);

      // Show success popup
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred during registration");
      setIsSubmitting(false);
      setIsUploading(false); // Release upload lock on error
      setUploadProgress(0);
      setCurrentStep("");
      setUploadedBytes(0);
      setTotalBytes(0);
    }
  };

  // Handle video-only upload for duplicate registrations
  const handleVideoOnlyUpload = async () => {
    if (!duplicateData || !videoFile) {
      toast.error("Video file is required");
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);
    setShowDuplicateModal(false);

    try {
      setUploadProgress(0);
      setCurrentStep("Uploading your video...");
      setTotalBytes(videoFile.size);
      setUploadedBytes(0);

      const videoFormData = new FormData();
      videoFormData.append("video", videoFile);
      videoFormData.append("studentId", duplicateData.studentId.toString());

      // Step 1: Get presigned URL from server
      const presignedUrlResponse = await fetch("/api/video/presigned-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: duplicateData.studentId.toString(),
          fileName: videoFile.name,
          fileType: videoFile.type,
          fileSize: videoFile.size,
        }),
      });

      if (!presignedUrlResponse.ok) {
        const errorData = await presignedUrlResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      const { presignedUrl, videoKey } = await presignedUrlResponse.json();

      // Step 2: Upload directly to S3 with real progress tracking
      // Video upload: 0-100% (direct to S3, no server in between)
      await uploadToS3WithProgress(videoFile, presignedUrl, (progress) => {
        setUploadProgress(Math.round(progress * 10) / 10); // Real progress 0-100%
        const videoBytesUploaded = (progress / 100) * videoFile.size;
        setUploadedBytes(videoBytesUploaded);
      });

      // Step 3: Notify server that upload is complete
      setCurrentStep("Finalizing...");
      const uploadCompleteResponse = await fetch("/api/video/upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: duplicateData.studentId.toString(),
          videoKey: videoKey,
        }),
      });

      if (!uploadCompleteResponse.ok) {
        const errorData = await uploadCompleteResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to complete upload");
      }

      const videoData = await uploadCompleteResponse.json();

      setUploadProgress(100);
      setUploadedBytes(totalBytes);

      // Store success data for popup
      setSuccessData({
        studentId: duplicateData.studentId,
        submissionId: videoData.submissionId || null,
        studentName: "", // We don't have the name in duplicate case
      });

      // Reset form
      reset();
      setVideoFile(null);
      setIdCardFile(null);
      setDuplicateData(null);

      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentStep("");
      setUploadedBytes(0);
      setTotalBytes(0);

      // Show success popup
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Video upload error:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred during video upload");
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentStep("");
      setUploadedBytes(0);
      setTotalBytes(0);
      setDuplicateData(null);
    }
  };

  return (
    <>
      {/* Upload Progress Overlay */}
      <UploadProgressOverlay progress={uploadProgress} currentStep={currentStep} isVisible={isSubmitting} uploadedBytes={uploadedBytes} totalBytes={totalBytes} />

      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => {
          setShowSuccessPopup(false);
        }}
        studentId={successData.studentId}
        submissionId={successData.submissionId}
        studentName={successData.studentName}
      />

      {/* Duplicate Registration Modal */}
      {showDuplicateModal && duplicateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-[90vw] max-w-md bg-gradient-to-br from-[#0A1F3D] to-[#1a3a5f] rounded-xl border-2 border-[#D4AF37]/50 shadow-2xl p-6 sm:p-8">
            <div className="text-center">
              <div className="mb-4 text-4xl">⚠️</div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#D4AF37] mb-4">Registration Already Exists</h3>
              <p className="text-sm sm:text-base text-[#FFFFFF] mb-6 opacity-90">{duplicateData.message}</p>

              {!duplicateData.hasVideo && videoFile && (
                <div className="space-y-4">
                  <p className="text-xs sm:text-sm text-[#C7D1E0] opacity-75">You can upload your video without re-registering.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={handleVideoOnlyUpload} className="bg-[#4CAF50]/20 backdrop-blur-sm border-2 border-[#4CAF50] text-[#FFFFFF] hover:bg-[#4CAF50]/30 font-semibold px-6 py-3 rounded-xl transition-all duration-300">
                      Yes, Upload Video Only
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDuplicateModal(false);
                        setDuplicateData(null);
                      }}
                      variant="outline"
                      className="border-2 border-[#C9A24D]/50 text-[#FFFFFF] hover:bg-white/10 font-semibold px-6 py-3 rounded-xl transition-all duration-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {duplicateData.hasVideo && (
                <Button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setDuplicateData(null);
                  }}
                  variant="outline"
                  className="border-2 border-[#C9A24D]/50 text-[#FFFFFF] hover:bg-white/10 font-semibold px-6 py-3 rounded-xl transition-all duration-300"
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen islamic-pattern relative overflow-hidden" style={{ background: "linear-gradient(135deg,rgb(16, 31, 56) 0%,rgb(0, 0, 0) 50%,rgb(20, 47, 86) 100%)" }}>
        <Header />

        <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-40 pb-12 sm:pb-16 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              {/* Trust Logo */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <Image src="/images/trust_white.png" alt="Dr Abdul Shakeel Charitable Trust" width={120} height={50} className="object-contain" priority />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#FFFFFF] mb-3 sm:mb-4 leading-tight">
                Student <span className="bg-gradient-to-r from-[#D4AF37] via-[#F2D27A] to-[#D4AF37] bg-clip-text text-transparent">Registration</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#C7D1E0] mb-4 sm:mb-5 md:mb-6 max-w-2xl mx-auto">Register for Qiraat Competition Season-4</p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">Age: 10-16 Years</div>
                <div className="bg-[#4CAF50]/20 border border-[#4CAF50]/50 text-[#4CAF50] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">Registration: Jan 10-20, 2026</div>
              </div>

              {/* Information Banner */}
              <div className="bg-[#D4AF37]/10 backdrop-blur-sm border border-[#D4AF37]/30 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 max-w-3xl mx-auto">
                <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                  <div className="text-lg sm:text-xl md:text-2xl flex-shrink-0">ℹ️</div>
                  <div className="text-left text-[#C7D1E0] text-xs sm:text-sm md:text-base space-y-1 sm:space-y-2">
                    <p className="font-semibold text-[#D4AF37] text-xs sm:text-sm md:text-base">Important Information:</p>
                    <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 ml-1 sm:ml-2">
                      <li>All fields marked with * are required</li>
                      <li>Upload a 2-minute recitation video (MP4, WebM, or other supported formats)</li>
                      <li>Provide a valid ID card proof (JPG, PNG, or PDF - Max 5MB)</li>
                      <li>Ensure you are between 10-16 years of age</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Form Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border border-[#D4AF37]/20 p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6 md:space-y-8">
                {/* Personal Information */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-[#D4AF37]/20">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-[#D4AF37] mb-4 sm:mb-5 md:mb-6 flex items-center gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl md:text-2xl">📋</span>
                    <span>Personal Information</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    <div>
                      <label htmlFor="fullName" className="block text-xs sm:text-sm font-semibold text-[#FFFFFF] mb-1.5 sm:mb-2">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input {...register("fullName")} type="text" id="fullName" className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border border-[#C9A24D]/50 rounded-lg text-sm sm:text-base text-[#FFFFFF] placeholder-[#C7D1E0]/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder="Enter your full name" />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-xs sm:text-sm font-semibold text-[#FFFFFF] mb-1.5 sm:mb-2">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input {...register("phone")} type="tel" id="phone" className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border border-[#C9A24D]/50 rounded-lg text-sm sm:text-base text-[#FFFFFF] placeholder-[#C7D1E0]/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder="+91 1234567890" />
                    </div>

                    <div className="md:col-span-2 w-full">
                      <label htmlFor="dateOfBirth" className="block text-xs sm:text-sm font-semibold text-[#FFFFFF] mb-1 sm:mb-1.5 md:mb-2">
                        Date of Birth <span className="text-red-400">*</span>
                      </label>
                      <input {...register("dateOfBirth")} type="date" id="dateOfBirth" className="w-full max-w-[280px] sm:max-w-full box-border px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 lg:py-3 bg-white/10 backdrop-blur-sm border border-[#C9A24D]/50 rounded-md sm:rounded-lg text-xs sm:text-sm md:text-base text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all [color-scheme:dark]" style={{ maxWidth: "280px", fontSize: "0.75rem" }} />
                      <p className="mt-1 sm:mt-1.5 md:mt-2 text-xs text-[#C7D1E0]/70">Age must be between 10-16 years</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-[#D4AF37]/20">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-[#D4AF37] mb-4 sm:mb-5 md:mb-6 flex items-center gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl md:text-2xl">📍</span>
                    <span>Address Information</span>
                  </h2>
                  <div className="space-y-4 sm:space-y-5 md:space-y-6">
                    <div>
                      <label htmlFor="address" className="block text-xs sm:text-sm font-semibold text-[#FFFFFF] mb-1.5 sm:mb-2">
                        Street Address <span className="text-red-400">*</span>
                      </label>
                      <input {...register("address")} type="text" id="address" className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border border-[#C9A24D]/50 rounded-lg text-sm sm:text-base text-[#FFFFFF] placeholder-[#C7D1E0]/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder="Enter your street address" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                      <div>
                        <label htmlFor="city" className="block text-xs sm:text-sm font-semibold text-[#FFFFFF] mb-1.5 sm:mb-2">
                          City <span className="text-red-400">*</span>
                        </label>
                        <input {...register("city")} type="text" id="city" className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border border-[#C9A24D]/50 rounded-lg text-sm sm:text-base text-[#FFFFFF] placeholder-[#C7D1E0]/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder="City" />
                      </div>

                      <div>
                        <label htmlFor="state" className="block text-xs sm:text-sm font-semibold text-[#FFFFFF] mb-1.5 sm:mb-2">
                          State <span className="text-red-400">*</span>
                        </label>
                        <input {...register("state")} type="text" id="state" className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border border-[#C9A24D]/50 rounded-lg text-sm sm:text-base text-[#FFFFFF] placeholder-[#C7D1E0]/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder="State" />
                      </div>

                      <div>
                        <label htmlFor="zipCode" className="block text-xs sm:text-sm font-semibold text-[#FFFFFF] mb-1.5 sm:mb-2">
                          Zip Code <span className="text-red-400">*</span>
                        </label>
                        <input {...register("zipCode")} type="text" id="zipCode" className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border border-[#C9A24D]/50 rounded-lg text-sm sm:text-base text-[#FFFFFF] placeholder-[#C7D1E0]/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder="Zip Code" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ID Card Proof Upload */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-[#D4AF37]/20">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-[#D4AF37] mb-4 sm:mb-5 md:mb-6 flex items-center gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl md:text-2xl">🆔</span>
                    <span>
                      ID Card Proof <span className="text-red-400">*</span>
                    </span>
                  </h2>
                  <FileUpload
                    onFileSelect={(file) => setIdCardFile(file || null)}
                    value={idCardFile}
                    maxSize={5 * 1024 * 1024} // 5MB
                    acceptedFormats={["image/jpeg", "image/png", "image/jpg", "application/pdf"]}
                    label="ID Card Proof (Required)"
                    acceptLabel="JPG, PNG, PDF"
                  />
                  {!idCardFile && (
                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-[#C7D1E0]/80 flex items-center gap-1.5 sm:gap-2">
                      <span>ℹ️</span>
                      <span>Please upload your ID card proof (Max 5MB)</span>
                    </p>
                  )}
                </div>

                {/* Video Upload */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-[#D4AF37]/20">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-[#D4AF37] mb-4 sm:mb-5 md:mb-6 flex items-center gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl md:text-2xl">🎥</span>
                    <span>
                      Recitation Video Upload <span className="text-red-400">*</span>
                    </span>
                  </h2>
                  <VideoUpload onVideoSelect={(file) => setVideoFile(file)} value={videoFile} acceptedFormats={["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/avi", "video/x-matroska"]} />
                  {!videoFile && (
                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-[#C7D1E0]/80 flex items-center gap-1.5 sm:gap-2">
                      <span>ℹ️</span>
                      <span>Upload a 2-minute recitation video (MP4, WebM, or other supported formats)</span>
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-3 sm:pt-4">
                  <Button type="submit" disabled={isSubmitting || isUploading || !videoFile || !idCardFile} className="w-full bg-[#4CAF50]/20 backdrop-blur-sm border-2 border-[#4CAF50] text-[#FFFFFF] hover:bg-[#4CAF50]/30 font-semibold shadow-xl shadow-[#4CAF50]/20 py-2.5 sm:py-3 h-auto rounded-lg sm:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm sm:text-base hover:scale-[1.02]" size="default">
                    {isSubmitting || isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        <span>Uploading...</span>
                      </span>
                    ) : !videoFile ? (
                      "Please upload a video first"
                    ) : !idCardFile ? (
                      "Please upload ID card proof"
                    ) : (
                      "Submit Registration"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
