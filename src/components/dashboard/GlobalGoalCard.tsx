import { Target, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrencyBR } from "@/lib/currency";
import confetti from "canvas-confetti";

interface GlobalGoalCardProps {
  currentDate: Date;
}

const GlobalGoalCard = ({ currentDate }: GlobalGoalCardProps) => {
  const [currentGoal, setCurrentGoal] = useState<{
    id: string;
    title: string;
    target_value: number;
    total_sold: number;
    total_effective: number;
    period: string;
  } | null>(null);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  useEffect(() => {
    const fetchCurrentGoal = async () => {
      try {
        const referenceMonth = format(currentDate, "yyyy-MM");

        const { data: goalData, error: goalError } = await supabase
          .from("global_goals")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (goalError) {
          console.error("Erro ao buscar meta global:", goalError);
          return;
        }

        const findActiveGoalForDate = (goals: any[], targetDate: Date) => {
          for (const goal of goals) {
            const [periodType, dateRange] = goal.period.split(":");
            if (!dateRange) continue;

            const [startDateStr, endDateStr] = dateRange.split("-");
            if (!startDateStr || !endDateStr) continue;

            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);

            if (targetDate >= startDate && targetDate <= endDate) {
              return goal;
            }
          }
          return null;
        };

        let activeGoal = findActiveGoalForDate(goalData || [], currentDate);

        if (!activeGoal && goalData && goalData.length > 0) {
          activeGoal = goalData[0];
        }

        if (activeGoal) {
          const reportDateStr = format(currentDate, "yyyy-MM-dd");

          // ✅ Garantir que total_sold e total_effective sejam buscados e convertidos
          const { data: dayReport, error: reportsError } = await supabase
            .from("daily_reports")
            .select("total_sold, total_effective")
            .eq("report_date", reportDateStr)
            .maybeSingle();

          if (reportsError) {
            console.error("Erro ao buscar relatório do dia:", reportsError);
          }

          // Conversão e fallback seguro
          let totalSold = parseFloat(dayReport?.total_sold || "0");
          let totalEffective = parseFloat(dayReport?.total_effective || "0")

          // Se não encontrar o dia, busca o último relatório
          if (!dayReport) {
            const { data: latestReport } = await supabase
              .from("daily_reports")
              .select("total_sold, total_effective")
              .order("report_date", { ascending: false })
              .limit(1)
              .maybeSingle();

            totalSold = parseFloat(latestReport?.total_sold ?? "0") || 0;
            totalEffective = parseFloat(latestReport?.total_effective ?? "0") || 0;
          }

          setCurrentGoal({
            ...activeGoal,
            total_sold: totalSold,
            total_effective: totalEffective,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar meta global:", error);
      }
    };

    fetchCurrentGoal();
    setHasTriggeredConfetti(false);
  }, [currentDate]);

  // Confete ao atingir 100%
  useEffect(() => {
    if (currentGoal && !hasTriggeredConfetti) {
      const progressPercent =
        currentGoal.target_value > 0
          ? (currentGoal.total_effective / currentGoal.target_value) * 100
          : 0;

      if (progressPercent >= 100) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setHasTriggeredConfetti(true);
      }
    }
  }, [currentGoal, hasTriggeredConfetti]);

  if (!currentGoal) {
    return (
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
            <Target className="h-5 w-5 text-secondary" />
            META GLOBAL
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-muted-foreground">
            Nenhuma meta definida para o mês atual
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent =
    currentGoal.target_value > 0
      ? (currentGoal.total_effective / currentGoal.target_value) * 100
      : 0;
  const visualProgressPercent = Math.min(progressPercent, 100);
  const isGoalReached = progressPercent >= 100;

  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
          <Target className="h-5 w-5 text-secondary" />
          META GLOBAL
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        <div>
          <div className="text-lg font-medium text-muted-foreground mb-2">
            {currentGoal.title}
          </div>
          <div className="text-3xl font-bold text-black mb-4">
            {formatCurrencyBR(currentGoal.target_value)}
          </div>
        </div>

        <div className="space-y-4">
          {/* Valor Vendido e Valor Efetivado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Valor Vendido
                </span>
              </div>
              <div className="text-lg font-bold text-primary">
                {formatCurrencyBR(currentGoal.total_sold)}
              </div>
            </div>
            <div className="bg-primary/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">💰</span>
                <span className="text-xs font-medium text-muted-foreground">
                  Valor Efetivado
                </span>
              </div>
              <div className="text-lg font-bold text-success">
                {formatCurrencyBR(currentGoal.total_effective)}
              </div>
            </div>
          </div>

          <div className="relative">
            <Progress value={visualProgressPercent} className="w-full h-10 bg-secondary/30" />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="text-sm font-bold text-black drop-shadow-lg">
                {progressPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {isGoalReached ? (
            <div className="text-lg font-bold text-success animate-pulse">
              🎉 Meta Batida!
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Faltam{" "}
              {formatCurrencyBR(
                currentGoal.target_value - currentGoal.total_effective
              )}{" "}
              para a meta
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalGoalCard;
