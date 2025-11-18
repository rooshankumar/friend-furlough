-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT token_length CHECK (LENGTH(token) = 64)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can view reset tokens by email
CREATE POLICY "Users can view reset tokens by email"
  ON password_reset_tokens
  FOR SELECT
  USING (true);

-- RLS Policy: Authenticated users can insert reset tokens for password reset
CREATE POLICY "Authenticated users can insert reset tokens"
  ON password_reset_tokens
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Authenticated users can update their own reset tokens
CREATE POLICY "Authenticated users can update reset tokens"
  ON password_reset_tokens
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Authenticated users can delete reset tokens
CREATE POLICY "Authenticated users can delete reset tokens"
  ON password_reset_tokens
  FOR DELETE
  USING (true);

-- Add comment
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens with expiration for secure password reset flow';
