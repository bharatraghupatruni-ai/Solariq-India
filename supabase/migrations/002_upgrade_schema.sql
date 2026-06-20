-- Upgrade Schema: Add consolidated predictions, cities, weather_cache, tariffs, and subsidies tables

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  state       TEXT NOT NULL,
  latitude    DECIMAL(10,8) NOT NULL,
  longitude   DECIMAL(11,8) NOT NULL,
  tariff_zone INTEGER NOT NULL DEFAULT 1,
  discom      TEXT
);

-- Weather Cache table (handles both NASA historical and OpenWeather forecasts)
CREATE TABLE IF NOT EXISTS weather_cache (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude           DECIMAL(10,8) NOT NULL,
  longitude          DECIMAL(11,8) NOT NULL,
  current_temp       DECIMAL(5,2),
  current_humidity   DECIMAL(5,2),
  current_clouds     DECIMAL(5,2),
  current_conditions TEXT,
  forecast_data      JSONB DEFAULT '[]',
  fetched_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tariffs table
CREATE TABLE IF NOT EXISTS tariffs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state           TEXT UNIQUE NOT NULL,
  base_rate       DECIMAL(6,2) NOT NULL,
  commercial_rate DECIMAL(6,2) NOT NULL
);

-- Subsidies table
CREATE TABLE IF NOT EXISTS subsidies (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capacity_limit_kwp DECIMAL(6,2) NOT NULL,
  rate_per_kw        DECIMAL(10,2) NOT NULL
);

-- Predictions table (consolidates all inputs, outputs, scores, AI insights, and what-if simulation results)
CREATE TABLE IF NOT EXISTS predictions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  city                    TEXT NOT NULL,
  state                   TEXT NOT NULL,
  roof_area_sqm           DECIMAL(10,2) NOT NULL,
  monthly_bill_inr        DECIMAL(10,2) NOT NULL,
  monthly_consumption_kwh DECIMAL(10,2) NOT NULL,
  budget_inr              DECIMAL(12,2) NOT NULL,
  property_type           TEXT NOT NULL,
  panel_type              TEXT NOT NULL,
  orientation             TEXT NOT NULL,
  shading                 TEXT NOT NULL,
  cleaning                TEXT NOT NULL,
  environment             TEXT NOT NULL,
  
  -- Outputs
  daily_generation_kwh    DECIMAL(10,3) NOT NULL,
  monthly_generation_kwh  DECIMAL(10,3) NOT NULL,
  annual_generation_kwh   DECIMAL(10,3) NOT NULL,
  net_investment_inr      DECIMAL(12,2) NOT NULL,
  gross_cost_inr          DECIMAL(12,2) NOT NULL,
  central_subsidy_inr     DECIMAL(12,2) NOT NULL,
  state_subsidy_inr       DECIMAL(12,2) NOT NULL,
  payback_years           DECIMAL(5,2) NOT NULL,
  roi_pct                 DECIMAL(8,2) NOT NULL,
  npv_inr                 DECIMAL(14,2) NOT NULL,
  co2_offset_kg           DECIMAL(10,2) NOT NULL,
  trees_equivalent        INTEGER NOT NULL,
  
  -- Engine results
  solar_score             INTEGER NOT NULL,
  health_index            INTEGER NOT NULL,
  recommendations         JSONB NOT NULL DEFAULT '[]',
  insights                JSONB NOT NULL DEFAULT '[]',
  whatif_results          JSONB NOT NULL DEFAULT '[]',
  
  -- Confidence metrics
  confidence_percent      INTEGER NOT NULL,
  confidence_low          DECIMAL(10,3) NOT NULL,
  confidence_high         DECIMAL(10,3) NOT NULL,
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_weather_cache_coords ON weather_cache(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

-- Row Level Security (RLS) policies
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidies ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cities_public_read" ON cities FOR SELECT USING (true);
CREATE POLICY "weather_cache_public_read" ON weather_cache FOR SELECT USING (true);
CREATE POLICY "tariffs_public_read" ON tariffs FOR SELECT USING (true);
CREATE POLICY "subsidies_public_read" ON subsidies FOR SELECT USING (true);

CREATE POLICY "predictions_own_all" ON predictions FOR ALL USING (auth.uid() = user_id);

-- Seed values for cities
INSERT INTO cities (name, state, latitude, longitude, tariff_zone, discom) VALUES
  ('mumbai', 'maharashtra', 19.0760, 72.8777, 2, 'MSEDCL / Tata Power / Adani'),
  ('delhi', 'delhi', 28.6139, 77.2090, 2, 'BSES Rajdhani / BSES Yamuna / Tata Power Delhi'),
  ('bangalore', 'karnataka', 12.9716, 77.5946, 2, 'BESCOM / MESCOM / HESCOM / GESCOM / CESC'),
  ('chennai', 'tamil_nadu', 13.0827, 80.2707, 1, 'TANGEDCO'),
  ('hyderabad', 'telangana', 17.3850, 78.4867, 1, 'TSSPDCL / TSNPDCL'),
  ('kolkata', 'west_bengal', 22.5726, 88.3639, 3, 'WBSEDCL / CESC'),
  ('ahmedabad', 'gujarat', 23.0225, 72.5714, 1, 'DGVCL / MGVCL / PGVCL / UGVCL')
ON CONFLICT (name) DO NOTHING;

-- Seed tariffs
INSERT INTO tariffs (state, base_rate, commercial_rate) VALUES
  ('maharashtra', 8.50, 12.00),
  ('delhi', 5.50, 9.00),
  ('karnataka', 7.10, 10.50),
  ('tamil_nadu', 5.00, 8.50),
  ('telangana', 6.80, 10.00),
  ('west_bengal', 7.20, 11.00),
  ('gujarat', 5.80, 9.50)
ON CONFLICT (state) DO NOTHING;
