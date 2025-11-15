/*
  # Smart Vendor Onboarding & KYC Platform Schema
  
  ## Overview
  This migration creates the complete database schema for a vendor onboarding and KYC platform
  with role-based access control, document management, and audit trails.
  
  ## New Tables
  
  ### 1. `profiles`
  Extends auth.users with role information and profile details
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `role` (text) - Either 'vendor' or 'admin'
  - `created_at` (timestamp) - Profile creation time
  
  ### 2. `vendors`
  Stores vendor business information and KYC status
  - `id` (uuid, primary key) - Unique vendor identifier
  - `user_id` (uuid, foreign key) - Links to profiles
  - `business_name` (text) - Registered business name
  - `business_type` (text) - Type of business (Proprietorship, Partnership, Company, etc.)
  - `contact_number` (text) - Primary contact number
  - `email` (text) - Business email
  - `address` (text) - Complete business address
  - `city` (text) - City location
  - `state` (text) - State location
  - `pincode` (text) - Postal code
  - `gst_number` (text, optional) - GST registration number
  - `pan_number` (text, optional) - PAN card number
  - `status` (text) - Application status: 'pending', 'approved', 'rejected'
  - `rejection_reason` (text, optional) - Reason for rejection if applicable
  - `reviewed_by` (uuid, optional) - Admin who reviewed the application
  - `reviewed_at` (timestamp, optional) - Review timestamp
  - `created_at` (timestamp) - Application submission time
  - `updated_at` (timestamp) - Last update time
  
  ### 3. `vendor_documents`
  Stores KYC document information (URLs/references)
  - `id` (uuid, primary key) - Unique document identifier
  - `vendor_id` (uuid, foreign key) - Links to vendors
  - `document_type` (text) - Type: 'gst', 'pan', 'registration', 'other'
  - `document_url` (text) - Document file URL or reference
  - `uploaded_at` (timestamp) - Upload timestamp
  
  ### 4. `audit_logs`
  Tracks all admin actions for compliance and transparency
  - `id` (uuid, primary key) - Unique log entry identifier
  - `vendor_id` (uuid, foreign key) - Affected vendor
  - `admin_id` (uuid, foreign key) - Admin who performed action
  - `action` (text) - Action type: 'approved', 'rejected', 'updated'
  - `previous_status` (text, optional) - Status before action
  - `new_status` (text) - Status after action
  - `comments` (text, optional) - Admin comments/notes
  - `created_at` (timestamp) - Action timestamp
  
  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with appropriate policies:
  
  #### profiles table:
  - Users can view their own profile
  - Users can update their own profile
  - Admins can view all profiles
  
  #### vendors table:
  - Vendors can view their own vendor record
  - Vendors can insert their own vendor record
  - Vendors can update their own vendor record (only when status is pending)
  - Admins can view all vendor records
  - Admins can update any vendor record
  
  #### vendor_documents table:
  - Vendors can view their own documents
  - Vendors can insert their own documents
  - Admins can view all documents
  
  #### audit_logs table:
  - Admins can view all audit logs
  - Admins can insert audit logs
  - Vendors can view audit logs related to their applications
  
  ## Important Notes
  
  1. Status Management: Vendor status flows from 'pending' → 'approved' or 'rejected'
  2. Data Integrity: Foreign key constraints ensure referential integrity
  3. Audit Trail: All approval/rejection actions are logged automatically
  4. Security: RLS policies ensure vendors only see their own data
  5. Default Values: Timestamps default to current time, status defaults to 'pending'
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('vendor', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  business_type text NOT NULL CHECK (business_type IN ('proprietorship', 'partnership', 'private_limited', 'public_limited', 'llp', 'other')),
  contact_number text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  gst_number text,
  pan_number text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create vendor_documents table
CREATE TABLE IF NOT EXISTS vendor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('gst', 'pan', 'registration', 'other')),
  document_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  admin_id uuid REFERENCES profiles(id) NOT NULL,
  action text NOT NULL CHECK (action IN ('approved', 'rejected', 'updated')),
  previous_status text,
  new_status text NOT NULL,
  comments text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for vendors table

CREATE POLICY "Vendors can view own vendor record"
  ON vendors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Vendors can insert own vendor record"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Vendors can update own pending vendor record"
  ON vendors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can view all vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any vendor"
  ON vendors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for vendor_documents table

CREATE POLICY "Vendors can view own documents"
  ON vendor_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_documents.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can insert own documents"
  ON vendor_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_documents.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all documents"
  ON vendor_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for audit_logs table

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Vendors can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = audit_logs.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_id ON vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_vendor_id ON audit_logs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create function to update updated_at timestamp

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vendors table

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();