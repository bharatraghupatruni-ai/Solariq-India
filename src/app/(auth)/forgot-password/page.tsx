"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayInput } from "@/components/ui/ClayInput";
import { createClient } from "@/lib/supabase/client";
import { Sun, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
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
          <p className="text-stone-500 text-sm font-medium">Reset your account password</p>
        </div>

        <ClayCard className="p-8 border-stone-200/50">
          <h2 className="text-xl font-bold text-[#1c1917] mb-6 text-center tracking-tight">
            Forgot Password
          </h2>

          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <span className="text-emerald-600 text-xl font-bold">✓</span>
              </div>
              <h3 className="text-sm font-bold text-[#1c1917] mb-2">Check your email</h3>
              <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                We've sent a password reset link to <span className="font-semibold text-[#1c1917]">{email}</span>. Please check your inbox.
              </p>
              <Link href="/login" className="w-full block">
                <ClayButton variant="secondary" className="w-full border-stone-200 hover:bg-stone-50 font-bold uppercase tracking-wider text-xs py-3.5">
                  Back to Sign In
                </ClayButton>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              <ClayButton
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full py-3.5 text-xs font-bold uppercase tracking-wider"
                icon={<Mail className="w-4 h-4" />}
              >
                Send Reset Link
              </ClayButton>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </ClayCard>
      </motion.div>
    </div>
  );
}
