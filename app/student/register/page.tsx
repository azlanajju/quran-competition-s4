"use client";

import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import UploadProgressOverlay from "@/components/UploadProgressOverlay";
import VideoUpload from "@/components/VideoUpload";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
  const [submitStatus, setSubmitStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

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

  // Upload file with REAL progress tracking using XMLHttpRequest
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
            // Ensure progress is 100% on completion
            onProgress(100);
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
    if (!videoFile) {
      setErrorMessage("Please upload a video file");
      setSubmitStatus("error");
      return;
    }

    if (!idCardFile) {
      setErrorMessage("Please upload an ID card proof");
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("uploading");
    setErrorMessage("");
    setUploadProgress(0);
    setUploadedBytes(0);
    setTotalBytes(idCardFile.size + videoFile.size);
    setCurrentStep("Preparing your submission...");

    try {
      // Step 1: Upload ID card first (with progress tracking)
      setCurrentStep("Uploading ID card proof...");
      const idCardFormData = new FormData();
      idCardFormData.append("file", idCardFile);

      // ID card upload: 0-20% of total progress
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

      // Step 2: Register student with ID card reference
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
        if (registrationResponse.status === 409) {
          throw new Error(errorData.error || "This phone number is already registered. Each phone number can only register once.");
        }
        throw new Error(errorData.error || "Failed to complete registration");
      }

      setUploadProgress(30);
      const { studentId } = await registrationResponse.json();

      // Step 3: Upload video directly (with REAL progress tracking)
      setCurrentStep("Uploading your video...");
      const videoFormData = new FormData();
      videoFormData.append("video", videoFile);
      videoFormData.append("studentId", studentId.toString());

      // Video upload: 30-100% of total progress (70% range)
      const videoProcessingResponse = await uploadFileWithProgress("/api/video/upload-process", videoFormData, (progress) => {
        // Real progress: 30% + (video progress * 70%)
        // This tracks actual bytes uploaded for the video file
        const totalProgress = 30 + progress * 0.7;
        setUploadProgress(Math.round(totalProgress * 10) / 10); // Round to 1 decimal
        // Track actual bytes uploaded (ID card already done + video progress)
        const videoBytesUploaded = (progress / 100) * videoFile.size;
        setUploadedBytes(idCardFile.size + videoBytesUploaded);
      });

      if (!videoProcessingResponse.ok) {
        const errorData = await videoProcessingResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload video");
      }

      setUploadProgress(100);
      setCurrentStep("Finalizing your registration...");

      // Small delay to show 100%
      await new Promise((resolve) => setTimeout(resolve, 500));

      const videoData = await videoProcessingResponse.json();

      // Video uploaded successfully
      setUploadProgress(100);
      setUploadedBytes(totalBytes);
      setSubmitStatus("success");
      setIsSubmitting(false);
      reset();
      setVideoFile(null);
      setIdCardFile(null);
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setCurrentStep("");
        setUploadedBytes(0);
        setTotalBytes(0);
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred during registration");
      setSubmitStatus("error");
      setIsSubmitting(false);
      setUploadProgress(0);
      setCurrentStep("");
      setUploadedBytes(0);
      setTotalBytes(0);
    }
  };

  return (
    <>
      {/* Upload Progress Overlay */}
      <UploadProgressOverlay progress={uploadProgress} currentStep={currentStep} isVisible={isSubmitting} uploadedBytes={uploadedBytes} totalBytes={totalBytes} />

      <div className="min-h-screen islamic-pattern relative overflow-hidden" style={{ background: "linear-gradient(135deg,rgb(16, 31, 56) 0%,rgb(0, 0, 0) 50%,rgb(20, 47, 86) 100%)" }}>
        {/* Stars decoration */}
        <div className="stars">
          <div className="star" style={{ top: "10%", left: "10%" }}>
            ✦
          </div>
          <div className="star" style={{ top: "15%", right: "15%" }}>
            ✦
          </div>
          <div className="star" style={{ top: "30%", left: "5%" }}>
            ✦
          </div>
          <div className="star" style={{ top: "50%", right: "10%" }}>
            ✦
          </div>
          <div className="star" style={{ top: "70%", left: "15%" }}>
            ✦
          </div>
          <div className="star" style={{ top: "85%", right: "20%" }}>
            ✦
          </div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10 pt-12 md:pt-16 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 lg:p-10 gold-border">
            <div className="text-center mb-8">
              <h1
                className="font-display text-3xl md:text-4xl lg:text-5xl font-bold gold-text mb-3"
                style={{
                  textShadow: "0 0 30px rgba(212, 175, 55, 0.6)",
                }}
              >
                Student Registration
              </h1>
              <p className="text-[#FFFFFF] text-base md:text-lg">Register for the Qira&apos;at Qur&apos;an Recitation Competition</p>
              <div className="mt-4 inline-block bg-[#072F6B]/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-[#9FB3D1]/30">
                <p className="text-[#D4AF37] text-xs md:text-sm font-semibold">4th Season - State Level Competition</p>
              </div>
            </div>

            {submitStatus === "success" && (
              <div className="mb-6 p-4 bg-green-500/20 backdrop-blur-sm border-2 border-green-400 rounded-lg">
                <p className="text-green-100 font-medium text-center">✓ Registration successful! Your video has been uploaded.</p>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border-2 border-red-400 rounded-lg">
                <p className="text-red-100 font-medium text-center">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="border-b border-[#9FB3D1] pb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                  <span className="text-xl">✦</span> Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                      Full Name *
                    </label>
                    <input {...register("fullName")} type="text" id="fullName" className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-md text-[#FFFFFF] placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]" placeholder="Enter your full name" />
                    {errors.fullName && <p className="mt-1 text-sm text-red-300">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                      Phone Number *
                    </label>
                    <input {...register("phone")} type="tel" id="phone" className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-md text-[#FFFFFF] placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]" placeholder="+91 1234567890" />
                    {errors.phone && <p className="mt-1 text-sm text-red-300">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                      Date of Birth *
                    </label>
                    <input {...register("dateOfBirth")} type="date" id="dateOfBirth" className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-md text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] [color-scheme:dark]" />
                    {errors.dateOfBirth && <p className="mt-1 text-sm text-red-300">{errors.dateOfBirth.message}</p>}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="border-b border-[#9FB3D1] pb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                  <span className="text-xl">✦</span> Address Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                      Street Address *
                    </label>
                    <input {...register("address")} type="text" id="address" className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-md text-[#FFFFFF] placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]" placeholder="Enter your street address" />
                    {errors.address && <p className="mt-1 text-sm text-red-300">{errors.address.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                        City *
                      </label>
                      <input {...register("city")} type="text" id="city" className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-md text-[#FFFFFF] placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]" placeholder="City" />
                      {errors.city && <p className="mt-1 text-sm text-red-300">{errors.city.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                        State *
                      </label>
                      <input {...register("state")} type="text" id="state" className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-md text-[#FFFFFF] placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]" placeholder="State" />
                      {errors.state && <p className="mt-1 text-sm text-red-300">{errors.state.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                        Zip Code *
                      </label>
                      <input {...register("zipCode")} type="text" id="zipCode" className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-md text-[#FFFFFF] placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]" placeholder="Zip Code" />
                      {errors.zipCode && <p className="mt-1 text-sm text-red-300">{errors.zipCode.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* ID Card Proof Upload */}
              <div className="border-b border-[#9FB3D1] pb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                  <span className="text-xl">✦</span> ID Card Proof *
                </h2>
                <FileUpload
                  onFileSelect={(file) => setIdCardFile(file || null)}
                  maxSize={5 * 1024 * 1024} // 5MB
                  acceptedFormats={["image/jpeg", "image/png", "image/jpg", "application/pdf"]}
                  label="ID Card Proof (Required)"
                  acceptLabel="JPG, PNG, PDF"
                />
                {!idCardFile && <p className="mt-2 text-sm text-red-300">ID card proof is required</p>}
              </div>

              {/* Video Upload */}
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                  <span className="text-xl">✦</span> Recitation Video Upload
                </h2>
                <VideoUpload onVideoSelect={(file) => setVideoFile(file)} acceptedFormats={["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/avi", "video/x-matroska"]} />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button type="submit" disabled={isSubmitting || !videoFile || !idCardFile} className="w-full bg-[#4CAF50]/20 backdrop-blur-sm border-2 border-[#4CAF50] text-[#FFFFFF] hover:bg-[#4CAF50]/30 font-semibold shadow-xl shadow-[#4CAF50]/20 py-6 h-auto rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300" size="lg">
                  {isSubmitting ? "Submitting..." : !videoFile ? "Please upload a video first" : !idCardFile ? "Please upload ID card proof" : "Submit Registration"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
