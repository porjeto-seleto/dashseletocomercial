import { Percent, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDailyReports } from "@/hooks/useDailyReports";
import { useSellers } from "@/hooks/useSellers";
import { useEffect } from "react";

interface ProfitMarginCardProps {
  currentDate?: Date;
}

const ProfitMarginCard = ({ currentDate = new Date() }: ProfitMarginCardProps) => {
  const { getReportByDate, getRankingsByType } = useDailyReports();
  const { sellers } = useSellers();
  
  useEffect(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    getReportByDate(dateStr);
  }, [currentDate]);

  const profitMarginData = getRankingsByType('profit_margin');
  
  const marginWithNames = profitMarginData.map(ranking => {
    const seller = sellers.find(s => s.id === ranking.seller_id);
    return {
      position: ranking.position,
      name: seller?.name || 'Vendedor não encontrado',
      margin: ranking.profit_margin
    };
  });

  // Fill empty positions if less than 5
  const displayData = Array(5).fill(null).map((_, index) => {
    const existing = marginWithNames.find(s => s.position === index + 1);
    return existing || {
      position: index + 1,
      name: 'Sem dados',
      margin: 0
    };
  });

  const getMarginColor = (margin: number) => {
    if (margin >= 20) return "text-success";
    if (margin >= 15) return "text-warning";
    return "text-destructive";
  };

  const getMarginBadgeVariant = (margin: number) => {
    if (margin >= 20) return "default";
    if (margin >= 15) return "secondary";
    return "destructive";
  };

  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
          <Percent className="h-5 w-5 text-warning" />
          MARGEM DE LUCRO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayData.map((seller) => (
          <div 
            key={seller.position}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning/20 text-warning font-bold text-sm">
              {seller.position}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs">{seller.name}</div>
            </div>
            
            <div className="text-right">
              <div className={`text-lg font-bold ${getMarginColor(seller.margin)} mb-1`}>
                {seller.margin}%
              </div>
              <Badge 
                variant={getMarginBadgeVariant(seller.margin)}
                className="text-xs flex items-center gap-1 px-1 py-0"
              >
                <TrendingUp className="h-3 w-3" />
                Margem
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProfitMarginCard;