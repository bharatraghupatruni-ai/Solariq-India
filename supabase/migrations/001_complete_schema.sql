-- ═══════════════════════════════════════════════════════════════
-- SolarIQ Complete Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE panel_type AS ENUM ('mono_perc', 'topcon', 'hjt', 'bifacial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'industrial', 'agricultural');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('free', 'starter', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recommendation_level AS ENUM ('highly_recommended', 'recommended', 'marginal', 'not_recommended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT,
  phone           TEXT,
  plan_type       plan_type NOT NULL DEFAULT 'free',
  credits_remaining INTEGER NOT NULL DEFAULT 3,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════
-- PROPERTIES
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS properties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  pincode       TEXT,
  property_type property_type,
  latitude      DECIMAL(10,8),
  longitude     DECIMAL(11,8),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- ROOF ANALYSES
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS roof_analyses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                analysis_status NOT NULL DEFAULT 'pending',

  -- Image data
  image_urls            TEXT[],
  image_storage_paths   TEXT[],

  -- AI / calculated outputs
  total_roof_area_sqm   DECIMAL(10,2),
  usable_roof_area_sqm  DECIMAL(10,2),
  shading_factor        DECIMAL(4,3) DEFAULT 0.05,
  tilt_angle            DECIMAL(5,2) DEFAULT 15,
  azimuth_angle         DECIMAL(6,2) DEFAULT 180,
  detected_obstacles    JSONB DEFAULT '[]',
  panel_placement_map   JSONB,
  max_panel_count       INTEGER,
  ai_confidence_score   DECIMAL(4,3),
  processed_image_url   TEXT,

  -- Metadata
  model_version         TEXT DEFAULT 'manual_v1',
  processing_time_ms    INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);

-- ═══════════════════════════════════════════
-- USER INPUTS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_inputs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roof_analysis_id            UUID REFERENCES roof_analyses(id) ON DELETE CASCADE,
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  monthly_bill_inr            DECIMAL(10,2) NOT NULL,
  monthly_consumption_kwh     DECIMAL(10,2) NOT NULL,
  budget_inr                  DECIMAL(12,2) NOT NULL,
  property_type               property_type NOT NULL,
  electricity_rate_per_unit   DECIMAL(6,2) NOT NULL,
  discom_name                 TEXT,
  grid_connected              BOOLEAN NOT NULL DEFAULT TRUE,
  battery_storage_interest    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- WEATHER DATA (cached NASA POWER data)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS weather_data (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude              DECIMAL(10,8) NOT NULL,
  longitude             DECIMAL(11,8) NOT NULL,

  -- NASA POWER outputs
  annual_ghi            DECIMAL(8,2),        -- kWh/m²/year
  peak_sun_hours_daily  DECIMAL(5,2),
  avg_temperature_c     DECIMAL(5,2),
  avg_humidity_pct      DECIMAL(5,2),
  avg_cloud_cover_pct   DECIMAL(5,2),
  monthly_ghi           JSONB,               -- [jan..dec] array of 12 values
  monthly_temperature   JSONB,
  monthly_cloud_cover   JSONB,
  seasonal_patterns     JSONB DEFAULT '{"best_months":[],"worst_months":[],"monsoon_months":["Jun","Jul","Aug","Sep"]}',

  data_source           TEXT NOT NULL DEFAULT 'NASA_POWER',
  fetched_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at            TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

-- ═══════════════════════════════════════════
-- SOLAR PREDICTIONS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS solar_predictions (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roof_analysis_id              UUID REFERENCES roof_analyses(id) ON DELETE CASCADE,
  weather_data_id               UUID REFERENCES weather_data(id),
  user_input_id                 UUID REFERENCES user_inputs(id) ON DELETE CASCADE,

  -- Panel config
  recommended_panel_type        panel_type NOT NULL,
  recommended_panel_count       INTEGER NOT NULL,
  system_capacity_kwp           DECIMAL(8,3) NOT NULL,

  -- Generation
  daily_generation_kwh          DECIMAL(10,3),
  monthly_generation_kwh        DECIMAL(10,3),
  annual_generation_kwh         DECIMAL(10,3) NOT NULL,
  lifetime_generation_kwh       DECIMAL(12,3),
  system_efficiency_pct         DECIMAL(5,2),
  performance_ratio             DECIMAL(4,3),
  monthly_generation_breakdown  JSONB,         -- 12 monthly values

  -- Degradation projections
  year1_generation_kwh          DECIMAL(10,3),
  year5_generation_kwh          DECIMAL(10,3),
  year10_generation_kwh         DECIMAL(10,3),
  year25_generation_kwh         DECIMAL(10,3),

  -- ML metadata
  xgboost_model_version         TEXT,
  prediction_confidence         DECIMAL(4,3) DEFAULT 0.85,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- FINANCIAL ANALYSES
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS financial_analyses (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solar_prediction_id           UUID REFERENCES solar_predictions(id) ON DELETE CASCADE,
  user_id                       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Costs
  gross_installation_cost_inr   DECIMAL(12,2) NOT NULL,
  central_subsidy_inr           DECIMAL(12,2) NOT NULL DEFAULT 0,
  state_subsidy_inr             DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_investment_inr            DECIMAL(12,2) NOT NULL,

  -- Panel options breakdown (JSON array of all 4 panel types)
  panel_options                 JSONB NOT NULL DEFAULT '[]',

  -- Returns
  annual_savings_inr            DECIMAL(12,2) NOT NULL,
  payback_period_years          DECIMAL(5,2),
  roi_percentage                DECIMAL(6,2),
  irr_percentage                DECIMAL(6,2),
  npv_inr                       DECIMAL(14,2),

  -- Savings milestones
  savings_5yr_inr               DECIMAL(12,2),
  savings_10yr_inr              DECIMAL(12,2),
  savings_25yr_inr              DECIMAL(12,2),

  -- Environmental
  co2_offset_annual_kg          DECIMAL(10,2),
  trees_equivalent              INTEGER,

  -- Grid / net metering
  units_sold_to_grid_annual     DECIMAL(10,2),
  grid_export_revenue_annual    DECIMAL(10,2),

  -- Assumptions used
  electricity_inflation_rate    DECIMAL(4,3) NOT NULL DEFAULT 0.06,
  discount_rate                 DECIMAL(4,3) NOT NULL DEFAULT 0.08,
  panel_degradation_rate        DECIMAL(5,4) NOT NULL DEFAULT 0.005,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- SUITABILITY SCORES
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS suitability_scores (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roof_analysis_id            UUID NOT NULL REFERENCES roof_analyses(id) ON DELETE CASCADE,
  financial_analysis_id       UUID REFERENCES financial_analyses(id) ON DELETE CASCADE,

  overall_score               INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),

  -- Sub-scores (0-100 each)
  roof_quality_score          INTEGER CHECK (roof_quality_score BETWEEN 0 AND 100),
  solar_resource_score        INTEGER CHECK (solar_resource_score BETWEEN 0 AND 100),
  financial_viability_score   INTEGER CHECK (financial_viability_score BETWEEN 0 AND 100),
  policy_environment_score    INTEGER CHECK (policy_environment_score BETWEEN 0 AND 100),

  -- Insights
  strengths                   TEXT[] DEFAULT '{}',
  weaknesses                  TEXT[] DEFAULT '{}',
  opportunities               TEXT[] DEFAULT '{}',
  recommendation              TEXT,
  recommendation_level        recommendation_level NOT NULL,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- PANEL RECOMMENDATIONS (detailed)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS panel_recommendations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solar_prediction_id   UUID REFERENCES solar_predictions(id) ON DELETE CASCADE,
  panel_type            panel_type NOT NULL,
  brand_suggestions     TEXT[] DEFAULT '{}',
  model_suggestions     TEXT[] DEFAULT '{}',
  efficiency_pct        DECIMAL(5,2),
  cost_per_watt_inr     DECIMAL(6,2),
  warranty_years        INTEGER,
  temperature_coefficient DECIMAL(6,4),
  pros                  TEXT[] DEFAULT '{}',
  cons                  TEXT[] DEFAULT '{}',
  best_for              TEXT,
  rank                  INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- REPORTS
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roof_analysis_id    UUID REFERENCES roof_analyses(id) ON DELETE CASCADE,
  report_type         TEXT NOT NULL DEFAULT 'full' CHECK (report_type IN ('full','summary','financial_only')),
  pdf_url             TEXT,
  pdf_storage_path    TEXT,
  share_token         TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public           BOOLEAN NOT NULL DEFAULT FALSE,
  download_count      INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days')
);

-- ═══════════════════════════════════════════
-- API USAGE TRACKING
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS api_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint        TEXT,
  credits_used    INTEGER NOT NULL DEFAULT 1,
  response_time_ms INTEGER,
  status_code     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Properties
CREATE INDEX IF NOT EXISTS idx_properties_user ON properties(user_id);

-- Roof analyses
CREATE INDEX IF NOT EXISTS idx_roof_analyses_user ON roof_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_roof_analyses_property ON roof_analyses(property_id);
CREATE INDEX IF NOT EXISTS idx_roof_analyses_status ON roof_analyses(status);
CREATE INDEX IF NOT EXISTS idx_roof_analyses_created ON roof_analyses(created_at DESC);

-- Weather data (geo-cache lookup)
CREATE INDEX IF NOT EXISTS idx_weather_lat_lon ON weather_data(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_weather_expires ON weather_data(expires_at);

-- Solar predictions
CREATE INDEX IF NOT EXISTS idx_solar_analysis ON solar_predictions(roof_analysis_id);

-- Financial analyses
CREATE INDEX IF NOT EXISTS idx_financial_solar ON financial_analyses(solar_prediction_id);
CREATE INDEX IF NOT EXISTS idx_financial_user ON financial_analyses(user_id);

-- Suitability scores
CREATE INDEX IF NOT EXISTS idx_suitability_analysis ON suitability_scores(roof_analysis_id);

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_token ON reports(share_token);
CREATE INDEX IF NOT EXISTS idx_reports_expires ON reports(expires_at);

-- API usage
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON api_usage(user_id, created_at DESC);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════

-- Enable RLS on all user-data tables
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties         ENABLE ROW LEVEL SECURITY;
ALTER TABLE roof_analyses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inputs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_predictions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE suitability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage          ENABLE ROW LEVEL SECURITY;

-- weather_data is public read (cached, no PII)
ALTER TABLE weather_data       ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weather_public_read" ON weather_data FOR SELECT USING (true);
CREATE POLICY "weather_service_write" ON weather_data FOR INSERT WITH CHECK (true);

-- USERS: own data only
CREATE POLICY "users_select_own"  ON users FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "users_update_own"  ON users FOR UPDATE  USING (auth.uid() = id);

-- PROPERTIES: own data only
CREATE POLICY "props_all_own" ON properties FOR ALL USING (auth.uid() = user_id);

-- ROOF ANALYSES: own data only
CREATE POLICY "analyses_all_own" ON roof_analyses FOR ALL USING (auth.uid() = user_id);

-- USER INPUTS: own data only
CREATE POLICY "inputs_all_own" ON user_inputs FOR ALL USING (auth.uid() = user_id);

-- SOLAR PREDICTIONS: own via analysis
CREATE POLICY "solar_select_own" ON solar_predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roof_analyses ra
      WHERE ra.id = solar_predictions.roof_analysis_id
        AND ra.user_id = auth.uid()
    )
  );
CREATE POLICY "solar_insert" ON solar_predictions FOR INSERT WITH CHECK (true);

-- FINANCIAL ANALYSES: own data
CREATE POLICY "financial_all_own" ON financial_analyses FOR ALL USING (auth.uid() = user_id);

-- SUITABILITY SCORES: own via analysis
CREATE POLICY "suitability_select_own" ON suitability_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roof_analyses ra
      WHERE ra.id = suitability_scores.roof_analysis_id
        AND ra.user_id = auth.uid()
    )
  );
CREATE POLICY "suitability_insert" ON suitability_scores FOR INSERT WITH CHECK (true);

-- PANEL RECOMMENDATIONS: own via prediction
CREATE POLICY "panel_rec_select_own" ON panel_recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM solar_predictions sp
      JOIN roof_analyses ra ON ra.id = sp.roof_analysis_id
      WHERE sp.id = panel_recommendations.solar_prediction_id
        AND ra.user_id = auth.uid()
    )
  );
CREATE POLICY "panel_rec_insert" ON panel_recommendations FOR INSERT WITH CHECK (true);

-- REPORTS: own + public share
CREATE POLICY "reports_own" ON reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "reports_public_read" ON reports FOR SELECT
  USING (is_public = true AND expires_at > NOW());

-- API USAGE: own data
CREATE POLICY "api_usage_own" ON api_usage FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "api_usage_insert" ON api_usage FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════

-- Get user's analysis count for credit checking
CREATE OR REPLACE FUNCTION get_user_analysis_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM roof_analyses
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', NOW());
$$;

-- Cleanup expired weather cache (call via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_weather()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM weather_data WHERE expires_at < NOW();
$$;

-- Cleanup expired reports
CREATE OR REPLACE FUNCTION cleanup_expired_reports()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE reports SET pdf_url = NULL, pdf_storage_path = NULL
  WHERE expires_at < NOW() AND pdf_url IS NOT NULL;
$$;

-- ═══════════════════════════════════════════
-- STORAGE BUCKETS (run separately or via dashboard)
-- ═══════════════════════════════════════════

-- Uncomment and run if using Supabase Storage:
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('roof-images', 'roof-images', false, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('reports', 'reports', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own files
CREATE POLICY "roof_images_own" ON storage.objects FOR ALL
  USING (bucket_id = 'roof-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "reports_own" ON storage.objects FOR ALL
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
*/

-- ═══════════════════════════════════════════
-- SEED DATA (panel reference data)
-- ═══════════════════════════════════════════

-- No seed data required — panel specs are in application constants.
-- The schema is now complete and ready for use.

SELECT 'SolarIQ schema created successfully! ✅' AS status;
