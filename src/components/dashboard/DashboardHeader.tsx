import { Menu, Settings, FileText, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import emblemaSeleto from "@/assets/emblema-seleto.png";

interface DashboardHeaderProps {
  currentDate: Date;
  onNavigateDate: (direction: 'prev' | 'next') => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const DashboardHeader = ({ currentDate, onNavigateDate, onRefresh, isLoading }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <header className="text-center py-4 px-4 bg-card border-b border-card-border">
      <div className="flex items-center justify-center gap-4 relative">
        {/* Date Navigation - Left Side */}
        <div className="absolute left-0 flex items-center gap-2 bg-card border border-card-border rounded-xl shadow-lg px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateDate('prev')}
            className="hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="font-semibold text-sm">{formatDate(currentDate)}</div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateDate('next')}
            className="hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="hover:bg-muted ml-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-2">
          <img 
            src={emblemaSeleto} 
            alt="Seleto Industrial" 
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard de Vendas Seleto Industrial
        </h1>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="absolute right-0">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border z-50">
            <DropdownMenuItem 
              onClick={() => {
                console.log('Navigating to admin panel');
                navigate('/paineladmin');
              }} 
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Painel Admin
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/painel-lancamentos')} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              Painel Lançamentos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;