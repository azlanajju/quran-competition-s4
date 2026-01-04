"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Image from "next/image";

export default function JudgeLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/judge/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/judge");
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1A3A] to-[#0F2447]">
      <Header />
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-[#D4AF37]/30 p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Image
                src="/images/trust_white.png"
                alt="Dr Abdul Shakeel Charitable Trust"
                width={180}
                height={70}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Judge Login</h1>
            <p className="text-[#C7D1E0]">Enter your credentials to access the judge panel</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 bg-white/10 border border-[#C9A24D] rounded-md text-white placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-white/10 border border-[#C9A24D] rounded-md text-white placeholder-[#C7D1E0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-[#D4AF37] hover:bg-[#C9A24D] text-[#072F6B] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

