"use client";

import { create } from "zustand";
import type { AnalysisWizardState, LocationStep, PropertyStep, EnergyStep, BudgetStep } from "@/lib/types/analysis";
import type { FullAnalysisResult } from "@/lib/types/database";

interface AnalysisStore {
  wizard: AnalysisWizardState;
  currentAnalysisId: string | null;
  result: FullAnalysisResult | null;
  isLoading: boolean;
  error: string | null;

  setStep: (step: 1 | 2 | 3 | 4) => void;
  setLocation: (location: LocationStep) => void;
  setProperty: (property: PropertyStep) => void;
  setEnergy: (energy: EnergyStep) => void;
  setBudget: (budget: BudgetStep) => void;
  setAnalysisId: (id: string) => void;
  setResult: (result: FullAnalysisResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialWizard: AnalysisWizardState = {
  step: 1,
  location: null,
  property: null,
  energy: null,
  budget: null,
};

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  wizard: initialWizard,
  currentAnalysisId: null,
  result: null,
  isLoading: false,
  error: null,

  setStep: (step) =>
    set((state) => ({ wizard: { ...state.wizard, step } })),

  setLocation: (location) =>
    set((state) => ({ wizard: { ...state.wizard, location, step: 2 } })),

  setProperty: (property) =>
    set((state) => ({ wizard: { ...state.wizard, property, step: 3 } })),

  setEnergy: (energy) =>
    set((state) => ({ wizard: { ...state.wizard, energy, step: 4 } })),

  setBudget: (budget) =>
    set((state) => ({ wizard: { ...state.wizard, budget } })),

  setAnalysisId: (id) => set({ currentAnalysisId: id }),
  setResult: (result) => set({ result, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () =>
    set({ wizard: initialWizard, currentAnalysisId: null, result: null, error: null }),
}));
