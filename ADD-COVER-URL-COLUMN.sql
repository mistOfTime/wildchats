-- Add cover_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Update existing users to have null cover_url (optional, already default)
UPDATE users SET cover_url = NULL WHERE cover_url IS NULL;
