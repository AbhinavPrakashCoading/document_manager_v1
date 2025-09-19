// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

// For demo purposes, we'll use public Supabase demo credentials
// In production, you would use your own Supabase project credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-ref.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey)

// Database Types for TypeScript
export interface DocumentRecord {
  id: string
  user_id: string
  filename: string
  original_name: string
  file_type: string
  file_size: number
  template_id: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  extracted_text?: string
  page_count?: number
  optimized_size?: number
  compliance_score: number
  validation_issues?: ValidationIssue[]
  created_at: string
  updated_at: string
  processed_at?: string
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  field?: string
  canFix: boolean
}

export interface ProcessingSession {
  id: string
  user_id: string
  template_id: string
  total_files: number
  processed_files: number
  failed_files: number
  compliance_score: number
  total_size_saved: number
  status: 'active' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
}