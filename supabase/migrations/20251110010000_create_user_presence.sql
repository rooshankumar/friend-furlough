-- Create user_presence table for real-time online status tracking
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen DESC);

-- Enable Row Level Security
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Everyone can view presence status (public information)
CREATE POLICY "Anyone can view user presence"
ON user_presence
FOR SELECT
USING (true);

-- Users can only update their own presence
CREATE POLICY "Users can update own presence"
ON user_presence
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence"
ON user_presence
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on presence changes
DROP TRIGGER IF EXISTS trigger_update_user_presence_timestamp ON user_presence;
CREATE TRIGGER trigger_update_user_presence_timestamp
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence_timestamp();

-- Function to mark users as offline if inactive for more than 5 minutes
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  UPDATE user_presence
  SET status = 'offline'
  WHERE status != 'offline'
    AND updated_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON TABLE user_presence IS 'Tracks real-time user online/offline status with automatic cleanup';
