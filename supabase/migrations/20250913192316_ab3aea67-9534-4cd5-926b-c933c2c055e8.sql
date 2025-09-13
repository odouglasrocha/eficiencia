-- Remover roles existentes do usuário e definir como administrador
DELETE FROM public.user_roles WHERE user_id = '84405218-8e03-4d98-b80f-173675777f10';

-- Inserir role de administrador
INSERT INTO public.user_roles (user_id, role)
VALUES ('84405218-8e03-4d98-b80f-173675777f10', 'administrador'::app_role);