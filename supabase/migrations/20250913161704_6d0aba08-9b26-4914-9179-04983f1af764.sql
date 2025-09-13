-- Corrigir problemas de segurança: adicionar SET search_path às funções

-- Recriar função para calcular OEE com search_path seguro
CREATE OR REPLACE FUNCTION calculate_oee_metrics(
  p_machine_id UUID,
  p_good_production INTEGER,
  p_planned_time INTEGER,
  p_downtime_minutes INTEGER,
  p_target_production INTEGER
) RETURNS TABLE (
  oee NUMERIC,
  availability NUMERIC,
  performance NUMERIC,
  quality NUMERIC
) AS $$
DECLARE
  v_availability NUMERIC;
  v_performance NUMERIC;
  v_quality NUMERIC;
  v_oee NUMERIC;
  v_actual_runtime INTEGER;
  v_total_production INTEGER;
BEGIN
  -- Calcular disponibilidade (Availability)
  v_actual_runtime := p_planned_time - p_downtime_minutes;
  v_availability := CASE 
    WHEN p_planned_time > 0 THEN (v_actual_runtime::NUMERIC / p_planned_time) * 100
    ELSE 0
  END;
  
  -- Assumir qualidade de 100% por enquanto (pode ser ajustado conforme necessidade)
  v_quality := 100.0;
  
  -- Calcular desempenho (Performance) baseado na produção boa vs target
  v_performance := CASE 
    WHEN p_target_production > 0 AND v_actual_runtime > 0 THEN 
      LEAST((p_good_production::NUMERIC / (p_target_production * (v_actual_runtime::NUMERIC / 60))) * 100, 100)
    ELSE 0
  END;
  
  -- Calcular OEE (Overall Equipment Effectiveness)
  v_oee := (v_availability * v_performance * v_quality) / 10000;
  
  -- Garantir que os valores não passem de 100%
  v_availability := LEAST(v_availability, 100);
  v_performance := LEAST(v_performance, 100);
  v_quality := LEAST(v_quality, 100);
  v_oee := LEAST(v_oee, 100);
  
  RETURN QUERY SELECT v_oee, v_availability, v_performance, v_quality;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recriar função para upsert com search_path seguro
CREATE OR REPLACE FUNCTION upsert_production_record(
  p_machine_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_good_production INTEGER,
  p_film_waste INTEGER,
  p_organic_waste NUMERIC,
  p_planned_time INTEGER,
  p_downtime_minutes INTEGER,
  p_downtime_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_record_id UUID;
  v_oee_metrics RECORD;
  v_machine_target INTEGER;
BEGIN
  -- Buscar target de produção da máquina
  SELECT target_production INTO v_machine_target 
  FROM machines 
  WHERE id = p_machine_id;
  
  -- Inserir ou atualizar production_record (upsert)
  INSERT INTO production_records (
    machine_id, start_time, end_time, good_production, 
    film_waste, organic_waste, planned_time, downtime_minutes, downtime_reason
  ) VALUES (
    p_machine_id, p_start_time, p_end_time, p_good_production,
    p_film_waste, p_organic_waste, p_planned_time, p_downtime_minutes, p_downtime_reason
  )
  ON CONFLICT (machine_id) 
  DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    good_production = EXCLUDED.good_production,
    film_waste = EXCLUDED.film_waste,
    organic_waste = EXCLUDED.organic_waste,
    planned_time = EXCLUDED.planned_time,
    downtime_minutes = EXCLUDED.downtime_minutes,
    downtime_reason = EXCLUDED.downtime_reason,
    created_at = now()
  RETURNING id INTO v_record_id;
  
  -- Calcular métricas OEE
  SELECT * INTO v_oee_metrics FROM calculate_oee_metrics(
    p_machine_id, p_good_production, p_planned_time, 
    p_downtime_minutes, COALESCE(v_machine_target, 1)
  );
  
  -- Inserir novo registro em oee_history
  INSERT INTO oee_history (
    machine_id, timestamp, oee, availability, performance, quality
  ) VALUES (
    p_machine_id, now(), v_oee_metrics.oee, v_oee_metrics.availability,
    v_oee_metrics.performance, v_oee_metrics.quality
  );
  
  -- Atualizar métricas na tabela machines
  UPDATE machines SET
    oee = v_oee_metrics.oee,
    availability = v_oee_metrics.availability,
    performance = v_oee_metrics.performance,
    quality = v_oee_metrics.quality,
    current_production = p_good_production,
    updated_at = now()
  WHERE id = p_machine_id;
  
  RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recriar função de delete com search_path seguro
CREATE OR REPLACE FUNCTION delete_machine_and_related_data(p_machine_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Deletar todos os registros relacionados (será feito automaticamente pelas foreign keys com CASCADE)
  DELETE FROM machines WHERE id = p_machine_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;