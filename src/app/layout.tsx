import type { Metadata } from "next";
import { Sora, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SolarIQ — AI-Powered Solar Feasibility Platform",
  description:
    "Determine if rooftop solar is worth installing with AI-powered analysis, NASA weather data, and financial projections tailored for Indian households.",
  keywords: ["solar energy", "rooftop solar", "solar feasibility", "India solar", "solar ROI", "solar subsidy"],
  openGraph: {
    title: "SolarIQ — AI-Powered Solar Feasibility Platform",
    description: "AI-powered rooftop solar analysis for Indian households and businesses",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${playfair.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased relative">
        <div className="ambient-glow" />
        {children}
      </body>
    </html>
  );
}
