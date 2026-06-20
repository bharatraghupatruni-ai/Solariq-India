import Link from "next/link";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#e8edf2] py-12 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3">
          <span className="text-2xl">☀️</span>
          <span className="text-xl font-bold text-[#1a2332]">SolarIQ</span>
        </div>

        <ClayCard className="p-8 md:p-10">
          <h1 className="text-3xl font-bold text-[#1a2332] mb-2">Terms of Service</h1>
          <p className="text-[#9ba4b0] text-sm mb-6">Last updated: June 17, 2026</p>

          <div className="prose text-[#4a5568] text-sm leading-relaxed space-y-6">
            <section>
              <h2 className="text-lg font-bold text-[#1a2332] mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the SolarIQ platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1a2332] mb-2">2. Description of Service</h2>
              <p>
                SolarIQ provides roof solar feasibility assessments, estimates of potential solar generation capacity, cost savings projections, and related analysis using machine learning algorithms and meteorological data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1a2332] mb-2">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account login information and are fully responsible for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1a2332] mb-2">4. Data Usage and Estimations</h2>
              <p>
                All projections, savings, and assessments provided by the platform are estimations for informational purposes only. Actual installation costs, system generation, and utility rate variations may differ from platform models.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1a2332] mb-2">5. Disclaimers</h2>
              <p>
                The service is provided on an "as-is" and "as-available" basis. We disclaim all warranties of any kind, whether express or implied, including but not limited to suitability for particular engineering or financial investments.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1a2332] mb-2">6. Limitation of Liability</h2>
              <p>
                In no event shall SolarIQ or its developers be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your access to or use of the service.
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
