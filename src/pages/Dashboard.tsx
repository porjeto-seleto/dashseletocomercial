import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Trophy, Target, TrendingUp, BarChart3, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import TopSellersCard from "@/components/dashboard/TopSellersCard";
import GlobalGoalCard from "@/components/dashboard/GlobalGoalCard";
import CashFlowCard from "@/components/dashboard/CashFlowCard";
import PredictedVsActualCard from "@/components/dashboard/PredictedVsActualCard";
import ProfitMarginCard from "@/components/dashboard/ProfitMarginCard";
import { useDailyReports } from "@/hooks/useDailyReports";

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const { currentReport, getReportByDate } = useDailyReports();

  useEffect(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    getReportByDate(dateStr);
  }, [currentDate, getReportByDate]);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    const dateStr = currentDate.toISOString().split('T')[0];
    getReportByDate(dateStr).finally(() => {
      setIsLoading(false);
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader 
        currentDate={currentDate} 
        onNavigateDate={navigateDate}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />
      
      {/* Main Dashboard Grid */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-full max-w-[1920px] mx-auto">
          {/* Column 1 - Top 5 Vendedores */}
          {currentReport && <TopSellersCard report={currentReport} />}
          
          {/* Column 2 - Meta Global and Fluxo de Caixa */}
          <div className="grid gap-4 h-full" style={{ gridTemplateRows: '0.6fr 1fr' }}>
            <GlobalGoalCard currentDate={currentDate} />
            <CashFlowCard currentDate={currentDate} />
          </div>
          
          {/* Column 3 - Dash Previsto and Margem de Lucro */}
          <div className="grid gap-4 h-full" style={{ gridTemplateRows: '0.6fr 1fr' }}>
            <PredictedVsActualCard currentDate={currentDate} />
            <ProfitMarginCard currentDate={currentDate} />
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  );
};

export default Dashboard;