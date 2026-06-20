"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayInput } from "@/components/ui/ClayInput";
import { createClient } from "@/lib/supabase/client";
import { Sun, Mail, UserPlus } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${location.origin}/dashboard`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data?.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-[#292524]">
        <ClayCard className="max-w-md w-full text-center border-stone-200/50 p-8" glow="eco">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Mail className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1c1917] mb-2 tracking-tight">Check your email</h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            We sent a confirmation link to <span className="font-semibold text-[#1c1917]">{email}</span>. Click the link to activate your account.
          </p>
        </ClayCard>
      </div>
    );
  }

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
          <p className="text-stone-500 text-sm font-medium">Free for up to 2 analyses</p>
        </div>

        <ClayCard className="p-8 border-stone-200/50">
          <h2 className="text-xl font-bold text-[#1c1917] mb-6 text-center tracking-tight">
            Create your account
          </h2>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-xs px-4 py-3 rounded-xl font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block"
              >
                Full name
              </label>
              <ClayInput
                id="fullName"
                type="text"
                placeholder="Rahul Sharma"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="w-full bg-white/70 border-stone-200/60 focus:border-amber-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block"
              >
                Email address
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
              <label
                htmlFor="password"
                className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block"
              >
                Password
              </label>
              <ClayInput
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                minLength={8}
                className="w-full bg-white/70 border-stone-200/60 focus:border-amber-500/50"
              />
            </div>

            <ClayButton 
              type="submit" 
              variant="primary" 
              loading={loading} 
              className="w-full py-3.5 text-xs font-bold uppercase tracking-wider mt-2"
              icon={<UserPlus className="w-4 h-4" />}
            >
              Create Free Account
            </ClayButton>
          </form>

          <p className="text-center text-xs text-stone-500 mt-6 leading-relaxed font-semibold">
            By signing up you agree to our{" "}
            <Link href="/terms" className="font-bold text-[#d97706] hover:text-[#b45309] transition-colors">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-bold text-[#d97706] hover:text-[#b45309] transition-colors">Privacy Policy</Link>
          </p>

          <p className="text-center text-xs text-stone-400 mt-6 pt-6 border-t border-stone-200/40 font-semibold">
            Already have an account?{" "}
            <Link href="/login" className="text-[#d97706] hover:text-[#b45309] font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </ClayCard>
      </motion.div>
    </div>
  );
}
