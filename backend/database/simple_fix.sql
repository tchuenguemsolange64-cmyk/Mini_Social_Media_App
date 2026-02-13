-- =========================================================
-- SIMPLE DEBUG FIX
-- Unlocks permissions and removes complex triggers
-- =========================================================

-- 1. Disable Row Level Security (RLS) temporarily
-- This rules out any "Permission Denied" errors
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;

-- 2. Drop the "Notification Prev" trigger
-- This removes one failure point. We can re-enable it later.
DROP TRIGGER IF EXISTS on_user_created ON public.users;

-- 3. Redefine the Main Trigger to be as simple as possible
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    -- Just use the part before @ in email as username for now
    SPLIT_PART(NEW.email, '@', 1),
    SPLIT_PART(NEW.email, '@', 1)
  )
  ON CONFLICT (id) DO NOTHING; -- Pass silently if already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach the Auth Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Force enable UUID extension again just in case
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
