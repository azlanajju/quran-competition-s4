"use client";

import VideoUpload from "@/components/VideoUpload";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form validation schema
const registrationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    return actualAge >= 5 && actualAge <= 18; // Age validation as per competition rules
  }, "Age must be between 5 and 18 years"),
  category: z.string().min(1, "Please select a category"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Zip code is required"),
  parentName: z.string().min(2, "Parent/Guardian name is required"),
  parentEmail: z.string().email("Invalid parent email address"),
  parentPhone: z.string().min(10, "Parent phone number is required"),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function StudentRegistration() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationFormData) => {
    if (!videoFile) {
      setErrorMessage("Please upload a video file");
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      // Step 1: Get upload URL from API (video is already compressed by VideoUpload component)
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: videoFile.name,
          fileType: videoFile.type || "video/mp4", // Default to mp4 if type is missing
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      const { uploadUrl, fileKey } = await uploadResponse.json();

      // Step 2: Upload compressed video to S3 using presigned URL
      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: videoFile, // This is already compressed by VideoUpload component
        headers: {
          "Content-Type": videoFile.type || "video/mp4",
        },
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload video to S3");
      }

      // Step 3: Submit registration data with video reference
      const registrationResponse = await fetch("/api/student/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          videoKey: fileKey,
          videoUrl: `s3://${fileKey}`, // Store S3 key for reference
        }),
      });

      if (!registrationResponse.ok) {
        const errorData = await registrationResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to complete registration");
      }

      setSubmitStatus("success");
      reset();
      setVideoFile(null);
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred during registration");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
              <p className="text-green-100 font-medium text-center">✓ Registration successful! You will receive a confirmation email shortly.</p>
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
                  <label htmlFor="email" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                    Email Address *
                  </label>
                  <input {...register("email")} type="email" id="email" className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-md text-[#FFFFFF] placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]" placeholder="your.email@example.com" />
                  {errors.email && <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>}
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

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                    Competition Category *
                  </label>
                  <select {...register("category")} id="category" className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-md text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]">
                    <option value="" className="bg-[#0B3C8A] text-[#FFFFFF]">
                      Select a category
                    </option>
                    <option value="junior" className="bg-[#0B3C8A] text-[#FFFFFF]">
                      Junior (5-10 years)
                    </option>
                    <option value="intermediate" className="bg-[#0B3C8A] text-[#FFFFFF]">
                      Intermediate (11-14 years)
                    </option>
                    <option value="senior" className="bg-[#0B3C8A] text-[#FFFFFF]">
                      Senior (15-18 years)
                    </option>
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-300">{errors.category.message}</p>}
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

            {/* Parent/Guardian Information */}
            <div className="border-b border-[#9FB3D1] pb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                <span className="text-xl">✦</span> Parent/Guardian Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="parentName" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                    Parent/Guardian Name *
                  </label>
                  <input {...register("parentName")} type="text" id="parentName" className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-md text-[#FFFFFF] placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]" placeholder="Parent/Guardian name" />
                  {errors.parentName && <p className="mt-1 text-sm text-red-300">{errors.parentName.message}</p>}
                </div>

                <div>
                  <label htmlFor="parentEmail" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                    Parent/Guardian Email *
                  </label>
                  <input {...register("parentEmail")} type="email" id="parentEmail" className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-md text-[#FFFFFF] placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]" placeholder="parent.email@example.com" />
                  {errors.parentEmail && <p className="mt-1 text-sm text-red-300">{errors.parentEmail.message}</p>}
                </div>

                <div>
                  <label htmlFor="parentPhone" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                    Parent/Guardian Phone *
                  </label>
                  <input {...register("parentPhone")} type="tel" id="parentPhone" className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-md text-[#FFFFFF] placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]" placeholder="+91 1234567890" />
                  {errors.parentPhone && <p className="mt-1 text-sm text-red-300">{errors.parentPhone.message}</p>}
                </div>
              </div>
            </div>

            {/* Video Upload */}
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                <span className="text-xl">✦</span> Recitation Video Upload
              </h2>
              <VideoUpload
                onVideoSelect={(file) => setVideoFile(file)}
                onCompressionStateChange={(compressing) => setIsCompressing(compressing)}
                maxSize={100 * 1024 * 1024} // 100MB
                acceptedFormats={["video/mp4", "video/webm", "video/quicktime"]}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button type="submit" disabled={isSubmitting || isCompressing || !videoFile} className="w-full bg-[#4CAF50]/20 backdrop-blur-sm border-2 border-[#4CAF50] text-[#FFFFFF] hover:bg-[#4CAF50]/30 font-semibold shadow-xl shadow-[#4CAF50]/20 py-6 h-auto rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300" size="lg">
                {isCompressing ? "Compressing video..." : isSubmitting ? "Submitting..." : !videoFile ? "Please upload a video first" : "Submit Registration"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
