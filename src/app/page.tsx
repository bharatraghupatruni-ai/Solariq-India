"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const STATS = [
  { value: "40%", label: "Subsidy Eligibility" },
  { value: "4-Yr", label: "Payback Period" },
  { value: "25-Yr", label: "Panel Lifecycle" },
  { value: "6%", label: "Inflation Shield" },
];

const FEATURES = [
  {
    icon: "satellite_alt",
    title: "NASA Data Integration",
    desc: "We pull direct solar radiation datasets from NASA Power APIs to model shadowing and seasonal variation with 98.7% historical accuracy.",
    badge: "public",
    span: "md:col-span-2 bg-[#f8f9ff]/85",
  },
  {
    icon: "account_balance",
    title: "PM Surya Ghar",
    desc: "Built-in calculator for the 2024 national solar subsidy scheme. Instantly see your grant eligibility based on roof size.",
    action: "Check Eligibility",
    span: "col-span-1 bg-[#f8f9ff]/85",
  },
  {
    icon: "query_stats",
    title: "25-Year Returns",
    desc: "Comprehensive financial forecasting including maintenance costs, panel degradation, and grid tariff escalation over decades.",
    span: "col-span-1 bg-[#f8f9ff]/85",
  },
  {
    icon: "grid_on",
    title: "Multi-Panel Simulation",
    desc: "Compare Monocrystalline, Polycrystalline, and Bifacial technologies in a single click. Discover the optimal balance of CAPEX vs. Yield for your specific city.",
    pills: ["Monocrystalline", "Bifacial Pro"],
    span: "md:col-span-2 bg-[#f8f9ff]/85",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen text-on-surface font-body-md overflow-x-hidden bg-gradient-to-b from-[#F1F5F9] to-white pb-0">
      {/* TopNavBar Component */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 lg:px-16 h-20 bg-surface/85 backdrop-blur-xl border-b border-white/20 shadow-sm max-w-full">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-headline-md text-2xl font-bold text-primary tracking-tight font-serif">
            SolarIQ India
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/dashboard" className="font-label-md text-xs font-semibold text-primary border-b-2 border-primary pb-1 uppercase tracking-wider">
              Dashboard
            </Link>
            <Link href="/analysis/new" className="font-label-md text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider">
              Simulate
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <button className="border border-primary text-primary px-6 py-2 rounded-full font-label-md text-xs font-semibold tracking-wider hover:bg-primary/5 transition-all cursor-pointer">
              Sign In
            </button>
          </Link>
          <Link href="/signup">
            <button className="bg-primary text-white px-6 py-2 rounded-full font-label-md text-xs font-semibold tracking-wider hover:opacity-90 transition-all cursor-pointer">
              Get Started
            </button>
          </Link>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[850px] flex items-center px-6 lg:px-16 max-w-7xl mx-auto overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 items-center z-10 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8 max-w-2xl text-left"
            >
              <div className="inline-flex items-center px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full border border-secondary/20 shadow-sm">
                <span className="material-symbols-outlined mr-2 text-[18px]">verified</span>
                <span className="font-label-md text-xs font-semibold tracking-wider uppercase">PM Surya Ghar Compliant Modeling</span>
              </div>
              <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-6xl font-bold solar-gradient-text leading-tight font-serif">
                Future-Proof Your Roof with SolarIQ AI.
              </h1>
              <p className="font-body-lg text-lg text-on-surface-variant">
                Get a high-precision solar suitability report in 5 minutes using NASA satellite data and ML predictions tailored for the Indian landscape.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/signup">
                  <button className="bg-primary text-on-primary px-8 py-4 rounded-full font-label-md text-sm font-semibold tracking-wider flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer">
                    Start Your Free Analysis
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </Link>
                <Link href="/login">
                  <button className="border border-primary text-primary px-8 py-4 rounded-full font-label-md text-sm font-semibold tracking-wider hover:bg-primary/5 transition-all cursor-pointer">
                    View Sample Report
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Right side interactive mockups */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-[500px] hidden lg:block"
            >
              <div className="absolute inset-0 rounded-[48px] overflow-hidden shadow-2xl">
                <img
                  className="w-full h-full object-cover"
                  alt="A high-angle architectural shot of a modern residential villa featuring rooftop solar panels"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmyxctIF0iyI9drigj5C3u2exfBsqWP5yv-fVKOSXPs0B9B-HIa6xjZ5banUnPQUth4b6zMrj17cEVnRC-xA8HrqUQyVdszzlWV727xYZL6ewP_uoTkm_m2Uf6uEnR7ZH5C95ThSdRrrMa_FRLDI_jBL78lS-9fp8-bb8TstUYA17s_RxKP2rYYBD9qCywuKjtgGmeGFh5_OWuKB7tvPYshffrPpA4SiSblxAOWIAsEL5hamTo0pIEmeshBTukD7VObaDlO4zdcBg"
                />
              </div>

              {/* Overlapping Glass Cards */}
              <div className="glass-card absolute -left-12 top-20 p-6 rounded-3xl w-64 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container">wb_sunny</span>
                  </div>
                  <div>
                    <div className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Efficiency</div>
                    <div className="font-data-display text-[20px] font-bold">24.2%</div>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary-container w-3/4 rounded-full"></div>
                </div>
              </div>

              <div className="glass-card absolute -bottom-8 right-12 p-6 rounded-3xl w-72 shadow-2xl text-left">
                <div className="font-label-md text-xs font-semibold text-primary mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">insights</span>
                  Live Generation
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="font-data-display text-3xl font-bold">1,250</span>
                  <span className="font-label-md text-xs text-on-surface-variant pb-1 font-semibold">kWh/Yr</span>
                </div>
                <div className="flex gap-1.5 h-12 items-end">
                  <div className="bg-primary/20 w-3 rounded-t-sm h-6"></div>
                  <div className="bg-primary/20 w-3 rounded-t-sm h-8"></div>
                  <div className="bg-primary/40 w-3 rounded-t-sm h-12"></div>
                  <div className="bg-primary/20 w-3 rounded-t-sm h-10"></div>
                  <div className="bg-primary w-3 rounded-t-sm h-16"></div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Atmospheric BG */}
          <div className="absolute -right-1/4 top-0 w-[800px] h-[800px] bg-primary-container/5 rounded-full blur-[120px] -z-10"></div>
        </section>

        {/* Quick Stats Section */}
        <section className="py-20 bg-[#eff4ff] border-y border-outline-variant/20">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label} className="space-y-2">
                <h3 className="font-data-display text-4xl lg:text-5xl font-bold text-primary">{value}</h3>
                <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-widest font-semibold">{label}</p>
                <div className="h-1 w-12 bg-secondary mx-auto mt-4 rounded-full"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Grid (Bento) */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl text-left">
              <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-primary mb-4 font-serif">
                Precision Intelligence for Maximum Yield.
              </h2>
              <p className="font-body-md text-on-surface-variant">
                Our platform combines NASA's global solar irradiance data with localized Indian grid modeling to ensure your investment is mathematically optimized.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            {FEATURES.map(({ icon, title, desc, badge, action, pills, span }, idx) => (
              <div
                key={title}
                className={`${
                  span.includes("bg-primary") ? "" : "glass-card"
                } p-10 rounded-[32px] group hover:-translate-y-1 transition-all duration-500 overflow-hidden relative ${span} ${
                  span.includes("bg-primary") ? "border border-primary-container" : ""
                }`}
              >
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-inner border border-white/50 ${
                      span.includes("bg-primary") ? "bg-secondary text-on-primary" : "bg-primary-container/20 text-primary"
                    }`}>
                      <span className="material-symbols-outlined text-[32px]">{icon}</span>
                    </div>
                    <h4 className="font-headline-md text-2xl font-bold mb-4 font-serif">{title}</h4>
                    <p className={`font-body-md text-sm ${span.includes("bg-primary") ? "text-white/80" : "text-on-surface-variant"}`}>
                      {desc}
                    </p>
                  </div>
                  {action && (
                    <Link href="/signup" className="mt-8 flex items-center gap-2 font-label-md text-xs font-bold text-secondary hover:underline uppercase tracking-wider">
                      {action} <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </Link>
                  )}
                  {pills && (
                    <div className="mt-6 flex gap-4">
                      {pills.map((p) => (
                        <div key={p} className="px-4 py-2 bg-surface rounded-xl border border-outline-variant/30 font-label-md text-xs font-semibold">
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {badge && (
                  <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <span className="material-symbols-outlined text-[300px] text-primary">{badge}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA / Conversion */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto bg-primary rounded-[48px] p-12 md:p-24 relative overflow-hidden text-center">
            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <h2 className="font-display-lg text-3xl sm:text-4xl lg:text-5xl font-bold text-on-primary mb-8 font-serif">
                Ready to turn your roof into a revenue engine?
              </h2>
              <p className="font-body-lg text-lg text-on-primary/80 mb-12">
                Join 4,500+ Indian households who have used SolarIQ to plan their transition to sustainable energy.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link href="/signup">
                  <button className="bg-secondary-container text-on-secondary-container px-10 py-5 rounded-full font-label-md text-xs font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
                    Analyze My Roof Now
                  </button>
                </Link>
                <Link href="/login">
                  <button className="bg-white/10 backdrop-blur-md text-on-primary border border-white/20 px-10 py-5 rounded-full font-label-md text-xs font-semibold hover:bg-white/20 transition-all cursor-pointer">
                    Speak to an Advisor
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Component */}
      <footer className="w-full py-12 px-6 lg:px-16 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto border-t border-outline-variant/30 bg-surface-container-lowest text-left mb-0">
        <div className="mb-6 md:mb-0">
          <span className="font-headline-md text-2xl font-bold text-primary font-serif">SolarIQ India</span>
          <p className="font-body-sm text-sm text-on-surface-variant mt-2 opacity-70">
            © 2024 SolarIQ India. AI-Driven Sustainability.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <Link href="/privacy" className="font-label-md text-xs text-on-surface-variant hover:text-secondary transition-colors uppercase tracking-wider font-semibold">
            Privacy Policy
          </Link>
          <Link href="/terms" className="font-label-md text-xs text-on-surface-variant hover:text-secondary transition-colors uppercase tracking-wider font-semibold">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
