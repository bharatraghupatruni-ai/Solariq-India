import Link from "next/link";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#e8edf2] py-12 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3">
          <span className="text-2xl">☀️</span>
          <span className="text-xl font-bold text-[#1a2332]">SolarIQ</span>
        </div>

        <ClayCard className="p-8 md:p-10">
          <h1 className="text-3xl font-bold text-[#1a2332] mb-2">Privacy Policy</h1>
          <p className="text-[#9ba4b0] text-sm mb-6">Last updated: June 17, 2026</p>

          <div className="prose text-[#4a5568] text-sm leading-relaxed space-y-6">
            <section>
              <h2 className="text-lg font-bold text-[#1a2332] mb-2">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us when creating an account, running an analysis (such as roof coordinates, address, and electricity bill details), or contacting support.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1a2332] mb-2">2. How We Use Information</h2>
              <p>
                We use the collected information to calculate solar feasibility, run machine learning algorithms, cache location-specific weather metrics, and communicate platform updates.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1a2332] mb-2">3. Data Integration</h2>
              <p>
                To provide estimations, we integrate external meteorological feeds (like NASA POWER API) using coordinate inputs. No personally identifiable account details are transmitted to external weather APIs.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1a2332] mb-2">4. Data Storage and Security</h2>
              <p>
                Your session and database data is securely stored using Supabase. We implement standard encryption and access control policies to protect your personal details.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1a2332] mb-2">5. Your Rights</h2>
              <p>
                You have the right to request a copy of your personal data stored on the platform, or request the correction or deletion of your profile history.
              </p>
            </section>
          </div>

          <div className="border-t border-[#d1d8e0]/40 pt-8 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-[#9ba4b0]">© 2026 SolarIQ. All rights reserved.</span>
            <Link href="/signup">
              <ClayButton variant="primary" size="sm">
                Back to Sign Up
              </ClayButton>
            </Link>
          </div>
        </ClayCard>
      </div>
    </div>
  );
}
