import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Settings, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-5xl font-bold text-foreground">
              Sistema de Dashboard de Vendas
            </h1>
            {user ? (
              <Button onClick={handleSignOut} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth">
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </Link>
              </Button>
            )}
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Plataforma completa para acompanhamento e gestão de métricas de vendas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dashboard Card */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Dashboard Principal</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Visualize métricas de vendas em tempo real, otimizado para TV
              </p>
              <Link to="/dash">
                <Button className="w-full">
                  Acessar Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Painel Lançamentos Card */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto text-secondary mb-4" />
              <CardTitle>Painel de Lançamentos</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Insira dados diários de vendas e acompanhe performance
              </p>
              <Link to="/painel-lancamentos">
                <Button variant="secondary" className="w-full">
                  Fazer Lançamentos
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Painel Admin Card */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center">
              <Settings className="h-12 w-12 mx-auto text-success mb-4" />
              <CardTitle>Painel Administrativo</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Gerencie vendedores, equipes, metas e configurações
              </p>
              <Link to="/paineladmin">
                <Button variant="outline" className="w-full">
                  Acessar Admin
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-xl">
          <h2 className="text-2xl font-semibold mb-4">Funcionalidades Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <ul className="space-y-2">
              <li>✅ Dashboard TV-optimized (1920x1080)</li>
              <li>✅ Top 5 Vendedores com ranking</li>
              <li>✅ Acompanhamento de Meta Global</li>
              <li>✅ Fluxo de Caixa detalhado</li>
            </ul>
            <ul className="space-y-2">
              <li>✅ Gráficos Previsto vs Efetivado</li>
              <li>✅ Análise de Margem de Lucro</li>
              <li>✅ Sistema completo de gestão</li>
              <li>✅ Interface responsiva e moderna</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
