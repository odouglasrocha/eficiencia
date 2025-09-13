-- Criar tabela para gerenciar permissões do sistema
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir permissões padrão
INSERT INTO public.permissions (name, description, category) VALUES
('machine.view', 'Visualizar máquinas', 'machines'),
('machine.create', 'Criar máquinas', 'machines'),
('machine.edit', 'Editar máquinas', 'machines'),
('machine.delete', 'Excluir máquinas', 'machines'),
('production.view', 'Visualizar produção', 'production'),
('production.create', 'Inserir dados de produção', 'production'),
('production.edit', 'Editar dados de produção', 'production'),
('production.delete', 'Excluir dados de produção', 'production'),
('alerts.view', 'Visualizar alertas', 'alerts'),
('alerts.manage', 'Gerenciar configurações de alertas', 'alerts'),
('reports.view', 'Visualizar relatórios', 'reports'),
('reports.export', 'Exportar relatórios', 'reports'),
('users.view', 'Visualizar usuários', 'users'),
('users.manage', 'Gerenciar usuários', 'users'),
('system.admin', 'Acesso total ao sistema', 'system')
ON CONFLICT (name) DO NOTHING;

-- Criar tabela para associar permissões a níveis de acesso
CREATE TABLE IF NOT EXISTS public.access_level_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_level TEXT NOT NULL,
  permission_name TEXT NOT NULL REFERENCES public.permissions(name) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(access_level, permission_name)
);

-- Definir permissões por nível de acesso
INSERT INTO public.access_level_permissions (access_level, permission_name) VALUES
-- Operador
('operador', 'machine.view'),
('operador', 'production.view'),
('operador', 'production.create'),
('operador', 'alerts.view'),
-- Supervisor  
('supervisor', 'machine.view'),
('supervisor', 'machine.create'),
('supervisor', 'machine.edit'),
('supervisor', 'production.view'),
('supervisor', 'production.create'),
('supervisor', 'production.edit'),
('supervisor', 'alerts.view'),
('supervisor', 'alerts.manage'),
('supervisor', 'reports.view'),
('supervisor', 'reports.export'),
-- Administrador
('administrador', 'machine.view'),
('administrador', 'machine.create'),
('administrador', 'machine.edit'),
('administrador', 'machine.delete'),
('administrador', 'production.view'),
('administrador', 'production.create'),
('administrador', 'production.edit'),
('administrador', 'production.delete'),
('administrador', 'alerts.view'),
('administrador', 'alerts.manage'),
('administrador', 'reports.view'),
('administrador', 'reports.export'),
('administrador', 'users.view'),
('administrador', 'users.manage'),
('administrador', 'system.admin')
ON CONFLICT (access_level, permission_name) DO NOTHING;

-- Criar tabela para configurações de notificação avançadas por usuário
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  machine_ids UUID[] DEFAULT '{}',
  notification_types JSONB NOT NULL DEFAULT '{"push": true, "email": true, "whatsapp": false, "sms": false}',
  alert_types JSONB NOT NULL DEFAULT '{"oee": true, "downtime": true, "production": true, "maintenance": true, "quality": true}',
  thresholds JSONB NOT NULL DEFAULT '{"oee_min": 65, "downtime_max": 30, "production_min": 85}',
  schedule JSONB NOT NULL DEFAULT '{"enabled": false, "start_hour": 6, "end_hour": 22, "days": [1,2,3,4,5]}',
  frequency_minutes INTEGER NOT NULL DEFAULT 15,
  escalation JSONB NOT NULL DEFAULT '{"enabled": false, "levels": []}',
  quiet_hours JSONB NOT NULL DEFAULT '{"enabled": false, "start": "22:00", "end": "06:00"}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para configurações globais do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configurações padrão do sistema
INSERT INTO public.system_settings (key, value, description, category) VALUES
('notification_templates', '{
  "oee_alert": "🚨 ALERTA OEE - {{machine_name}}\n• Valor Atual: {{current_value}}%\n• Limite: {{threshold}}%\n• Turno: {{shift}}\n• Horário: {{timestamp}}",
  "downtime_alert": "⏰ TEMPO DE PARADA - {{machine_name}}\n• Duração: {{duration}} min\n• Motivo: {{reason}}\n• Turno: {{shift}}\n• Horário: {{timestamp}}",
  "production_alert": "📊 PRODUÇÃO BAIXA - {{machine_name}}\n• Atual: {{current_production}}\n• Meta: {{target_production}}\n• Percentual: {{percentage}}%\n• Turno: {{shift}}"
}', 'Templates de notificação padrão', 'notifications'),
('alert_thresholds', '{
  "oee_critical": 50,
  "oee_warning": 65,
  "downtime_critical": 60,
  "downtime_warning": 30,
  "production_critical": 70,
  "production_warning": 85
}', 'Limites de alerta do sistema', 'alerts'),
('whatsapp_config', '{
  "enabled": false,
  "api_key": "",
  "business_id": "",
  "webhook_url": "",
  "phone_number": ""
}', 'Configurações do WhatsApp Business', 'integrations')
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_level_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para permissions (somente leitura para todos)
CREATE POLICY "Allow read access to permissions" 
ON public.permissions 
FOR SELECT 
USING (true);

-- Políticas RLS para access_level_permissions (somente leitura para todos)
CREATE POLICY "Allow read access to access_level_permissions" 
ON public.access_level_permissions 
FOR SELECT 
USING (true);

-- Políticas RLS para user_notification_settings
CREATE POLICY "Users can view their own notification settings" 
ON public.user_notification_settings 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notification settings" 
ON public.user_notification_settings 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own notification settings" 
ON public.user_notification_settings 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas RLS para system_settings (somente administradores podem modificar)
CREATE POLICY "Allow read access to system_settings" 
ON public.system_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify system_settings" 
ON public.system_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::public.app_role
  )
);

-- Função para verificar permissões de usuário
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.access_level_permissions alp
    JOIN public.machines m ON m.access_level = alp.access_level
    WHERE alp.permission_name = user_has_permission.permission_name
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
      AND ur.role::text = alp.access_level
    )
  );
$$;

-- Função para obter permissões do usuário
CREATE OR REPLACE FUNCTION public.get_user_permissions()
RETURNS TABLE(permission_name TEXT, description TEXT, category TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.name, p.description, p.category
  FROM public.permissions p
  JOIN public.access_level_permissions alp ON p.name = alp.permission_name
  JOIN public.user_roles ur ON ur.role::text = alp.access_level
  WHERE ur.user_id = auth.uid();
$$;