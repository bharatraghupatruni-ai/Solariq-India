export type PanelType = "mono_perc" | "topcon" | "hjt" | "bifacial";
export type PropertyType = "residential" | "commercial" | "industrial" | "agricultural";
export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";
export type PlanType = "free" | "starter" | "pro" | "enterprise";
export type RecommendationLevel = "highly_recommended" | "recommended" | "marginal" | "not_recommended";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  plan_type: PlanType;
  credits_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  property_type: PropertyType | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface RoofAnalysis {
  id: string;
  property_id: string;
  user_id: string;
  status: AnalysisStatus;
  image_urls: string[] | null;
  image_storage_paths: string[] | null;
  total_roof_area_sqm: number | null;
  usable_roof_area_sqm: number | null;
  shading_factor: number | null;
  tilt_angle: number | null;
  azimuth_angle: number | null;
  detected_obstacles: DetectedObstacle[] | null;
  panel_placement_map: PanelPlacementCoord[] | null;
  max_panel_count: number | null;
  ai_confidence_score: number | null;
  processed_image_url: string | null;
  model_version: string | null;
  processing_time_ms: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface DetectedObstacle {
  type: string;
  area_sqm: number;
  confidence: number;
}

export interface PanelPlacementCoord {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UserInput {
  id: string;
  roof_analysis_id: string;
  user_id: string;
  monthly_bill_inr: number;
  monthly_consumption_kwh: number;
  budget_inr: number;
  property_type: PropertyType;
  electricity_rate_per_unit: number;
  discom_name: string | null;
  grid_connected: boolean;
  battery_storage_interest: boolean;
  created_at: string;
}

export interface WeatherData {
  id: string;
  latitude: number;
  longitude: number;
  annual_ghi: number;
  peak_sun_hours_daily: number;
  avg_temperature_c: number;
  avg_humidity_pct: number;
  avg_cloud_cover_pct: number;
  monthly_ghi: number[];
  monthly_temperature: number[];
  monthly_cloud_cover: number[];
  seasonal_patterns: SeasonalPattern;
  data_source: string;
  fetched_at: string;
  expires_at: string;
}

export interface SeasonalPattern {
  best_months: string[];
  worst_months: string[];
  monsoon_months: string[];
}

export interface SolarPrediction {
  id: string;
  roof_analysis_id: string;
  weather_data_id: string;
  user_input_id: string;
  recommended_panel_type: PanelType;
  recommended_panel_count: number;
  system_capacity_kwp: number;
  daily_generation_kwh: number;
  monthly_generation_kwh: number;
  annual_generation_kwh: number;
  lifetime_generation_kwh: number;
  system_efficiency_pct: number;
  performance_ratio: number;
  monthly_generation_breakdown: number[];
  year1_generation_kwh: number;
  year5_generation_kwh: number;
  year10_generation_kwh: number;
  year25_generation_kwh: number;
  xgboost_model_version: string | null;
  prediction_confidence: number;
  created_at: string;
}

export interface FinancialAnalysis {
  id: string;
  solar_prediction_id: string;
  user_id: string;
  gross_installation_cost_inr: number;
  central_subsidy_inr: number;
  state_subsidy_inr: number;
  net_investment_inr: number;
  panel_options: PanelOption[];
  annual_savings_inr: number;
  payback_period_years: number;
  roi_percentage: number;
  irr_percentage: number;
  npv_inr: number;
  savings_5yr_inr: number;
  savings_10yr_inr: number;
  savings_25yr_inr: number;
  co2_offset_annual_kg: number;
  trees_equivalent: number;
  units_sold_to_grid_annual: number;
  grid_export_revenue_annual: number;
  electricity_inflation_rate: number;
  discount_rate: number;
  panel_degradation_rate: number;
  created_at: string;
}

export interface PanelOption {
  type: PanelType;
  cost_inr: number;
  efficiency_pct: number;
  warranty_years: number;
  pros: string[];
  cons: string[];
}

export interface SuitabilityScore {
  id: string;
  roof_analysis_id: string;
  financial_analysis_id: string;
  overall_score: number;
  roof_quality_score: number;
  solar_resource_score: number;
  financial_viability_score: number;
  policy_environment_score: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendation: string;
  recommendation_level: RecommendationLevel;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  roof_analysis_id: string;
  report_type: "full" | "summary" | "financial_only";
  pdf_url: string | null;
  pdf_storage_path: string | null;
  share_token: string;
  is_public: boolean;
  download_count: number;
  created_at: string;
  expires_at: string;
}

export interface FullAnalysisResult {
  analysis: RoofAnalysis;
  userInput: UserInput;
  weatherData: WeatherData;
  solarPrediction: SolarPrediction;
  financialAnalysis: FinancialAnalysis;
  suitabilityScore: SuitabilityScore;
}
