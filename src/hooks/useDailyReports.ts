import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface DailyRanking {
  id: string;
  report_id: string;
  ranking_type: 'top_sellers' | 'cash_flow' | 'profit_margin';
  position: number;
  seller_id: string;
  oc_number?: string;
  value_sold: number;
  conversion_rate: number;
  value_received: number;
  profit_margin: number;
  seller?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DailyReport {
  id: string;
  report_date: string;
  total_sold: number;
  total_effective: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  rankings: DailyRanking[];
}

export interface RankingFormData {
  seller_id: string;
  oc_number?: string;
  value_sold: number;
  conversion_rate: number;
  value_received: number;
  profit_margin: number;
}

export const useDailyReports = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [currentReport, setCurrentReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data: reportsData, error: reportsError } = await supabase
        .from('daily_reports')
        .select('*')
        .order('report_date', { ascending: false });

      if (reportsError) {
        console.error('Error fetching reports:', reportsError);
        return;
      }

      const { data: rankingsData, error: rankingsError } = await supabase
        .from('daily_rankings')
        .select(`
          *,
          seller:sellers(
            id,
            name,
            email
          )
        `)
        .order('position');

      if (rankingsError) {
        console.error('Error fetching rankings:', rankingsError);
        return;
      }

      // Combine reports with their rankings
      const reportsWithRankings = (reportsData || []).map(report => ({
        ...report,
        rankings: (rankingsData || []).filter(ranking => ranking.report_id === report.id).map(ranking => ({
          ...ranking,
          ranking_type: ranking.ranking_type as 'top_sellers' | 'cash_flow' | 'profit_margin'
        }))
      }));

      setReports(reportsWithRankings as DailyReport[]);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar relatórios',
        description: 'Não foi possível carregar os relatórios.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getReportByDate = async (date: string) => {
    try {
      const { data: reportData, error: reportError } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('report_date', date)
        .maybeSingle();

      if (reportError) {
        console.error('Error fetching report:', reportError);
        return null;
      }

      if (!reportData) {
        // Try to get the most recent report to maintain persistence
        const { data: latestReport, error: latestError } = await supabase
          .from('daily_reports')
          .select('*')
          .order('report_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestError || !latestReport) {
          setCurrentReport(null);
          return null;
        }

        // Use the latest report data but keep the requested date
        const persistedReport = {
          ...latestReport,
          report_date: date,
          id: `persisted-${date}`
        };

        const { data: rankingsData, error: rankingsError } = await supabase
          .from('daily_rankings')
          .select(`
            *,
            seller:sellers(
              id,
              name,
              email
            )
          `)
          .eq('report_id', latestReport.id)
          .order('position');

        if (rankingsError) {
          console.error('Error fetching persisted rankings:', rankingsError);
          return null;
        }

        const reportWithRankings = {
          ...persistedReport,
          rankings: (rankingsData || []).map(ranking => ({
            ...ranking,
            id: `persisted-${ranking.id}`,
            report_id: persistedReport.id,
            ranking_type: ranking.ranking_type as 'top_sellers' | 'cash_flow' | 'profit_margin'
          }))
        };

        setCurrentReport(reportWithRankings as DailyReport);
        return reportWithRankings;
      }

      const { data: rankingsData, error: rankingsError } = await supabase
        .from('daily_rankings')
        .select(`
          *,
          seller:sellers(
            id,
            name,
            email
          )
        `)
        .eq('report_id', reportData.id)
        .order('position');

      if (rankingsError) {
        console.error('Error fetching rankings:', rankingsError);
        return null;
      }

      const reportWithRankings = {
        ...reportData,
        rankings: (rankingsData || []).map(ranking => ({
          ...ranking,
          ranking_type: ranking.ranking_type as 'top_sellers' | 'cash_flow' | 'profit_margin'
        }))
      };

      setCurrentReport(reportWithRankings as DailyReport);
      return reportWithRankings;
    } catch (error) {
      console.error('Error fetching report by date:', error);
      return null;
    }
  };

  const saveReport = async (
    date: string,
    totalSold: number,
    totalEffective: number,
    topSellers: RankingFormData[],
    cashFlow: RankingFormData[],
    profitMargin: RankingFormData[]
  ) => {
    try {
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Erro de autenticação',
          description: 'Você precisa estar logado para salvar relatórios.',
        });
        return false;
      }

      // First, check if report exists for this date
      const { data: existingReport } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('report_date', date)
        .single();

      let reportId: string;

      if (existingReport) {
        // Update existing report
        const { data: updatedReport, error: updateError } = await supabase
          .from('daily_reports')
          .update({ 
            total_sold: totalSold,
            total_effective: totalEffective 
          })
          .eq('id', existingReport.id)
          .select('id')
          .single();

        if (updateError) {
          console.error('Error updating report:', updateError);
          toast({
            variant: 'destructive',
            title: 'Erro ao atualizar relatório',
            description: 'Não foi possível atualizar o relatório.',
          });
          return false;
        }

        reportId = updatedReport.id;

        // Delete existing rankings
        await supabase
          .from('daily_rankings')
          .delete()
          .eq('report_id', reportId);
      } else {
        // Create new report
        const { data: newReport, error: createError } = await supabase
          .from('daily_reports')
          .insert({
            report_date: date,
            total_sold: totalSold,
            total_effective: totalEffective,
            created_by: user.id
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating report:', createError);
          toast({
            variant: 'destructive',
            title: 'Erro ao criar relatório',
            description: 'Não foi possível criar o relatório.',
          });
          return false;
        }

        reportId = newReport.id;
      }

      // Insert new rankings
      const allRankings = [
        ...topSellers.map((data, index) => ({
          report_id: reportId,
          ranking_type: 'top_sellers' as const,
          position: index + 1,
          ...data
        })),
        ...cashFlow.map((data, index) => ({
          report_id: reportId,
          ranking_type: 'cash_flow' as const,
          position: index + 1,
          ...data
        })),
        ...profitMargin.map((data, index) => ({
          report_id: reportId,
          ranking_type: 'profit_margin' as const,
          position: index + 1,
          ...data
        }))
      ].filter(ranking => ranking.seller_id); // Only save rankings with selected sellers

      if (allRankings.length > 0) {
        const { error: rankingsError } = await supabase
          .from('daily_rankings')
          .insert(allRankings);

        if (rankingsError) {
          console.error('Error saving rankings:', rankingsError);
          toast({
            variant: 'destructive',
            title: 'Erro ao salvar rankings',
            description: 'Não foi possível salvar os rankings.',
          });
          return false;
        }
      }

      toast({
        title: 'Relatório salvo com sucesso!',
        description: `Relatório do dia ${new Date(date).toLocaleDateString('pt-BR')} foi salvo.`,
      });

      await fetchReports();
      await getReportByDate(date);
      return true;
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar relatório',
        description: 'Não foi possível salvar o relatório.',
      });
      return false;
    }
  };

  const getRankingsByType = (type: 'top_sellers' | 'cash_flow' | 'profit_margin') => {
    if (!currentReport) return [];
    return currentReport.rankings
      .filter(ranking => ranking.ranking_type === type)
      .sort((a, b) => a.position - b.position);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    currentReport,
    loading,
    fetchReports,
    getReportByDate,
    saveReport,
    getRankingsByType
  };
};