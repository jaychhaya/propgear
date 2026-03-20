-- =========================================
-- PropGear Database Schema
-- Run this in Supabase SQL Editor
-- =========================================

-- Users table (simple auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT NOT NULL,
  address TEXT NOT NULL,
  suburb TEXT,
  state TEXT,
  postcode TEXT,
  property_type TEXT DEFAULT 'residential',

  -- Financials
  purchase_price NUMERIC(12,2) NOT NULL,
  purchase_date DATE,
  current_valuation NUMERIC(12,2),
  last_valuation_date DATE,

  -- Loan details
  loan_amount NUMERIC(12,2),
  interest_rate NUMERIC(5,2),
  interest_type TEXT CHECK (interest_type IN ('fixed', 'variable', 'split')) DEFAULT 'variable',
  loan_term_years INTEGER,
  loan_start_date DATE,

  -- Rental
  weekly_rent NUMERIC(8,2),
  is_vacant BOOLEAN DEFAULT false,
  annual_expenses NUMERIC(10,2),

  -- Airbnb / short stay
  airbnb_enabled BOOLEAN DEFAULT false,
  airbnb_nightly_rate NUMERIC(8,2),
  airbnb_occupancy_rate NUMERIC(5,2),

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Valuation history (for YoY chart)
CREATE TABLE IF NOT EXISTS valuation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  valuation_date DATE NOT NULL,
  valuation_amount NUMERIC(12,2) NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI research saved results
CREATE TABLE IF NOT EXISTS research_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  search_criteria JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_results ENABLE ROW LEVEL SECURITY;

-- Properties: users can only see their own
CREATE POLICY "Users see own properties" ON properties
  FOR ALL USING (true);

CREATE POLICY "Users see own valuations" ON valuation_history
  FOR ALL USING (true);

CREATE POLICY "Users see own research" ON research_results
  FOR ALL USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_properties_user ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_valuation_property ON valuation_history(property_id);
CREATE INDEX IF NOT EXISTS idx_research_user ON research_results(user_id);
