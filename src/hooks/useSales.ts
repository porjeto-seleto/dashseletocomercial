import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { formatCurrencyBR } from '@/lib/currency';

export interface Sale {
  id: string;
  seller_id: string;
  customer_name: string;
  product_description: string;
  sale_value: number;
  commission_percentage: number;
  commission_value: number;
  sale_date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  seller?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SaleInput {
  seller_id: string;
  customer_name: string;
  product_description: string;
  sale_value: number;
  commission_percentage: number;
  sale_date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
}

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          seller:sellers(
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sales:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar vendas',
          description: 'Não foi possível carregar as vendas. Tente novamente.',
        });
        return;
      }

      setSales((data || []) as Sale[]);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar vendas',
        description: 'Não foi possível carregar as vendas. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const createSale = async (saleData: SaleInput) => {
    try {
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Erro de autenticação',
          description: 'Você precisa estar logado para realizar esta ação.',
        });
        return null;
      }

      const { data, error } = await supabase
        .from('sales')
        .insert([{
          ...saleData,
          created_by: user.id
        }])
        .select(`
          *,
          seller:sellers(
            id,
            name,
            email
          )
        `)
        .single();

      if (error) {
        console.error('Error creating sale:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao criar venda',
          description: 'Não foi possível criar a venda. Verifique os dados e tente novamente.',
        });
        return null;
      }

      toast({
        title: 'Venda criada com sucesso!',
        description: `Venda de ${formatCurrencyBR(saleData.sale_value)} foi registrada.`,
      });

      await fetchSales();
      return data as Sale;
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar venda',
        description: 'Não foi possível criar a venda. Tente novamente.',
      });
      return null;
    }
  };

  const updateSale = async (id: string, updates: Partial<SaleInput>) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          seller:sellers(
            id,
            name,
            email
          )
        `)
        .single();

      if (error) {
        console.error('Error updating sale:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao atualizar venda',
          description: 'Não foi possível atualizar a venda. Tente novamente.',
        });
        return null;
      }

      toast({
        title: 'Venda atualizada com sucesso!',
        description: 'Os dados da venda foram atualizados.',
      });

      await fetchSales();
      return data as Sale;
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar venda',
        description: 'Não foi possível atualizar a venda. Tente novamente.',
      });
      return null;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting sale:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao excluir venda',
          description: 'Não foi possível excluir a venda. Tente novamente.',
        });
        return false;
      }

      toast({
        title: 'Venda excluída com sucesso!',
        description: 'A venda foi removida do sistema.',
      });

      await fetchSales();
      return true;
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir venda',
        description: 'Não foi possível excluir a venda. Tente novamente.',
      });
      return false;
    }
  };

  const getSalesByDate = (date: string) => {
    return sales.filter(sale => sale.sale_date === date);
  };

  const getSalesByDateRange = (startDate: string, endDate: string) => {
    return sales.filter(sale => 
      sale.sale_date >= startDate && sale.sale_date <= endDate
    );
  };

  const getTotalSalesByDate = (date: string) => {
    return getSalesByDate(date).reduce((total, sale) => {
      return sale.status === 'confirmed' ? total + Number(sale.sale_value) : total;
    }, 0);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return {
    sales,
    loading,
    fetchSales,
    createSale,
    updateSale,
    deleteSale,
    getSalesByDate,
    getSalesByDateRange,
    getTotalSalesByDate
  };
};