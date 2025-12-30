import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen islamic-pattern relative overflow-hidden" style={{ background: "linear-gradient(135deg,rgb(16, 31, 56) 0%,rgb(0, 0, 0) 50%,rgb(20, 47, 86) 100%)" }}>
      <Header />

      {/* Stars decoration */}
      <div className="stars">
        <div className="star" style={{ top: "15%", left: "10%" }}>
          ✦
        </div>
        <div className="star" style={{ top: "25%", right: "15%" }}>
          ✦
        </div>
        <div className="star" style={{ top: "45%", left: "8%" }}>
          ✦
        </div>
        <div className="star" style={{ top: "65%", right: "12%" }}>
          ✦
        </div>
        <div className="star" style={{ top: "80%", left: "20%" }}>
          ✦
        </div>
        <div className="star" style={{ top: "35%", right: "35%" }}>
          ✦
        </div>
        <div className="star" style={{ top: "70%", right: "25%" }}>
          ✦
        </div>
      </div>

      {/* Crescent Moon with Star - Top Left */}
      <div className="crescent-moon-star" style={{ top: "10%", left: "2%" }}>
        <div className="cloud" style={{ top: "60px", left: "10px" }}></div>
        <div className="moon"></div>
        <div className="star-icon">⭐</div>
      </div>

      {/* Islamic Lantern - Top Right */}
      <div className="islamic-lantern" style={{ top: "15%", right: "5%" }}>
        <div className="lantern-top"></div>
        <div className="lantern-body"></div>
        <div className="lantern-bottom"></div>
      </div>

      {/* Islamic Lantern - Bottom Right */}
      <div className="islamic-lantern" style={{ bottom: "10%", right: "8%", transform: "scale(0.8)" }}>
        <div className="lantern-top"></div>
        <div className="lantern-body"></div>
        <div className="lantern-bottom"></div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 md:pt-40 pb-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Arabic Verse */}
              <div className="animate-fade-in">
                <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#D4AF37] mb-3" dir="rtl" style={{ fontFamily: "serif" }}>
                  اقرأ باسم ربك الذي خلق
                </p>
                <p className="text-sm text-[#C7D1E0] italic">"Read in the name of your Lord who created"</p>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-[#FFFFFF] leading-tight animate-fade-in-up">
                Prestigious <span className="bg-gradient-to-r from-[#D4AF37] via-[#F2D27A] to-[#D4AF37] bg-clip-text text-transparent">Qira&apos;at</span> Competition
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-[#C7D1E0] leading-relaxed max-w-xl mx-auto lg:mx-0 animate-fade-in-up animation-delay-200">Showcase your recitation skills and compete for prestigious prizes in the 4th Season State Level Competition.</p>

              {/* Key Info - Compact */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2 animate-fade-in-up animation-delay-400">
                <Badge className="bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] px-4 py-1.5">Age: 10-16 Years</Badge>
                <Badge className="bg-[#4CAF50]/20 border border-[#4CAF50]/50 text-[#4CAF50] px-4 py-1.5">Open for All</Badge>
                <Badge className="bg-[#9FB3D1]/20 border border-[#9FB3D1]/50 text-[#C7D1E0] px-4 py-1.5">28th Jan 2026</Badge>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4 animate-fade-in-up animation-delay-600">
                <Button asChild className="bg-[#4CAF50]/20 backdrop-blur-sm border-2 border-[#4CAF50] text-[#FFFFFF] hover:bg-[#4CAF50]/30 font-semibold shadow-xl shadow-[#4CAF50]/20 px-8 py-6 h-auto rounded-lg hover:scale-105 transition-all duration-300" size="lg">
                  <Link href="/student/register">Register Now</Link>
                </Button>
                <Button asChild variant="outline" className="bg-white/10 backdrop-blur-sm border-2 border-[#FFFFFF] text-[#FFFFFF] hover:bg-white/20 font-semibold px-8 py-6 h-auto rounded-lg hover:scale-105 transition-all duration-300" size="lg">
                  <Link href="/competitions">Learn More</Link>
                </Button>
              </div>
            </div>

            {/* Right Side - Visual */}
            <div className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center animate-fade-in animation-delay-800">
              <div className="relative w-full h-full">
                <div className="relative w-full h-full animate-float">
                  <Image
                    src="/images/quranHome.png"
                    alt="Holy Quran on Rehal"
                    width={600}
                    height={800}
                    className="object-contain w-full h-full drop-shadow-2xl"
                    priority
                    style={{
                      filter: "drop-shadow(0 30px 80px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 40px rgba(212, 175, 55, 0.4))",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* About Us Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Image */}
            <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
              <div className="relative w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 gold-border shadow-2xl">
                  <div className="aspect-square bg-gradient-to-br from-[#D4AF37]/20 to-[#4CAF50]/20 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">👨‍⚕️</div>
                      <p className="text-[#C7D1E0] text-sm">Dr. Ahmed Shakeel</p>
                      <p className="text-[#D4AF37] text-xs mt-1">Founder & Trustee</p>
                    </div>
                    {/* Placeholder for image - replace with actual image */}
                    {/* <Image
                      src="/images/dr-shakeel.jpg"
                      alt="Dr. Ahmed Shakeel"
                      width={400}
                      height={400}
                      className="rounded-xl object-cover w-full h-full"
                    /> */}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="order-1 lg:order-2 space-y-6">
              <div>
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[#FFFFFF] mb-4">
                  About <span className="bg-gradient-to-r from-[#D4AF37] via-[#F2D27A] to-[#D4AF37] bg-clip-text text-transparent">Us</span>
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-[#D4AF37] to-transparent mb-6"></div>
              </div>

              <div className="space-y-4 text-[#C7D1E0] text-base md:text-lg leading-relaxed">
                <p>
                  The <span className="text-[#D4AF37] font-semibold">Qira&apos;at State Level Qur&apos;an Recitation Competition</span> is a prestigious initiative organized by the <span className="text-[#D4AF37] font-semibold">Dr. Ahmed Shakeel Charitable Trust</span>, dedicated to nurturing young talent in the art of Qur&apos;anic recitation and promoting a deeper connection with the Holy Qur&apos;an among the younger generation.
                </p>

                <p>
                  Conducted on the occasion of the Trust&apos;s milestone celebrations, Qira&apos;at serves as a platform for students to demonstrate their recitation skills while adhering to the principles of <span className="text-[#D4AF37]">Tajweed</span>, pronunciation, melody, and fluency. The competition is designed to encourage discipline, confidence, and spiritual growth in a structured and respectful environment.
                </p>

                <p>Open to boys and girls within the specified age categories, the competition follows a transparent and fair evaluation process, overseen by qualified judges with expertise in Qur&apos;anic recitation. Through a carefully designed digital platform, participants can register, submit their recitations, and track their progress seamlessly.</p>

                <p className="text-[#FFFFFF] font-medium">
                  At <span className="text-[#D4AF37] font-semibold">Dr. Ahmed Shakeel Charitable Trust</span>, our mission extends beyond competition—we aim to inspire a lifelong love for the Qur&apos;an, recognize excellence, and create opportunities for young reciters to shine at a state level and beyond.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
