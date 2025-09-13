-- Add role for the existing user if it doesn't exist
INSERT INTO public.user_roles (user_id, role)
SELECT '84405218-8e03-4d98-b80f-173675777f10', 'operador'
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = '84405218-8e03-4d98-b80f-173675777f10'
);