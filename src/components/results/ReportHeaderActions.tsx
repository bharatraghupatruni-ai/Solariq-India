"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Download, ShoppingBag, X } from "lucide-react";

interface ReportHeaderActionsProps {
  analysisId: string;
}

export function ReportHeaderActions({ analysisId }: ReportHeaderActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePdfExport = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.print();
  };

  return (
    <>
      <div className="flex gap-3 no-print">
        {/* PDF Export Button (client-side print fallback for local reliability) */}
        <a
          href={`/api/reports/generate?analysisId=${analysisId}`}
          onClick={handlePdfExport}
          className="bg-white border-2 border-primary/20 hover:border-primary/50 text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-2 py-3 px-6 cursor-pointer rounded-full transition-all"
        >
          <Download className="w-4 h-4 text-primary" />
          PDF Export
        </a>

        {/* Finalize Order Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary text-white text-xs uppercase tracking-wider px-8 py-3 rounded-full shadow-lg cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 mr-1" />
          Finalize Order
        </button>
      </div>

      {/* Serene Confirmation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/30 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-white border border-gray-100 rounded-3xl p-8 shadow-lg z-10 text-center"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 transition-colors p-1.5 hover:bg-gray-50 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Pulsing Success Circle */}
              <div className="mx-auto w-16 h-16 bg-eco-50 border border-eco-500/20 rounded-full flex items-center justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="w-10 h-10 bg-eco-500 rounded-full flex items-center justify-center text-white"
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </motion.div>
              </div>

              {/* Modal Text */}
              <span className="text-[10px] font-mono tracking-widest text-[#d97706] uppercase font-bold block mb-1">
                Grid Confirmed
              </span>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-3">
                Solar Project Finalized
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6 font-medium">
                Your rooftop layout parameters have been registered in our certified installer grid. An engineering surveyor will contact you within 24 hours to schedule the physical site inspection and shading validation.
              </p>

              {/* Close / Action button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn-primary w-full text-xs uppercase tracking-wider py-3.5"
              >
                Return to Report
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
