"use client";

import { motion } from "framer-motion";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-primary">
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Outer orbital spin ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20"
        />
        
        {/* Middle solar flares spin ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-2.5 rounded-full border-t-2 border-r-2 border-amber-500/60"
        />
        
        {/* Inner pulsing sun core */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          className="absolute w-8 h-8 bg-[#fcdf46] rounded-full shadow-[0_0_30px_rgba(252,223,70,0.65)]"
        />
      </div>
      <p className="mt-8 text-xs font-mono uppercase tracking-widest text-stone-500 font-bold animate-pulse">
        Optimizing Solar Grid...
      </p>
    </div>
  );
}
