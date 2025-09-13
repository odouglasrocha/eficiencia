import { useState, useEffect } from 'react';
import mockMongoService from '@/services/mockMongoService';

interface DowntimeReason {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  active: boolean;
}

export function useDowntimeReasons() {
  const [reasons, setReasons] = useState<DowntimeReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReasons = async () => {
    try {
      setLoading(true);
      const data = await mockMongoService.getDowntimeReasons();
      
      // Converter _id para id para compatibilidade
      const formattedReasons = data.map((reason: any) => ({
        id: reason._id.toString(),
        name: reason.name,
        category: reason.category,
        description: reason.description,
        active: reason.active
      }));
      
      setReasons(formattedReasons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar motivos de parada');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReasons();
  }, []);

  return { reasons, loading, error, refetch: fetchReasons };
}