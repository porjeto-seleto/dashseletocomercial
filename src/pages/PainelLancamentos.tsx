import { useState, useEffect } from "react";
import { Calendar, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useDailyReports, RankingFormData } from "@/hooks/useDailyReports";
import { useSellers } from "@/hooks/useSellers";
import { useAuth } from "@/hooks/useAuth";
import { parseCurrencyBR } from "@/lib/currency";

const PainelLancamentos = () => {
  const { user, loading: authLoading } = useAuth();
  const { sellers, loading: sellersLoading } = useSellers();
  const { currentReport, loading: reportLoading, getReportByDate, saveReport, getRankingsByType } = useDailyReports();
  
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalSold, setTotalSold] = useState('');
  const [totalEffective, setTotalEffective] = useState('');
  
  // Form data for the three columns
  const [topSellers, setTopSellers] = useState<RankingFormData[]>(
    Array(5).fill({
      seller_id: '',
      oc_number: '',
      value_sold: 0,
      conversion_rate: 0,
      value_received: 0,
      profit_margin: 0
    })
  );
  
  const [cashFlow, setCashFlow] = useState<RankingFormData[]>(
    Array(5).fill({
      seller_id: '',
      oc_number: '',
      value_sold: 0,
      conversion_rate: 0,
      value_received: 0,
      profit_margin: 0
    })
  );
  
  const [profitMargin, setProfitMargin] = useState<RankingFormData[]>(
    Array(5).fill({
      seller_id: '',
      oc_number: '',
      value_sold: 0,
      conversion_rate: 0,
      value_received: 0,
      profit_margin: 0
    })
  );

  // Load report when date changes
  useEffect(() => {
    getReportByDate(reportDate);
  }, [reportDate]);

  // Update form when currentReport changes
  useEffect(() => {
    if (currentReport) {
      setTotalSold(currentReport.total_sold?.toString() || '0');
      setTotalEffective(currentReport.total_effective.toString());
      
      // Load top sellers
      const topSellersData = getRankingsByType('top_sellers');
      const newTopSellers = Array(5).fill(null).map((_, index) => {
        const ranking = topSellersData.find(r => r.position === index + 1);
        return ranking ? {
          seller_id: ranking.seller_id,
          oc_number: ranking.oc_number || '',
          value_sold: ranking.value_sold,
          conversion_rate: ranking.conversion_rate,
          value_received: 0,
          profit_margin: 0
        } : {
          seller_id: '',
          oc_number: '',
          value_sold: 0,
          conversion_rate: 0,
          value_received: 0,
          profit_margin: 0
        };
      });
      setTopSellers(newTopSellers);
      
      // Load cash flow
      const cashFlowData = getRankingsByType('cash_flow');
      const newCashFlow = Array(5).fill(null).map((_, index) => {
        const ranking = cashFlowData.find(r => r.position === index + 1);
        // Get the corresponding value_sold from top_sellers for the same seller
        const topSellerData = topSellersData.find(ts => ts.seller_id === ranking?.seller_id);
        return ranking ? {
          seller_id: ranking.seller_id,
          oc_number: '',
          value_sold: topSellerData?.value_sold || 0,
          conversion_rate: 0,
          value_received: ranking.value_received,
          profit_margin: 0
        } : {
          seller_id: '',
          oc_number: '',
          value_sold: 0,
          conversion_rate: 0,
          value_received: 0,
          profit_margin: 0
        };
      });
      setCashFlow(newCashFlow);
      
      // Load profit margin
      const profitMarginData = getRankingsByType('profit_margin');
      const newProfitMargin = Array(5).fill(null).map((_, index) => {
        const ranking = profitMarginData.find(r => r.position === index + 1);
        return ranking ? {
          seller_id: ranking.seller_id,
          oc_number: '',
          value_sold: 0,
          conversion_rate: 0,
          value_received: 0,
          profit_margin: ranking.profit_margin
        } : {
          seller_id: '',
          oc_number: '',
          value_sold: 0,
          conversion_rate: 0,
          value_received: 0,
          profit_margin: 0
        };
      });
      setProfitMargin(newProfitMargin);
    }
  }, [currentReport]);

  const handleSaveReport = async () => {
    const totalSoldValue = parseCurrencyBR(totalSold);
    const totalEffectiveValue = parseCurrencyBR(totalEffective);
    const success = await saveReport(reportDate, totalSoldValue, totalEffectiveValue, topSellers, cashFlow, profitMargin);
  };

  const handlePullLastRecord = async () => {
    // Find the most recent report
    const today = new Date();
    let searchDate = new Date(today);
    searchDate.setDate(searchDate.getDate() - 1);
    
    // Try to find a report from the last 30 days
    for (let i = 0; i < 30; i++) {
      const dateStr = searchDate.toISOString().split('T')[0];
      const report = await getReportByDate(dateStr);
      if (report) {
        setTotalSold(report.total_sold?.toString() || '0');
        setTotalEffective(report.total_effective.toString());
        break;
      }
      searchDate.setDate(searchDate.getDate() - 1);
    }
  };

  const updateTopSeller = (index: number, field: keyof RankingFormData, value: string | number) => {
    const newTopSellers = [...topSellers];
    newTopSellers[index] = { ...newTopSellers[index], [field]: value };
    setTopSellers(newTopSellers);
  };

  const updateCashFlow = (index: number, field: keyof RankingFormData, value: string | number) => {
    const newCashFlow = [...cashFlow];
    newCashFlow[index] = { ...newCashFlow[index], [field]: value };
    setCashFlow(newCashFlow);
  };

  const updateProfitMargin = (index: number, field: keyof RankingFormData, value: string | number) => {
    const newProfitMargin = [...profitMargin];
    newProfitMargin[index] = { ...newProfitMargin[index], [field]: value };
    setProfitMargin(newProfitMargin);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-lg">Carregando...</div>
    </div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-lg text-muted-foreground">Você precisa estar logado para acessar esta página.</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Painel de Lançamentos</h1>
          <p className="text-muted-foreground">Insira os dados diários de vendas</p>
        </div>

        {/* Header Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Configurações do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="reportDate">Data do Relatório</Label>
                <Input
                  id="reportDate"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="totalSold">Total Vendido (R$)</Label>
                <CurrencyInput
                  id="totalSold"
                  value={totalSold}
                  onChange={(value) => setTotalSold(value.toString())}
                />
              </div>
              <div>
                <Label htmlFor="totalEffective">Total Efetivado (R$)</Label>
                <CurrencyInput
                  id="totalEffective"
                  value={totalEffective}
                  onChange={(value) => setTotalEffective(value.toString())}
                />
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button onClick={handlePullLastRecord} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Puxar Último Registro
              </Button>
              <Button onClick={handleSaveReport} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Salvar Relatório do Dia
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Column 1: Top 5 Vendedores */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Vendedores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topSellers.map((seller, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">#{index + 1} Posição</h4>
                  
                  <div>
                    <Label htmlFor={`seller-${index}`}>Selecionar Vendedor</Label>
                    <Select
                      value={seller.seller_id}
                      onValueChange={(value) => updateTopSeller(index, 'seller_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um vendedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {sellers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`oc-${index}`}>Número OC</Label>
                      <Input 
                        id={`oc-${index}`}
                        placeholder="000"
                        value={seller.oc_number}
                        onChange={(e) => updateTopSeller(index, 'oc_number', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`value-${index}`}>Valor Efetivado (R$)</Label>
                      <CurrencyInput 
                        id={`value-${index}`}
                        value={seller.value_sold}
                        onChange={(value) => updateTopSeller(index, 'value_sold', value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`conversion-${index}`}>Taxa de Conversão (%)</Label>
                    <Input 
                      id={`conversion-${index}`}
                      type="number"
                      step="0.01"
                      placeholder="0,0"
                      value={seller.conversion_rate}
                      onChange={(e) => updateTopSeller(index, 'conversion_rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Column 2: Top 5 Fluxo de Caixa */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cashFlow.map((flow, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">#{index + 1} Posição</h4>
                  
                  <div>
                    <Label htmlFor={`cashflow-seller-${index}`}>Selecionar Vendedor</Label>
                    <Select
                      value={flow.seller_id}
                      onValueChange={(value) => updateCashFlow(index, 'seller_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um vendedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {sellers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <Label htmlFor={`cashflow-sold-${index}`}>Valor Efetivado (R$)</Label>
                       <CurrencyInput 
                         id={`cashflow-sold-${index}`}
                         value={flow.value_sold}
                         onChange={(value) => updateCashFlow(index, 'value_sold', value)}
                       />
                     </div>
                     <div>
                       <Label htmlFor={`received-${index}`}>Valor Recebido (R$)</Label>
                       <CurrencyInput 
                         id={`received-${index}`}
                         value={flow.value_received}
                         onChange={(value) => updateCashFlow(index, 'value_received', value)}
                       />
                     </div>
                   </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Column 3: Top 5 Margem de Lucro */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Margem de Lucro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profitMargin.map((margin, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">#{index + 1} Posição</h4>
                  
                  <div>
                    <Label htmlFor={`margin-seller-${index}`}>Selecionar Vendedor</Label>
                    <Select
                      value={margin.seller_id}
                      onValueChange={(value) => updateProfitMargin(index, 'seller_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um vendedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {sellers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`profit-${index}`}>Margem de Lucro (%)</Label>
                    <Input 
                      id={`profit-${index}`}
                      type="number"
                      step="0.01"
                      placeholder="0,0"
                      value={margin.profit_margin}
                      onChange={(e) => updateProfitMargin(index, 'profit_margin', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PainelLancamentos;