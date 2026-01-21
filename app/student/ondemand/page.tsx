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
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

// PIN for access protection
const ACCESS_PIN = "809990";

// Form validation schema - all fields are mandatory
const registrationSchema = z.object({
  fullName: z.string().min(1, "Full name is required").min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(1, "Phone number is required").min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      const birthDate = new Date(date);
      // Competition dates: Registration Jan 10-20, 2026, Finale Jan 28, 2026
      // Must be 10 years old by Jan 9, 2026 (birthdate on or before Jan 9, 2016)
      // Must not turn 17 before Jan 30, 2026 (birthdate on or after Jan 30, 2009)
      const minDate = new Date("2016-01-09"); // Latest birthdate to be 10 by Jan 9, 2026
      const maxDate = new Date("2009-01-30"); // Earliest birthdate to be 16y 11m 29d on Jan 29, 2026

      // Birthdate must be on or before Jan 9, 2016 (at least 10 years old by Jan 9, 2026)
      // Birthdate must be on or after Jan 30, 2009 (not yet 17 on Jan 29, 2026)
      return birthDate <= minDate && birthDate >= maxDate;
    }, "Age must be between 10 and 16 years. You must be 10 years old by January 9, 2026 and not turn 17 before January 30, 2026."),
  city: z.string().optional(),
  state: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const SESSION_KEY = "ondemand_auth";

export default function OnDemandRegistration() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  // Check session storage on mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem(SESSION_KEY);
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle PIN submission
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ACCESS_PIN) {
      setIsAuthenticated(true);
      setPinError("");
      // Save to session storage
      sessionStorage.setItem(SESSION_KEY, "true");
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setPin("");
    }
  };
  const [isUploading, setIsUploading] = useState(false);
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

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const previousErrorsRef = useRef<typeof errors>({});

  // Handle fill default values checkbox
  const handleFillDefaults = async (checked: boolean) => {
    if (checked) {
      setValue("fullName", "Test Student");
      setValue("dateOfBirth", "2012-05-15"); // Valid age for competition
      setValue("city", "Mangalore");
      setValue("state", "Karnataka");
      // Phone is left blank intentionally
      
      // Create a default ID card image (simple placeholder)
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 250;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Background
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, 400, 250);
        
        // Border
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, 380, 230);
        
        // Header
        ctx.fillStyle = "#072F6B";
        ctx.fillRect(10, 10, 380, 50);
        
        // Title text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText("SAMPLE ID CARD", 200, 42);
        
        // Content
        ctx.fillStyle = "#333";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Name: Test Student", 30, 90);
        ctx.fillText("DOB: 15-05-2012", 30, 115);
        ctx.fillText("City: Mangalore", 30, 140);
        ctx.fillText("State: Karnataka", 30, 165);
        
        // Placeholder photo box
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1;
        ctx.strokeRect(280, 75, 90, 110);
        ctx.fillStyle = "#ddd";
        ctx.fillRect(281, 76, 88, 108);
        ctx.fillStyle = "#999";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PHOTO", 325, 135);
        
        // Footer
        ctx.fillStyle = "#666";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("This is a sample ID card for testing purposes", 200, 220);
        
        // Convert canvas to blob and create file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "sample-id-card.png", { type: "image/png" });
            setIdCardFile(file);
          }
        }, "image/png");
      }
    } else {
      setValue("fullName", "");
      setValue("dateOfBirth", "");
      setValue("city", "");
      setValue("state", "");
      setIdCardFile(null);
    }
  };

  // Redirect to home page after successful registration
  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup, router]);

  // Show toast notifications for form validation errors
  useEffect(() => {
    const currentErrorKeys = Object.keys(errors);
    const previousErrorKeys = Object.keys(previousErrorsRef.current);

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

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && e.total > 0) {
          const progress = Math.min(100, Math.max(0, (e.loaded / e.total) * 100));
          onProgress(progress);
        } else if (e.loaded > 0) {
          onProgress(50);
        }
      });

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

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
      xhr.send(file);
    });
  };

  // Upload file with REAL progress tracking using XMLHttpRequest (for ID card)
  const uploadFileWithProgress = (url: string, formData: FormData, onProgress: (progress: number) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && e.total > 0) {
          const progress = Math.min(100, Math.max(0, (e.loaded / e.total) * 100));
          onProgress(progress);
        } else if (e.loaded > 0) {
          onProgress(50);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            onProgress(90);
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

      xhr.open("POST", url);
      xhr.send(formData);
    });
  };

  const onSubmit = async (data: RegistrationFormData) => {
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
    setIsUploading(true);
    setUploadProgress(0);
    setUploadedBytes(0);
    setTotalBytes(idCardFile.size + videoFile.size);
    setCurrentStep("Preparing your submission...");

    try {
      setCurrentStep("Uploading ID card proof...");
      const idCardFormData = new FormData();
      idCardFormData.append("file", idCardFile);

      const idCardUploadResponse = await uploadFileWithProgress("/api/upload/file", idCardFormData, (progress) => {
        const totalProgress = progress * 0.2;
        setUploadProgress(Math.round(totalProgress * 10) / 10);
        const bytesUploaded = (progress / 100) * idCardFile.size;
        setUploadedBytes(bytesUploaded);
      });

      if (!idCardUploadResponse.ok) {
        const errorData = await idCardUploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload ID card");
      }

      const { fileKey: idCardFileKey, fileUrl: idCardFileUrl } = await idCardUploadResponse.json();
      setUploadProgress(20);
      setUploadedBytes(idCardFile.size);

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
        if (registrationResponse.status === 409 && errorData.duplicate) {
          if (errorData.hasVideo) {
            setIsSubmitting(false);
            setIsUploading(false);
            setUploadProgress(0);
            setCurrentStep("");
            throw new Error(errorData.message || "A registration with this phone number already exists and has a video submission.");
          }
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
          return;
        }
        throw new Error(errorData.error || "Failed to complete registration");
      }

      setUploadProgress(30);
      const { studentId } = await registrationResponse.json();

      setCurrentStep("Uploading your video...");

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

      await uploadToS3WithProgress(videoFile, presignedUrl, (progress) => {
        const totalProgress = 30 + progress * 0.7;
        setUploadProgress(Math.round(totalProgress * 10) / 10);
        const videoBytesUploaded = (progress / 100) * videoFile.size;
        setUploadedBytes(idCardFile.size + videoBytesUploaded);
      });

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

      setUploadedBytes(totalBytes);

      setSuccessData({
        studentId: parseInt(studentId),
        submissionId: videoData.submissionId || null,
        studentName: data.fullName,
      });

      reset();
      setVideoFile(null);
      setIdCardFile(null);

      setIsSubmitting(false);
      setIsUploading(false);

      setUploadProgress(0);
      setCurrentStep("");
      setUploadedBytes(0);
      setTotalBytes(0);

      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred during registration");
      setIsSubmitting(false);
      setIsUploading(false);
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

      await uploadToS3WithProgress(videoFile, presignedUrl, (progress) => {
        setUploadProgress(Math.round(progress * 10) / 10);
        const videoBytesUploaded = (progress / 100) * videoFile.size;
        setUploadedBytes(videoBytesUploaded);
      });

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

      setSuccessData({
        studentId: duplicateData.studentId,
        submissionId: videoData.submissionId || null,
        studentName: "",
      });

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

  // Show PIN entry screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen islamic-pattern relative overflow-hidden flex flex-col" style={{ background: "linear-gradient(135deg,rgb(16, 31, 56) 0%,rgb(0, 0, 0) 50%,rgb(20, 47, 86) 100%)" }}>
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 pt-24 sm:pt-28 md:pt-32">
          <div className="w-full max-w-md">
            <div className="bg-gradient-to-br from-[#0A1F3D]/90 to-[#1a3a5f]/90 backdrop-blur-md rounded-2xl border-2 border-[#D4AF37]/40 p-8 sm:p-12 shadow-2xl">
              <div className="text-center mb-8">
                <div className="text-5xl sm:text-6xl mb-4">🔐</div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] mb-2">
                  Access <span className="bg-gradient-to-r from-[#D4AF37] via-[#F2D27A] to-[#D4AF37] bg-clip-text text-transparent">Protected</span>
                </h1>
                <p className="text-sm sm:text-base text-[#C7D1E0]/80">
                  Enter PIN to access on-demand registration
                </p>
              </div>
              
              <form onSubmit={handlePinSubmit} className="space-y-6">
                <div>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setPinError("");
                    }}
                    placeholder="Enter PIN"
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border-2 border-[#D4AF37]/30 rounded-xl text-xl text-center text-[#FFFFFF] placeholder-[#C7D1E0]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all tracking-widest"
                    autoFocus
                  />
                  {pinError && (
                    <p className="mt-3 text-center text-red-400 text-sm">{pinError}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-[#D4AF37]/20 backdrop-blur-sm border-2 border-[#D4AF37] text-[#FFFFFF] hover:bg-[#D4AF37]/30 font-semibold py-4 h-auto rounded-xl transition-all duration-300 text-base"
                >
                  Unlock Access
                </Button>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      {/* Upload Progress Overlay */}
      <UploadProgressOverlay progress={uploadProgress} currentStep={currentStep} isVisible={isSubmitting} uploadedBytes={uploadedBytes} totalBytes={totalBytes} />

      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => {
          setShowSuccessPopup(false);
          router.push("/");
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
                <div className="bg-[#4CAF50]/20 border border-[#4CAF50]/50 text-[#4CAF50] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">On-Demand Registration</div>
              </div>

              {/* Information Banner */}
              <div className="bg-[#D4AF37]/10 backdrop-blur-sm border border-[#D4AF37]/30 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 max-w-3xl mx-auto">
                <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                  <div className="text-lg sm:text-xl md:text-2xl flex-shrink-0">ℹ️</div>
                  <div className="text-left text-[#C7D1E0] text-xs sm:text-sm md:text-base space-y-1 sm:space-y-2">
                    <p className="font-semibold text-[#D4AF37] text-xs sm:text-sm md:text-base">Important Information:</p>
                    <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 ml-1 sm:ml-2">
                      <li>All fields marked with * are required</li>
                      <li>Upload a 2-minute recitation video (MP4, WebM, or other supported formats) of any surah of your choice</li>
                      <li>Provide a valid ID card proof (JPG, PNG, or PDF – Max 5MB)</li>
                      <li>Ensure you are between 10–16 years of age</li>
                      <li>Only one registration is allowed per phone number</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Form Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border border-[#D4AF37]/20 p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6 md:space-y-8">
                {/* Fill Default Values Checkbox */}
                <div className="bg-[#4CAF50]/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-[#4CAF50]/30">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      onChange={(e) => handleFillDefaults(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-[#4CAF50] bg-transparent text-[#4CAF50] focus:ring-[#4CAF50] focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm sm:text-base text-[#FFFFFF] font-medium">Fill default values (to fill quickly)</span>
                  </label>
                  <p className="text-xs text-[#C7D1E0]/70 mt-2 ml-8">Phone number and video will remain empty. A sample ID card will be generated.</p>
                </div>

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
                      <input {...register("phone")} type="tel" id="phone" className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border border-[#C9A24D]/50 rounded-lg text-base text-[#FFFFFF] placeholder-[#C7D1E0]/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder="+91 1234567890" style={{ fontSize: "16px" }} />
                    </div>

                    <div className="md:col-span-2 w-full">
                      <label htmlFor="dateOfBirth" className="block text-xs sm:text-sm font-semibold text-[#FFFFFF] mb-1 sm:mb-1.5 md:mb-2">
                        Date of Birth <span className="text-red-400">*</span>
                      </label>
                      <input {...register("dateOfBirth")} type="date" id="dateOfBirth" className="w-full max-w-[280px] sm:max-w-full box-border px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 lg:py-3 bg-white/10 backdrop-blur-sm border border-[#C9A24D]/50 rounded-md sm:rounded-lg text-xs sm:text-sm md:text-base text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all [color-scheme:dark]" style={{ maxWidth: "280px", fontSize: "0.75rem" }} />
                      <p className="mt-1 sm:mt-1.5 md:mt-2 text-xs text-[#C7D1E0]/70">Must be 10 years old by Jan 9, 2026 and not turn 17 before Jan 30, 2026</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-[#D4AF37]/20">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-[#D4AF37] mb-4 sm:mb-5 md:mb-6 flex items-center gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl md:text-2xl">📍</span>
                    <span>Address Information</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    <div>
                      <label htmlFor="city" className="block text-xs sm:text-sm font-semibold text-[#FFFFFF] mb-1.5 sm:mb-2">
                        City
                      </label>
                      <input {...register("city")} type="text" id="city" className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border border-[#C9A24D]/50 rounded-lg text-sm sm:text-base text-[#FFFFFF] placeholder-[#C7D1E0]/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder="City" />
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-xs sm:text-sm font-semibold text-[#FFFFFF] mb-1.5 sm:mb-2">
                        State
                      </label>
                      <input {...register("state")} type="text" id="state" className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border border-[#C9A24D]/50 rounded-lg text-sm sm:text-base text-[#FFFFFF] placeholder-[#C7D1E0]/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder="State" />
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
