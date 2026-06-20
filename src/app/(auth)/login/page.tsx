"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayInput } from "@/components/ui/ClayInput";
import { createClient } from "@/lib/supabase/client";
import { Sun, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-[#292524]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-[0_2px_10px_rgba(217,119,6,0.15)]">
              <Sun className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#1c1917]">SolarIQ</span>
          </div>
          <p className="text-stone-500 text-sm font-medium">Sign in to manage your solar profile</p>
        </div>

        <ClayCard className="p-8 border-stone-200/50">
          <h2 className="text-xl font-bold text-[#1c1917] mb-6 text-center tracking-tight">
            Welcome Back
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-xs px-4 py-3 rounded-xl font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block"
              >
                Email Address
              </label>
              <ClayInput
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-white/70 border-stone-200/60 focus:border-amber-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-stone-500 hover:text-stone-900 transition-colors font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
              <ClayInput
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-white/70 border-stone-200/60 focus:border-amber-500/50"
              />
            </div>

            <ClayButton
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-3.5 text-xs font-bold uppercase tracking-wider"
              icon={<LogIn className="w-4 h-4" />}
            >
              Sign In
            </ClayButton>
          </form>


          <div className="text-center mt-6">
            <p className="text-xs text-stone-500 font-semibold">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-bold text-[#d97706] hover:text-[#b45309] transition-colors"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </ClayCard>
      </motion.div>
    </div>
  );
}
