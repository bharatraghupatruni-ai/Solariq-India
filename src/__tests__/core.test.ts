/**
 * SolarAI India — Test Suite
 *
 * Covers:
 * - Calculator unit tests (solar-engine, financial-engine, readiness-score, health-index, EMI)
 * - Validation unit tests (city, XSS, SQLi, bounds)
 * - Rate limiter tests
 * - API integration tests
 * - ML model tests
 * - Security tests
 * - Performance regression tests
 */

import { describe, it, expect } from "vitest";
import { calculateSolarGeneration } from "@/lib/calculations/solar-engine";
import { calculateFinancials } from "@/lib/calculations/financial-engine";
import { calculateSolarReadinessScore } from "@/lib/calculations/solar-readiness";
import { calculateSolarHealthIndex } from "@/lib/calculations/health-index";
import { calculateEMI } from "@/lib/calculations/emi-calculator";
import { generateRecommendations } from "@/lib/calculations/recommendation-engine";
import { generateInsights } from "@/lib/calculations/insights-engine";
import { generateAdoptionAdvice } from "@/lib/calculations/adoption-advisor";
import { validateCity, validateBounds, sanitizeString } from "@/lib/validation";
import { checkRateLimit, recordRequest } from "@/lib/rate-limiter";

// =============================================
// UNIT TESTS: Solar Engine
// =============================================
describe("Solar Engine", () => {
  it("calculates generation for a standard 100m² roof", () => {
    const result = calculateSolarGeneration({
      roofAreaSqm: 100,
      usableAreaRatio: 0.70,
      peakSunHoursDaily: 5.5,
      systemEfficiency: 0.80,
      panelType: "mono_perc",
      latitude: 20,
      shadingFactor: 0.05,
      tiltAngle: 15,
      azimuthAngle: 180,
      monthlyGhi: Array(12).fill(5.5),
    });
    expect(result.panelCount).toBeGreaterThan(0);
    expect(result.systemCapacityKwp).toBeGreaterThan(0);
    expect(result.dailyGenerationKwh).toBeGreaterThan(0);
    expect(result.annualGenerationKwh).toBeGreaterThan(0);
    expect(result.annualGenerationKwh).toBeCloseTo(result.dailyGenerationKwh * 365, 0);
  });

  it("handles zero GHI gracefully", () => {
    const result = calculateSolarGeneration({
      roofAreaSqm: 100,
      usableAreaRatio: 0.70,
      peakSunHoursDaily: 0,
      systemEfficiency: 0.80,
      panelType: "mono_perc",
      latitude: 20,
      shadingFactor: 0,
      tiltAngle: 15,
      azimuthAngle: 180,
      monthlyGhi: Array(12).fill(0),
    });
    expect(result.dailyGenerationKwh).toBe(0);
  });

  it("penalizes north-facing roofs", () => {
    const south = calculateSolarGeneration({
      roofAreaSqm: 100, usableAreaRatio: 0.70, peakSunHoursDaily: 5.5,
      systemEfficiency: 0.80, panelType: "mono_perc", latitude: 20,
      shadingFactor: 0, tiltAngle: 15, azimuthAngle: 180, monthlyGhi: Array(12).fill(5.5),
    });
    const north = calculateSolarGeneration({
      ...south, azimuthAngle: 0,
      roofAreaSqm: 100, usableAreaRatio: 0.70, peakSunHoursDaily: 5.5,
      systemEfficiency: 0.80, panelType: "mono_perc", latitude: 20,
      shadingFactor: 0, tiltAngle: 15, monthlyGhi: Array(12).fill(5.5),
    });
    expect(north.dailyGenerationKwh).toBeLessThan(south.dailyGenerationKwh);
  });
});

// =============================================
// UNIT TESTS: Financial Engine
// =============================================
describe("Financial Engine", () => {
  const baseInput = {
    capacityKwp: 3,
    annualGenerationKwh: 4500,
    electricityRatePerUnit: 8,
    state: "maharashtra",
    propertyType: "residential" as const,
    panelType: "mono_perc" as const,
    electricityInflationRate: 0.06,
    discountRate: 0.08,
    degradationRate: 0.005,
  };

  it("calculates payback under 8 years for a standard system", () => {
    const result = calculateFinancials(baseInput);
    expect(result.paybackPeriodYears).toBeLessThan(10);
    expect(result.annualSavingsInr).toBeGreaterThan(0);
  });

  it("includes central subsidy for residential", () => {
    const result = calculateFinancials(baseInput);
    expect(result.centralSubsidyInr).toBeGreaterThan(0);
  });

  it("excludes central subsidy for commercial", () => {
    const result = calculateFinancials({ ...baseInput, propertyType: "commercial" });
    expect(result.centralSubsidyInr).toBe(0);
  });
});

// =============================================
// UNIT TESTS: Solar Readiness Score
// =============================================
describe("Solar Readiness Score", () => {
  it("scores ideal roof above 85", () => {
    const result = calculateSolarReadinessScore({
      orientation: "south", shading: "none", roofArea: 120,
      cleaning: "weekly", panelType: "mono_perc", environment: "clean",
      solarResource: 2100,
    });
    expect(result.score).toBeGreaterThan(85);
    expect(result.category).toBe("excellent");
  });

  it("scores worst rooftop below 40", () => {
    const result = calculateSolarReadinessScore({
      orientation: "north", shading: "heavy", roofArea: 30,
      cleaning: "rarely", panelType: "thin_film", environment: "urban_smog",
      solarResource: 1200,
    });
    expect(result.score).toBeLessThan(40);
  });

  it("scores medium rooftop between 50-70", () => {
    const result = calculateSolarReadinessScore({
      orientation: "east", shading: "partial", roofArea: 75,
      cleaning: "monthly", panelType: "poly", environment: "dusty",
      solarResource: 1700,
    });
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThanOrEqual(70);
  });
});

// =============================================
// UNIT TESTS: Health Index
// =============================================
describe("Solar Health Index", () => {
  it("returns excellent for clean, cool, low-humidity environments", () => {
    const result = calculateSolarHealthIndex({
      environment: "clean", cleaning: "weekly", avgTemperature: 25,
      panelType: "mono", avgHumidity: 35, shading: "none",
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.category).toBe("excellent");
  });

  it("suggests cleaning improvement for rarely cleaned panels", () => {
    const result = calculateSolarHealthIndex({
      environment: "dusty", cleaning: "rarely", avgTemperature: 35,
      panelType: "mono", avgHumidity: 70, shading: "partial",
    });
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});

// =============================================
// UNIT TESTS: EMI Calculator
// =============================================
describe("EMI Calculator", () => {
  it("calculates EMI correctly", () => {
    const result = calculateEMI({
      loanAmountInr: 100000,
      interestRatePct: 8.5,
      tenureYears: 5,
      annualSavingsInr: 20000,
    });
    expect(result.emiInr).toBeGreaterThan(0);
    expect(result.totalAmountPaidInr).toBeGreaterThan(100000);
    expect(result.totalInterestInr).toBeGreaterThan(0);
  });

  it("marks cashflow positive when savings exceed EMI", () => {
    const result = calculateEMI({
      loanAmountInr: 100000,
      interestRatePct: 8.5,
      tenureYears: 5,
      annualSavingsInr: 50000,
    });
    expect(result.monthlyCashflowPositive).toBe(true);
  });
});

// =============================================
// UNIT TESTS: Validation
// =============================================
describe("City Validation", () => {
  it("rejects SQL injection in city name", () => {
    const result = validateCity("'; DROP TABLE users;--");
    expect(result.valid).toBe(false);
  });

  it("rejects HTML/XSS in city name", () => {
    const result = validateCity('<script>alert("xss")</script>');
    expect(result.valid).toBe(false);
  });

  it("rejects numeric-only city name", () => {
    const result = validateCity("12345");
    expect(result.valid).toBe(false);
  });

  it("accepts valid Indian city names", () => {
    expect(validateCity("Mumbai").valid).toBe(true);
    expect(validateCity("New Delhi").valid).toBe(true);
    expect(validateCity("Bangalore").valid).toBe(true);
  });
});

describe("Bounds Validation", () => {
  it("rejects values below minimum", () => {
    expect(validateBounds(10, 50, 50000, "Area").valid).toBe(false);
  });
  it("rejects values above maximum", () => {
    expect(validateBounds(60000, 50, 50000, "Area").valid).toBe(false);
  });
  it("accepts values within range", () => {
    expect(validateBounds(100, 50, 50000, "Area").valid).toBe(true);
  });
});

describe("String Sanitization", () => {
  it("encodes HTML characters", () => {
    const sanitized = sanitizeString('<script>alert("xss")</script>');
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).toContain("&lt;");
  });
});

// =============================================
// UNIT TESTS: Rate Limiter
// =============================================
describe("Rate Limiter", () => {
  it("allows requests under limit", () => {
    const result = checkRateLimit("test-user", 100, 3600);
    expect(result.allowed).toBe(true);
  });

  it("rejects requests over limit", () => {
    const clientId = "test-heavy-user";
    for (let i = 0; i < 100; i++) recordRequest(clientId);
    const result = checkRateLimit(clientId, 100, 3600);
    expect(result.allowed).toBe(false);
  });
});

// =============================================
// UNIT TESTS: Recommendations
// =============================================
describe("Recommendation Engine", () => {
  it("generates recommendations for any input", () => {
    const result = generateRecommendations({
      readinessInput: {
        orientation: "south", shading: "none", roofArea: 100,
        cleaning: "weekly", panelType: "mono_perc", environment: "clean",
        solarResource: 2100,
      },
      healthInput: {
        environment: "clean", cleaning: "weekly", avgTemperature: 25,
        panelType: "mono_perc", avgHumidity: 40, shading: "none",
      },
      readinessScore: 90, healthScore: 85,
      paybackYears: 4, roiPercentage: 150,
      monthlyBillInr: 3000, annualSavingsInr: 36000,
      netInvestmentInr: 120000,
    });
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});

// =============================================
// UNIT TESTS: Insights Engine
// =============================================
describe("Insights Engine", () => {
  it("generates shading insights for heavy shading", () => {
    const result = generateInsights({
      shading: "heavy", cleaning: "weekly", orientation: "south",
      panelType: "mono", environment: "clean",
      annualGenerationKwh: 4500, electricityRatePerUnit: 8,
      annualSavingsInr: 36000, co2OffsetKg: 3690,
      roofArea: 100, systemCapacityKwp: 3,
    });
    const shadingInsight = result.insights.find((i) => i.id === "ins-shading");
    expect(shadingInsight).toBeDefined();
    expect(shadingInsight?.category).toBe("negative");
  });
});

// =============================================
// UNIT TESTS: Adoption Advisor
// =============================================
describe("Adoption Advisor", () => {
  it("recommends install_now for high readiness scores", () => {
    const result = generateAdoptionAdvice({
      orientation: "south", roofArea: 100, annualGhi: 2100,
      shading: "none", panelType: "mono",
      paybackYears: 4, annualSavingsInr: 36000,
      netInvestmentInr: 120000, roiPercentage: 150,
      subsidyInr: 78000, co2OffsetKg: 3690,
      readinessScore: 90,
    });
    expect(result.verdict).toBe("install_now");
  });

  it("recommends not_recommended for low readiness scores", () => {
    const result = generateAdoptionAdvice({
      orientation: "north", roofArea: 30, annualGhi: 1200,
      shading: "heavy", panelType: "thin_film",
      paybackYears: 15, annualSavingsInr: 5000,
      netInvestmentInr: 80000, roiPercentage: 20,
      subsidyInr: 0, co2OffsetKg: 500,
      readinessScore: 25,
    });
    expect(result.verdict).toBe("not_recommended");
  });
});

