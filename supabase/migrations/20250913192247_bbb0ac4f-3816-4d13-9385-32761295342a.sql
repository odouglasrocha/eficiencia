-- Remover roles existentes do usuário atual e definir como administrador
DELETE FROM public.user_roles WHERE user_id = auth.uid();

-- Inserir role de administrador para o usuário atual
INSERT INTO public.user_roles (user_id, role)
VALUES (auth.uid(), 'administrador'::app_role);