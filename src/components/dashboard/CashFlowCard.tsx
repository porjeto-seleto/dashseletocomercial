import { DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDailyReports } from "@/hooks/useDailyReports";
import { useSellers } from "@/hooks/useSellers";
import { useEffect } from "react";
import { formatCurrencyBR } from "@/lib/currency";

interface CashFlowCardProps {
  currentDate?: Date;
}

const CashFlowCard = ({ currentDate = new Date() }: CashFlowCardProps) => {
  const { getReportByDate, getRankingsByType } = useDailyReports();
  const { sellers } = useSellers();
  
  useEffect(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    getReportByDate(dateStr);
  }, [currentDate]);

  const cashFlowData = getRankingsByType('cash_flow');
  
  const cashFlowWithNames = cashFlowData.map(ranking => {
    const seller = sellers.find(s => s.id === ranking.seller_id);
    // Get the value_sold from top_sellers ranking for the same seller
    const topSellersData = getRankingsByType('top_sellers');
    const topSellerData = topSellersData.find(ts => ts.seller_id === ranking.seller_id);
    const valueSold = topSellerData?.value_sold || ranking.value_sold || 0;
    const effectiveness = valueSold > 0 ? Math.round((ranking.value_received / valueSold) * 100) : 0;
    
    return {
      position: ranking.position,
      name: seller?.name || 'Vendedor não encontrado',
      sold: valueSold,
      received: ranking.value_received,
      effectiveness
    };
  });

  // Fill empty positions if less than 5
  const displayData = Array(5).fill(null).map((_, index) => {
    const existing = cashFlowWithNames.find(s => s.position === index + 1);
    return existing || {
      position: index + 1,
      name: 'Sem dados',
      sold: 0,
      received: 0,
      effectiveness: 0
    };
  });

  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
          <DollarSign className="h-5 w-5 text-success" />
          FLUXO DE CAIXA TOP 5
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayData.map((seller) => (
          <div 
            key={seller.position}
            className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="grid grid-cols-4 gap-2 items-start">
              {/* Colocação */}
              <div className="flex justify-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/20 text-success font-bold text-sm">
                  {seller.position}
                </div>
              </div>
              
              {/* Vendedor */}
              <div className="min-w-0">
                <div className="font-semibold text-xs">{seller.name}</div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success border border-success/30">
                    {seller.effectiveness}%
                  </span>
                </div>
              </div>
              
              {/* Vendido */}
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Vendido</div>
                <div className="font-bold text-xs">{formatCurrencyBR(seller.sold)}</div>
              </div>
              
              {/* Recebido */}
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Recebido</div>
                <div className="font-bold text-xs text-success">{formatCurrencyBR(seller.received)}</div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CashFlowCard;