import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export interface Seller {
  id: string;
  name: string;
  email: string;
  status: string;
  team_id?: string;
  created_at: string;
  updated_at: string;
  team?: {
    id: string;
    name: string;
    monthly_goal?: number;
  };
}

export const useSellers = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sellers')
        .select(`
          *,
          team:teams(
            id,
            name,
            monthly_goal
          )
        `)
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching sellers:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar vendedores',
          description: 'Não foi possível carregar a lista de vendedores.',
        });
        return;
      }

      setSellers(data || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar vendedores',
        description: 'Não foi possível carregar a lista de vendedores.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  return {
    sellers,
    loading,
    fetchSellers
  };
};