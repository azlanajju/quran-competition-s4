import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qira'at - Qur'an Recitation Competition Portal",
  description: "Participate in the prestigious Qira'at Qur'an recitation competition. Register and showcase your recitation skills.",
  icons: {
    icon: [
      { url: "/images/logo.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/images/logo.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 10000,
            style: {
              background: "#0A1F3D",
              color: "#FFFFFF",
              border: "2px solid #D4AF37",
              borderRadius: "12px",
              padding: "16px",
            },
            success: {
              iconTheme: {
                primary: "#4CAF50",
                secondary: "#FFFFFF",
              },
            },
            error: {
              duration: 10000,
              style: {
                background: "#7F1D1D",
                color: "#FFFFFF",
                border: "2px solid #EF4444",
                borderRadius: "12px",
                padding: "16px",
              },
              iconTheme: {
                primary: "#EF4444",
                secondary: "#FFFFFF",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
