-- 20240109_fix_google_oauth.sql
-- Fix: allow Google OAuth users who don't have a phone number

-- Make phone nullable (Google users don't have one)
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- Drop the old unique constraint and add a partial unique index
-- (only enforce uniqueness when phone is not null and not empty)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;
CREATE UNIQUE INDEX users_phone_unique_idx ON users (phone)
  WHERE phone IS NOT NULL AND phone != '';

-- Update the trigger to handle Google OAuth users (no phone, use email)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, display_name, avatar_url)
  VALUES (
    NEW.id,
    NULLIF(COALESCE(NEW.phone, ''), ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1),
      'Usuario'
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(
      EXCLUDED.display_name,
      users.display_name
    ),
    avatar_url = COALESCE(
      EXCLUDED.avatar_url,
      users.avatar_url
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
