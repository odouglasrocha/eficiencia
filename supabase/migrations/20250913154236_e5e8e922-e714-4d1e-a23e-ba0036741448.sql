-- Criar tabela para motivos de parada
CREATE TABLE public.downtime_reasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.downtime_reasons ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
CREATE POLICY "Allow read access to downtime reasons" 
ON public.downtime_reasons 
FOR SELECT 
USING (true);

-- Insert default downtime reasons
INSERT INTO public.downtime_reasons (name, category, description) VALUES
('Troca de Material', 'setup', 'Tempo para troca de material de produção'),
('Limpeza de Máquina', 'maintenance', 'Limpeza programada da máquina'),
('Manutenção Preventiva', 'maintenance', 'Manutenção preventiva programada'),
('Manutenção Corretiva', 'maintenance', 'Reparo de equipamento quebrado'),
('Falta de Material', 'material', 'Ausência de matéria-prima'),
('Falta de Energia', 'utilities', 'Interrupção no fornecimento de energia'),
('Problema de Qualidade', 'quality', 'Parada por problema de qualidade do produto'),
('Ajuste de Processo', 'process', 'Ajustes no processo de produção'),
('Treinamento', 'human', 'Treinamento de operadores'),
('Intervalo/Refeição', 'break', 'Parada para intervalo ou refeição'),
('Reunião', 'administrative', 'Parada para reunião'),
('Outros', 'general', 'Outros motivos não especificados');

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_downtime_reasons_updated_at
BEFORE UPDATE ON public.downtime_reasons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();