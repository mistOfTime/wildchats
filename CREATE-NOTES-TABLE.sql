-- Create notes table for user status/notes feature
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read all notes
CREATE POLICY "Anyone can view notes"
ON user_notes
FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can insert their own note
CREATE POLICY "Users can create own note"
ON user_notes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own note
CREATE POLICY "Users can update own note"
ON user_notes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own note
CREATE POLICY "Users can delete own note"
ON user_notes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);

-- Verify table was created
SELECT * FROM user_notes LIMIT 1;
