-- Fix handle_new_user trigger to handle email conflicts (e.g., user signs up
-- with Google, then tries email signup with same address, or vice versa).
-- Also fixes search_path from '' to 'public' so enum types resolve correctly.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, subscription_tier, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.users.full_name),
    updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- Email already exists from a different auth method — update the existing row
  UPDATE public.users
  SET
    id = NEW.id,
    full_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), full_name),
    updated_at = NOW()
  WHERE email = NEW.email;
  RETURN NEW;
END;
$$;
