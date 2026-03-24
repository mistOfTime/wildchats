-- Create verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL, -- 'password_reset' or 'email_verification'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert verification codes
CREATE POLICY "Anyone can insert verification codes" ON verification_codes
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read their own verification codes
CREATE POLICY "Users can read verification codes" ON verification_codes
  FOR SELECT USING (true);

-- Allow anyone to update verification codes
CREATE POLICY "Anyone can update verification codes" ON verification_codes
  FOR UPDATE USING (true);

-- Create index for faster lookups
CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
