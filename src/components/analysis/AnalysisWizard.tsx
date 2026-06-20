"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useAnalysisStore } from "@/stores/analysis-store";
import { Step1Location } from "./steps/Step1Location";
import { Step2Property } from "./steps/Step2Property";
import { Step3Energy } from "./steps/Step3Energy";
import { Step4Budget } from "./steps/Step4Budget";

const STEPS = [
  { label: "Location" },
  { label: "Property" },
  { label: "Energy" },
  { label: "Budget" },
];

export function AnalysisWizard() {
  const { wizard, setStep } = useAnalysisStore();
  const currentStep = wizard.step;
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="flex flex-col gap-12 text-on-surface">
      {/* Progress Indicator */}
      <div className="max-w-3xl mx-auto w-full mb-4 relative z-0">
        <div className="flex justify-between relative isolate">
          <div className="absolute top-5 left-0 w-full h-[2px] bg-stone-200 z-0 -translate-y-1/2"></div>
          <div
            className="absolute top-5 left-0 h-[2px] bg-[#0b513d] z-0 -translate-y-1/2 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
          
          {/* Step Markers */}
          {STEPS.map((step, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3 | 4;
            const isCompleted = currentStep > stepNum;
            const isActive = currentStep === stepNum;
            const canGoTo = stepNum < currentStep;

            return (
              <button
                key={step.label}
                disabled={!canGoTo}
                onClick={() => setStep(stepNum)}
                className={`flex flex-col items-center gap-2 group cursor-pointer focus:outline-none relative z-10 ${
                  !canGoTo ? "cursor-default" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all relative z-10 ${
                    isCompleted
                      ? "bg-[#0b513d] text-white border-[#0b513d] shadow-sm"
                      : isActive
                      ? "bg-[#fcdf46] text-primary border-primary shadow-sm scale-105"
                      : "bg-white border-stone-200 text-stone-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`font-label-md text-xs font-semibold tracking-wide ${
                    isActive || isCompleted ? "text-primary font-bold" : "text-stone-400"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wizard Content */}
      <div className="max-w-4xl mx-auto w-full">
        <div className="glass-card rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, cubicBezier: [0.4, 0, 0.2, 1] }}
            >
              {currentStep === 1 && <Step1Location />}
              {currentStep === 2 && <Step2Property />}
              {currentStep === 3 && <Step3Energy />}
              {currentStep === 4 && <Step4Budget />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
