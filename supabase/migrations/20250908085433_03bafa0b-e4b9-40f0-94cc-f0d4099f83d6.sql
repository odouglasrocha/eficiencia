-- Create alert_configurations table for notification settings
CREATE TABLE public.alert_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default', -- Default user for shared configurations
  notification_types JSONB NOT NULL DEFAULT '{
    "email": true,
    "push": true, 
    "sound": false,
    "whatsapp": false
  }'::jsonb,
  alert_types JSONB NOT NULL DEFAULT '{
    "oee": true,
    "downtime": true,
    "maintenance": true,
    "production": true
  }'::jsonb,
  alert_level TEXT NOT NULL DEFAULT 'medium' CHECK (alert_level IN ('high', 'medium', 'low')),
  frequency INTEGER NOT NULL DEFAULT 5 CHECK (frequency IN (1, 5, 15, 30, 60)),
  recipients JSONB NOT NULL DEFAULT '{
    "emails": [],
    "whatsapp_numbers": []
  }'::jsonb,
  advanced_settings JSONB NOT NULL DEFAULT '{
    "critical_only": false,
    "summary_reports": false,
    "whatsapp_template": "🚨 ALERTA OEE - {{machine_name}}\n• Tipo: {{alert_type}}\n• Valor: {{current_value}}%\n• Limite: {{threshold}}%\n• Horário: {{timestamp}}"
  }'::jsonb,
  whatsapp_config JSONB NOT NULL DEFAULT '{
    "api_key": "",
    "webhook_url": "",
    "business_id": "",
    "connected": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for alert configurations
CREATE POLICY "Allow all access to alert_configurations" 
ON public.alert_configurations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_alert_configurations_updated_at
BEFORE UPDATE ON public.alert_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.alert_configurations (user_id) VALUES ('default');