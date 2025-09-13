-- Create enum types for machine status
CREATE TYPE machine_status AS ENUM ('ativa', 'manutencao', 'parada', 'inativa');

-- Create machines table
CREATE TABLE public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status machine_status NOT NULL DEFAULT 'inativa',
  oee DECIMAL(5,2) DEFAULT 0,
  availability DECIMAL(5,2) DEFAULT 0,
  performance DECIMAL(5,2) DEFAULT 0,
  quality DECIMAL(5,2) DEFAULT 0,
  current_production INTEGER DEFAULT 0,
  target_production INTEGER DEFAULT 0,
  capacity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create production records table
CREATE TABLE public.production_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  good_production INTEGER DEFAULT 0,
  film_waste INTEGER DEFAULT 0,
  organic_waste DECIMAL(8,2) DEFAULT 0,
  planned_time INTEGER DEFAULT 0,
  downtime_minutes INTEGER DEFAULT 0,
  downtime_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create OEE history table
CREATE TABLE public.oee_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  oee DECIMAL(5,2) DEFAULT 0,
  availability DECIMAL(5,2) DEFAULT 0,
  performance DECIMAL(5,2) DEFAULT 0,
  quality DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create downtime events table
CREATE TABLE public.downtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  reason TEXT NOT NULL,
  category TEXT,
  minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downtime_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all access for now, can be restricted later with authentication)
CREATE POLICY "Allow all access to machines" ON public.machines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to production_records" ON public.production_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to oee_history" ON public.oee_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to downtime_events" ON public.downtime_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to alerts" ON public.alerts FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for machines table
CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON public.machines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data with proper UUIDs
INSERT INTO public.machines (name, code, status, oee, availability, performance, quality, current_production, target_production, capacity) VALUES
('Extrusora Alpha', 'EXT-001', 'ativa', 78.5, 92.3, 85.1, 99.8, 12500, 15000, 2500),
('Impressora Beta', 'IMP-002', 'ativa', 62.4, 78.2, 89.7, 89.1, 8900, 12000, 2000),
('Soldadora Gamma', 'SOL-003', 'manutencao', 0, 0, 0, 0, 0, 8000, 1600),
('Cortadora Delta', 'COR-004', 'ativa', 88.7, 95.2, 93.1, 100, 18200, 20000, 4000),
('Embaladera Epsilon', 'EMB-005', 'parada', 45.2, 65.8, 78.3, 87.8, 3200, 10000, 2500);

-- Create indexes for better performance
CREATE INDEX idx_machines_status ON public.machines(status);
CREATE INDEX idx_production_records_machine_id ON public.production_records(machine_id);
CREATE INDEX idx_oee_history_machine_id_timestamp ON public.oee_history(machine_id, timestamp);
CREATE INDEX idx_downtime_events_machine_id ON public.downtime_events(machine_id);
CREATE INDEX idx_alerts_machine_id_severity ON public.alerts(machine_id, severity);