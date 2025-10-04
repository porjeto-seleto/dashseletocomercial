-- Create daily_reports table for storing daily rankings data
CREATE TABLE public.daily_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL,
  total_effective NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create daily_rankings table for top sellers data
CREATE TABLE public.daily_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.daily_reports(id) ON DELETE CASCADE NOT NULL,
  ranking_type TEXT NOT NULL CHECK (ranking_type IN ('top_sellers', 'cash_flow', 'profit_margin')),
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 5),
  seller_id UUID REFERENCES public.sellers(id) NOT NULL,
  oc_number TEXT,
  value_sold NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  value_received NUMERIC DEFAULT 0,
  profit_margin NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(report_id, ranking_type, position)
);

-- Enable RLS
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rankings ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_reports
CREATE POLICY "Users can view daily reports" 
ON public.daily_reports 
FOR SELECT 
USING (has_role(auth.uid(), 'user'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own reports" 
ON public.daily_reports 
FOR ALL 
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Create policies for daily_rankings
CREATE POLICY "Users can view daily rankings" 
ON public.daily_rankings 
FOR SELECT 
USING (has_role(auth.uid(), 'user'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage rankings through reports" 
ON public.daily_rankings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.daily_reports 
    WHERE id = daily_rankings.report_id 
    AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_daily_reports_updated_at
BEFORE UPDATE ON public.daily_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_rankings_updated_at
BEFORE UPDATE ON public.daily_rankings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_daily_reports_date ON public.daily_reports(report_date);
CREATE INDEX idx_daily_reports_created_by ON public.daily_reports(created_by);
CREATE INDEX idx_daily_rankings_report_id ON public.daily_rankings(report_id);
CREATE INDEX idx_daily_rankings_type_position ON public.daily_rankings(ranking_type, position);