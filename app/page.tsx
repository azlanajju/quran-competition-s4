import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PosterPopup from "@/components/PosterPopup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen islamic-pattern relative overflow-hidden" style={{ background: "linear-gradient(135deg,rgb(16, 31, 56) 0%,rgb(0, 0, 0) 50%,rgb(20, 47, 86) 100%)" }}>
      <PosterPopup />
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
                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#D4AF37] mb-2 sm:mb-3" dir="rtl" style={{ fontFamily: "serif" }}>
                  اقرأ باسم ربك الذي خلق
                </p>
                <p className="text-xs sm:text-sm text-[#C7D1E0] italic">"Read in the name of your Lord who created"</p>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#FFFFFF] leading-tight animate-fade-in-up">
                Grand Qur&apos;an Recitation Competition <span className="bg-gradient-to-r from-[#D4AF37] via-[#F2D27A] to-[#D4AF37] bg-clip-text text-transparent">Qiraat Competition Season-4</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#C7D1E0] leading-relaxed max-w-xl mx-auto lg:mx-0 animate-fade-in-up animation-delay-200">A grand Qur&apos;an recitation competition being organized in Dakshina Kannada, Karnataka, India with the poster released by Karnataka Assembly Speaker U.T. Khader.</p>

              {/* Key Info - Compact */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 md:gap-4 pt-2 animate-fade-in-up animation-delay-400">
                <Badge className="bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 text-xs sm:text-sm">Age: 10-16 Years</Badge>
                <Badge className="bg-[#4CAF50]/20 border border-[#4CAF50]/50 text-[#4CAF50] px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 text-xs sm:text-sm">Registration: Jan 10-20, 2026</Badge>
                <Badge className="bg-[#9FB3D1]/20 border border-[#9FB3D1]/50 text-[#C7D1E0] px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 text-xs sm:text-sm">Finale: 28th Jan 2026</Badge>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-3 sm:pt-4 animate-fade-in-up animation-delay-600">
                <Button asChild className="bg-[#4CAF50]/20 backdrop-blur-sm border-2 border-[#4CAF50] text-[#FFFFFF] hover:bg-[#4CAF50]/30 font-semibold shadow-xl shadow-[#4CAF50]/20 px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 h-auto rounded-lg hover:scale-105 transition-all duration-300 text-sm sm:text-base" size="default">
                  <Link href="/student/register">Register Now</Link>
                </Button>
                <Button asChild variant="outline" className="bg-white/10 backdrop-blur-sm border-2 border-[#FFFFFF] text-[#FFFFFF] hover:bg-white/20 font-semibold px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 h-auto rounded-lg hover:scale-105 transition-all duration-300 text-sm sm:text-base" size="default">
                  <Link href="#about">Learn More</Link>
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

      {/* Prizes Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-3 sm:mb-4">
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">🏆</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#FFFFFF] mb-3 sm:mb-4">
              Competition <span className="bg-gradient-to-r from-[#D4AF37] via-[#F2D27A] to-[#D4AF37] bg-clip-text text-transparent">Prizes</span>
            </h2>
            <div className="h-1 sm:h-1.5 w-16 sm:w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-4 sm:mb-6"></div>
            <p className="text-[#C7D1E0] text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed px-2">
              Cash prizes amounting to several lakhs of rupees have been announced for the winners
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10 mb-12">
            {/* 1st Prize */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] via-[#F2D27A] to-[#D4AF37] rounded-2xl sm:rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-[#0B1A3A] via-[#0F2447] to-[#0B1A3A] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 border-2 border-[#D4AF37]/50 shadow-2xl hover:border-[#D4AF37] transition-all duration-300 hover:scale-105">
                <div className="absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#D4AF37] to-[#F2D27A] rounded-full flex items-center justify-center shadow-xl border-4 border-[#0B1A3A]">
                    <span className="text-2xl sm:text-3xl">🥇</span>
                  </div>
                </div>
                <div className="text-center pt-4 sm:pt-6">
                  <div className="text-xs sm:text-sm md:text-base font-semibold text-[#D4AF37] uppercase tracking-wider mb-3 sm:mb-4">1st Prize</div>
                  <div className="mb-2">
                    <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#F2D27A] to-[#D4AF37] bg-clip-text text-transparent">
                      1,11,111
                    </span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#D4AF37] ml-1 sm:ml-2">₹</span>
                  </div>
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#D4AF37]/20">
                    <p className="text-xs text-[#C7D1E0] uppercase tracking-wider">Gold Medal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2nd Prize */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#C0C0C0] via-[#E8E8E8] to-[#C0C0C0] rounded-2xl sm:rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-[#0B1A3A] via-[#0F2447] to-[#0B1A3A] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 border-2 border-[#C0C0C0]/40 shadow-2xl hover:border-[#C0C0C0] transition-all duration-300 hover:scale-105">
                <div className="absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#C0C0C0] to-[#E8E8E8] rounded-full flex items-center justify-center shadow-xl border-4 border-[#0B1A3A]">
                    <span className="text-2xl sm:text-3xl">🥈</span>
                  </div>
                </div>
                <div className="text-center pt-4 sm:pt-6">
                  <div className="text-xs sm:text-sm md:text-base font-semibold text-[#C0C0C0] uppercase tracking-wider mb-3 sm:mb-4">2nd Prize</div>
                  <div className="mb-2">
                    <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#FFFFFF]">
                      55,555
                    </span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#C0C0C0] ml-1 sm:ml-2">₹</span>
                  </div>
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#C0C0C0]/20">
                    <p className="text-xs text-[#C7D1E0] uppercase tracking-wider">Silver Medal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3rd Prize */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#CD7F32] via-[#E6A857] to-[#CD7F32] rounded-2xl sm:rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-[#0B1A3A] via-[#0F2447] to-[#0B1A3A] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 border-2 border-[#CD7F32]/40 shadow-2xl hover:border-[#CD7F32] transition-all duration-300 hover:scale-105">
                <div className="absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#CD7F32] to-[#E6A857] rounded-full flex items-center justify-center shadow-xl border-4 border-[#0B1A3A]">
                    <span className="text-2xl sm:text-3xl">🥉</span>
                  </div>
                </div>
                <div className="text-center pt-4 sm:pt-6">
                  <div className="text-xs sm:text-sm md:text-base font-semibold text-[#CD7F32] uppercase tracking-wider mb-3 sm:mb-4">3rd Prize</div>
                  <div className="mb-2">
                    <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#FFFFFF]">
                      33,333
                    </span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#CD7F32] ml-1 sm:ml-2">₹</span>
                  </div>
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#CD7F32]/20">
                    <p className="text-xs text-[#C7D1E0] uppercase tracking-wider">Bronze Medal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Prize Pool */}
          <div className="text-center">
            <div className="inline-block bg-white/5 backdrop-blur-sm border border-[#D4AF37]/30 rounded-xl sm:rounded-2xl px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 shadow-xl">
              <p className="text-[#C7D1E0] text-xs sm:text-sm md:text-base uppercase tracking-wider mb-1 sm:mb-2">Total Prize Pool</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#D4AF37]">
                2,00,000 <span className="text-lg sm:text-xl text-[#C7D1E0]">₹</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#FFFFFF] mb-3 sm:mb-4">
                  About <span className="bg-gradient-to-r from-[#D4AF37] via-[#F2D27A] to-[#D4AF37] bg-clip-text text-transparent">Us</span>
                </h2>
                <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-[#D4AF37] to-transparent mb-4 sm:mb-6"></div>
              </div>

              <div className="space-y-3 sm:space-y-4 text-[#C7D1E0] text-sm sm:text-base md:text-lg leading-relaxed">
                <div>
                  <h3 className="text-[#D4AF37] font-semibold text-base sm:text-lg md:text-xl mb-1 sm:mb-2">Event Overview</h3>
                  <p>
                    <span className="text-[#D4AF37] font-semibold">Dr Abdul Shakeel Charitable Trust</span>, which has been working for the welfare of society for a Decade is celebrating its 10th anniversary. To mark this occasion, a Grand Qiraat Season-4 (Qur&apos;an recitation) competition, is being organised in the district. The grand finale will be held on Wednesday, January 28, 2026, at the Indiana Convention Centre in Mangalore. The official poster for this special event was unveiled on 01/01/2026 by the Hon&apos;ble Speaker of the Karnataka Legislative Assembly, Dr U.T. Khader.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#D4AF37] font-semibold text-base sm:text-lg md:text-xl mb-1 sm:mb-2">Background of the Competition</h3>
                  <p>
                    The first 3 seasons of this competition were held very successfully in Saudi Arabia. The Trust has now decided to organize the fourth season in Mangalore, Karnataka. After releasing the poster, Dr U.T. Khader praised the Trust&apos;s educational and social services and wished the program complete success.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#D4AF37] font-semibold text-base sm:text-lg md:text-xl mb-1 sm:mb-2">Participation and Registration</h3>
                  <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2">
                    <li><span className="font-semibold">Eligibility:</span> Boys and girls between 10 and 16 years of age.</li>
                    <li><span className="font-semibold">Registration period:</span> From January 10 to January 20, 2026.</li>
                    <li><span className="font-semibold">Method:</span> Participants can scan the QR code or visit the link given on the poster and upload a 2-minute recitation video of any surah of their choice to register their names.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[#D4AF37] font-semibold text-base sm:text-lg md:text-xl mb-1 sm:mb-2">Final Competition</h3>
                  <p>
                    The final round for the shortlisted participants will be held on Wednesday, January 28, 2026, at the Indiana Convention Centre in Mangalore in the presence of dignitaries.
                  </p>
                </div>

                <p className="text-[#FFFFFF] font-medium pt-3 sm:pt-4 text-sm sm:text-base">
                  For more details, interested persons may contact the phone number <span className="text-[#D4AF37] font-semibold">9187415100</span>
                </p>
              </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
