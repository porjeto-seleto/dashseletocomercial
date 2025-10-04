// src/components/dashboard/TopSellersCard.tsx

import { Trophy, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { useSellers } from "@/hooks/useSellers";
import { DailyReport } from "@/hooks/useDailyReports";
import { cn } from "@/lib/utils";
import { formatCurrencyBR } from "@/lib/currency";

interface TopSellersCardProps {
  report: DailyReport;
}

const TopSellersCard = ({ report }: TopSellersCardProps) => {
  const { sellers } = useSellers();

  const topSellersData = report.rankings.filter(r => r.ranking_type === 'top_sellers');
  
  const sellersWithNames = topSellersData.map(ranking => {
    const seller = sellers.find(s => s.id === ranking.seller_id);
    return {
      position: ranking.position,
      name: seller?.name || 'Vendedor não encontrado',
      team: seller?.team?.name || 'Sem equipe',
      // ATUALIZADO: Puxando a meta real da equipe do vendedor
      goal: seller?.team?.monthly_goal || 0, 
      value: ranking.value_sold || 0,
      conversion: ranking.conversion_rate || 0,
      oc: ranking.oc_number || 'N/A'
    };
  });

  const displayData = Array(5).fill(null).map((_, index) => {
    return sellersWithNames.find(s => s.position === index + 1) || {
      position: index + 1, name: 'Sem dados', team: 'Sem equipe', goal: 0, value: 0, conversion: 0, oc: 'N/A'
    };
  });

  const getPositionIcon = (position: number) => {
    // ... (código inalterado)
    switch (position) {
      case 1:
        return <Trophy className="h-10 w-10 text-yellow-500" />;
      case 2:
        return <Award className="h-7 w-7 text-gray-400" />;
      case 3:
        return <Award className="h-7 w-7 text-yellow-700" />;
      default:
        return <span className="text-2xl font-bold text-muted-foreground">{position}</span>;
    }
  };

  const getGoalBadgeInfo = (valueSold: number, goal: number): { text: string; className: string } => {
    // ... (lógica do badge inalterada)
    if (goal <= 0) return { text: "Sem Meta", className: badgeVariants({ variant: "outline" }) };

    const percentage = (valueSold / goal) * 100;

    if (percentage >= 100) {
      return { text: "META BATIDA 🚀🚀", className: badgeVariants({ variant: "success" }) };
    }
    if (percentage >= 76) {
      return { text: `Meta ${percentage.toFixed(0)}%`, className: badgeVariants({ variant: "default" }) };
    }
    if (percentage >= 46) {
      return { text: `Meta ${percentage.toFixed(0)}%`, className: badgeVariants({ variant: "success" }) };
    }
    if (percentage >= 16) {
      return { text: `Meta ${percentage.toFixed(0)}%`, className: badgeVariants({ variant: "warning" }) };
    }
    return { text: `Meta ${percentage.toFixed(0)}%`, className: badgeVariants({ variant: "destructive" }) };
  };

  return (
    <Card className="h-full flex flex-col transition-all duration-300">
      <CardHeader className="text-center pb-2 pt-4">
        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          TOP 5 VENDEDORES
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-col justify-around p-5 space-y-12">
        {displayData.map((seller) => {
          // ATUALIZADO: `goalBadge` agora usa a meta real do vendedor
          const goalBadge = getGoalBadgeInfo(seller.value, seller.goal);
          
          return (
            <div 
              key={seller.position} 
              className="flex items-center gap-3 p-4 rounded-lg bg-muted/50"
            >
              <div className="flex-shrink-0 w-24 h-16 flex items-center justify-center rounded-lg bg-card border">
                {getPositionIcon(seller.position)}
              </div>

              <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="font-bold text-3xl truncate">{seller.name}</p>
                  <p className="font-bold text-3xl text-primary whitespace-nowrap pl-3">
                    {formatCurrencyBR(seller.value)}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-1">
                  <Badge variant="outline" className="text-xs text-primary border-primary">{seller.team}</Badge>
                  <Badge variant="outline">OC {seller.oc}</Badge>
                  <Badge variant="outline">Conversão {seller.conversion}%</Badge>
                  <div className={cn(goalBadge.className)}>{goalBadge.text}</div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TopSellersCard;