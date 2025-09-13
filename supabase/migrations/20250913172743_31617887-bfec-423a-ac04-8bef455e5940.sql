-- Create a profile for the existing user if it doesn't exist
INSERT INTO public.profiles (user_id, full_name)
SELECT '84405218-8e03-4d98-b80f-173675777f10', 'odouglasrocha@gmail.com'
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = '84405218-8e03-4d98-b80f-173675777f10'
);

-- Also create the missing trigger to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email));
  
  -- Give default role of 'operador' to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operador');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();