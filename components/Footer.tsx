import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-black/40 backdrop-blur-md border-t border-[#D4AF37]/20 mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Organization Info */}
            <div className="space-y-4">
              <div className="mb-4">
                <Image
                  src="/images/trust_white.png"
                  alt="Dr Abdul Shakeel Charitable Trust"
                  width={120}
                  height={50}
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-[#D4AF37] mb-4">Dr Abdul Shakeel Charitable Trust</h3>
              <p className="text-[#C7D1E0] text-sm leading-relaxed">
                Celebrating 10 years of service to the community. Organizing Qiraat Competition Season-4 in Dakshina Kannada, Karnataka.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#D4AF37] mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/student/register" className="text-[#C7D1E0] hover:text-[#D4AF37] transition-colors text-sm">
                    Register Now
                  </Link>
                </li>
                <li>
                  <a href="#about" className="text-[#C7D1E0] hover:text-[#D4AF37] transition-colors text-sm">
                    About Competition
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#D4AF37] mb-4">Contact Us</h3>
              <div className="space-y-2 text-[#C7D1E0] text-sm">
                <p>
                  <span className="font-semibold text-[#D4AF37]">Phone:</span>{" "}
                  <a href="tel:9187415100" className="hover:text-[#D4AF37] transition-colors">
                    9187415100
                  </a>
                </p>
                <p className="pt-2">
                  <span className="font-semibold text-[#D4AF37]">Location:</span> Dakshina Kannada, Karnataka, India
                </p>
                <p>
                  <span className="font-semibold text-[#D4AF37]">Finale Venue:</span> Indiana Convention Centre, Mangalore
                </p>
                <p>
                  <span className="font-semibold text-[#D4AF37]">Date:</span> January 28, 2026
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[#D4AF37]/20 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[#C7D1E0] text-sm text-center md:text-left">
                © {new Date().getFullYear()} Dr Abdul Shakeel Charitable Trust. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[#C7D1E0] text-sm">Qiraat Competition Season-4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


