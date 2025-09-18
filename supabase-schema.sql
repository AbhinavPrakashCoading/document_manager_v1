-- Supabase Database Schema for Document Manager
-- Run this SQL in your Supabase project to set up the required tables

-- Enable Row Level Security
SET search_path TO public;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  template_id TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  extracted_text TEXT,
  page_count INTEGER,
  optimized_size INTEGER,
  compliance_score INTEGER NOT NULL DEFAULT 0,
  validation_issues JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT processing_status_check 
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create processing_sessions table
CREATE TABLE IF NOT EXISTS processing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  total_files INTEGER NOT NULL DEFAULT 0,
  processed_files INTEGER NOT NULL DEFAULT 0,
  failed_files INTEGER NOT NULL DEFAULT 0,
  compliance_score INTEGER NOT NULL DEFAULT 0,
  total_size_saved INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT session_status_check 
    CHECK (status IN ('active', 'completed', 'failed'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_template_id ON documents(template_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON processing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_template_id ON processing_sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON processing_sessions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents table
-- Users can only access their own documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents" 
  ON documents FOR SELECT 
  USING (user_id = current_user);

DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
CREATE POLICY "Users can insert their own documents" 
  ON documents FOR INSERT 
  WITH CHECK (user_id = current_user);

DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
CREATE POLICY "Users can update their own documents" 
  ON documents FOR UPDATE 
  USING (user_id = current_user);

DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
CREATE POLICY "Users can delete their own documents" 
  ON documents FOR DELETE 
  USING (user_id = current_user);

-- Create RLS policies for processing_sessions table
DROP POLICY IF EXISTS "Users can view their own sessions" ON processing_sessions;
CREATE POLICY "Users can view their own sessions" 
  ON processing_sessions FOR SELECT 
  USING (user_id = current_user);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON processing_sessions;
CREATE POLICY "Users can insert their own sessions" 
  ON processing_sessions FOR INSERT 
  WITH CHECK (user_id = current_user);

DROP POLICY IF EXISTS "Users can update their own sessions" ON processing_sessions;
CREATE POLICY "Users can update their own sessions" 
  ON processing_sessions FOR UPDATE 
  USING (user_id = current_user);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for authenticated users
GRANT ALL ON documents TO authenticated;
GRANT ALL ON processing_sessions TO authenticated;

-- Grant permissions for anon users (for demo purposes)
GRANT SELECT, INSERT, UPDATE ON documents TO anon;
GRANT SELECT, INSERT, UPDATE ON processing_sessions TO anon;

-- Create a view for document statistics
CREATE OR REPLACE VIEW user_document_stats AS
SELECT 
  user_id,
  COUNT(*) as total_documents,
  SUM(file_size) as total_size_bytes,
  COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as completed_documents,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_documents,
  AVG(compliance_score) as avg_compliance_score
FROM documents
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON user_document_stats TO authenticated;
GRANT SELECT ON user_document_stats TO anon;

-- Sample data for testing (optional - remove in production)
-- INSERT INTO documents (user_id, filename, original_name, file_type, file_size, template_id, processing_status, compliance_score) VALUES
-- ('demo-user', 'processed_admit_card.pdf', 'admit_card.pdf', 'application/pdf', 1024000, 'upsc', 'completed', 95),
-- ('demo-user', 'processed_result.pdf', 'result.pdf', 'application/pdf', 512000, 'upsc', 'completed', 98);

-- INSERT INTO processing_sessions (user_id, template_id, total_files, processed_files, compliance_score, status) VALUES
-- ('demo-user', 'upsc', 2, 2, 96, 'completed');

-- Output success message
SELECT 'Database schema created successfully! 🎉' as message;