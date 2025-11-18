-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- RLS Policy: Users can only view their own reset tokens (for verification)
CREATE POLICY "Users can verify their own reset tokens"
  ON password_reset_tokens
  FOR SELECT
  USING (auth.uid() = user_id OR email = auth.jwt() ->> 'email');

-- RLS Policy: Only service role can insert tokens
CREATE POLICY "Service role can insert reset tokens"
  ON password_reset_tokens
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policy: Only service role can update tokens
CREATE POLICY "Service role can update reset tokens"
  ON password_reset_tokens
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- RLS Policy: Only service role can delete tokens
CREATE POLICY "Service role can delete reset tokens"
  ON password_reset_tokens
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens with expiration for secure password reset flow';
