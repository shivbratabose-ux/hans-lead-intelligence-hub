-- =============================================================
-- Hans Lead Intelligence Hub — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================

-- 1. Contacts table (24,498 records)
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text,
  name text,
  company text,
  title text,
  email text,
  phone text,
  location text,
  product text,
  source text,
  status text,
  score text,
  linkedin text,
  country text,
  region text,
  contact_type text,
  created_at timestamptz DEFAULT now()
);

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_contacts_industry ON contacts(industry);
CREATE INDEX IF NOT EXISTS idx_contacts_country ON contacts(country);
CREATE INDEX IF NOT EXISTS idx_contacts_region ON contacts(region);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- 2. Export requests (approval workflow)
CREATE TABLE IF NOT EXISTS export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  user_email text NOT NULL,
  user_name text,
  page text NOT NULL,
  record_count int DEFAULT 0,
  filters jsonb DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- 3. Export audit log
CREATE TABLE IF NOT EXISTS export_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text NOT NULL,
  action text NOT NULL,
  page text,
  record_count int DEFAULT 0,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =============================================================
-- Row Level Security (RLS)
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_audit_log ENABLE ROW LEVEL SECURITY;

-- Contacts: All authenticated users can read
CREATE POLICY "Authenticated users can read contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (true);

-- Contacts: Only admins can insert/update/delete
CREATE POLICY "Admins can manage contacts"
  ON contacts FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Admin')
  );

-- Export requests: Users can create their own, admins can see all
CREATE POLICY "Users can create export requests"
  ON export_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own requests, admins see all"
  ON export_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Admin')
  );

CREATE POLICY "Admins can update export requests"
  ON export_requests FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Admin')
  );

-- Audit log: Authenticated users can insert, admins can read all
CREATE POLICY "Users can create audit entries"
  ON export_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view audit log"
  ON export_audit_log FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Admin')
  );
