import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'vendor' | 'admin';
  created_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  contact_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gst_number?: string;
  pan_number?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorDocument {
  id: string;
  vendor_id: string;
  document_type: 'gst' | 'pan' | 'registration' | 'other';
  document_url: string;
  uploaded_at: string;
}

export interface AuditLog {
  id: string;
  vendor_id: string;
  admin_id: string;
  action: 'approved' | 'rejected' | 'updated';
  previous_status?: string;
  new_status: string;
  comments?: string;
  created_at: string;
}
