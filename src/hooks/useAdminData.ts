import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  team_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  teams?: Team;
}

export interface GlobalGoal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  period: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  description: string;
  created_at: string;
}

export interface Configuration {
  id: string;
  dashboard_title: string;
  company_logo: string | null;
  created_at: string;
  updated_at: string;
}

export const useAdminData = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [goals, setGoals] = useState<GlobalGoal[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [config, setConfig] = useState<Configuration | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    try {
      const [teamsRes, sellersRes, goalsRes, logsRes, configRes] = await Promise.all([
        supabase.from('teams').select('*').order('created_at', { ascending: false }),
        supabase.from('sellers').select('*, teams(*)').order('created_at', { ascending: false }),
        supabase.from('global_goals').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('configurations').select('*').limit(1).single()
      ]);

      if (teamsRes.error) throw teamsRes.error;
      if (sellersRes.error) throw sellersRes.error;
      if (goalsRes.error) throw goalsRes.error;
      if (logsRes.error) throw logsRes.error;

      setTeams(teamsRes.data || []);
      setSellers((sellersRes.data || []) as Seller[]);
      setGoals((goalsRes.data || []) as GlobalGoal[]);
      setLogs(logsRes.data || []);
      setConfig(configRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar dados', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Teams CRUD
  const createTeam = async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({ name, description })
        .select()
        .single();

      if (error) throw error;

      setTeams(prev => [data, ...prev]);
      await createAuditLog('Equipe criada', `Equipe "${name}" foi criada`);
      toast({ title: 'Sucesso', description: 'Equipe criada com sucesso' });
      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      toast({ title: 'Erro', description: 'Falha ao criar equipe', variant: 'destructive' });
    }
  };

  const updateTeam = async (id: string, updates: Partial<Omit<Team, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTeams(prev => prev.map(team => team.id === id ? data : team));
      await createAuditLog('Equipe atualizada', `Equipe "${data.name}" foi atualizada`);
      toast({ title: 'Sucesso', description: 'Equipe atualizada com sucesso' });
    } catch (error) {
      console.error('Error updating team:', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar equipe', variant: 'destructive' });
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      const team = teams.find(t => t.id === id);
      const { error } = await supabase.from('teams').delete().eq('id', id);

      if (error) throw error;

      setTeams(prev => prev.filter(team => team.id !== id));
      await createAuditLog('Equipe excluída', `Equipe "${team?.name}" foi excluída`);
      toast({ title: 'Sucesso', description: 'Equipe excluída com sucesso' });
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({ title: 'Erro', description: 'Falha ao excluir equipe', variant: 'destructive' });
    }
  };

  // Sellers CRUD
  const createSeller = async (name: string, email: string, teamId?: string) => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .insert({ name, email, team_id: teamId })
        .select('*, teams(*)')
        .single();

      if (error) throw error;

      setSellers(prev => [data as Seller, ...prev]);
      await createAuditLog('Vendedor criado', `Vendedor "${name}" foi criado`);
      toast({ title: 'Sucesso', description: 'Vendedor criado com sucesso' });
      return data;
    } catch (error) {
      console.error('Error creating seller:', error);
      toast({ title: 'Erro', description: 'Falha ao criar vendedor', variant: 'destructive' });
    }
  };

  const updateSeller = async (id: string, updates: Partial<Omit<Seller, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .update(updates)
        .eq('id', id)
        .select('*, teams(*)')
        .single();

      if (error) throw error;

      setSellers(prev => prev.map(seller => seller.id === id ? data as Seller : seller));
      await createAuditLog('Vendedor atualizado', `Vendedor "${data.name}" foi atualizado`);
      toast({ title: 'Sucesso', description: 'Vendedor atualizado com sucesso' });
    } catch (error) {
      console.error('Error updating seller:', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar vendedor', variant: 'destructive' });
    }
  };

  const deleteSeller = async (id: string) => {
    try {
      const seller = sellers.find(s => s.id === id);
      const { error } = await supabase.from('sellers').delete().eq('id', id);

      if (error) throw error;

      setSellers(prev => prev.filter(seller => seller.id !== id));
      await createAuditLog('Vendedor excluído', `Vendedor "${seller?.name}" foi excluído`);
      toast({ title: 'Sucesso', description: 'Vendedor excluído com sucesso' });
    } catch (error) {
      console.error('Error deleting seller:', error);
      toast({ title: 'Erro', description: 'Falha ao excluir vendedor', variant: 'destructive' });
    }
  };

  // Goals CRUD
  const createGoal = async (title: string, targetValue: number, period: string) => {
    try {
      const { data, error } = await supabase
        .from('global_goals')
        .insert({ title, target_value: targetValue, period })
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [data as GlobalGoal, ...prev]);
      await createAuditLog('Meta criada', `Meta "${title}" foi criada`);
      toast({ title: 'Sucesso', description: 'Meta criada com sucesso' });
      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({ title: 'Erro', description: 'Falha ao criar meta', variant: 'destructive' });
    }
  };

  const updateGoal = async (id: string, updates: Partial<Omit<GlobalGoal, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('global_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => prev.map(goal => goal.id === id ? data as GlobalGoal : goal));
      await createAuditLog('Meta atualizada', `Meta "${data.title}" foi atualizada`);
      toast({ title: 'Sucesso', description: 'Meta atualizada com sucesso' });
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar meta', variant: 'destructive' });
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const goal = goals.find(g => g.id === id);
      const { error } = await supabase.from('global_goals').delete().eq('id', id);

      if (error) throw error;

      setGoals(prev => prev.filter(goal => goal.id !== id));
      await createAuditLog('Meta excluída', `Meta "${goal?.title}" foi excluída`);
      toast({ title: 'Sucesso', description: 'Meta excluída com sucesso' });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({ title: 'Erro', description: 'Falha ao excluir meta', variant: 'destructive' });
    }
  };

  // Configuration
  const updateConfig = async (updates: Partial<Omit<Configuration, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      if (!config) return;

      const { data, error } = await supabase
        .from('configurations')
        .update(updates)
        .eq('id', config.id)
        .select()
        .single();

      if (error) throw error;

      setConfig(data);
      await createAuditLog('Configuração atualizada', 'Configurações do sistema foram atualizadas');
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso' });
    } catch (error) {
      console.error('Error updating config:', error);
      toast({ title: 'Erro', description: 'Falha ao salvar configurações', variant: 'destructive' });
    }
  };

  // Audit log helper
  const createAuditLog = async (action: string, description: string) => {
    try {
      // Get current user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'system@unknown';
      
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_email: userEmail,
          action,
          description
        })
        .select()
        .single();

      if (error) throw error;

      setLogs(prev => [data, ...prev.slice(0, 49)]); // Keep only last 50 logs
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    // Data
    teams,
    sellers,
    goals,
    logs,
    config,
    loading,

    // Actions
    createTeam,
    updateTeam,
    deleteTeam,
    createSeller,
    updateSeller,
    deleteSeller,
    createGoal,
    updateGoal,
    deleteGoal,
    updateConfig,
    refetch: fetchData
  };
};