-- Create sales table for tracking sales data
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.sellers(id) NOT NULL,
  customer_name TEXT NOT NULL,
  product_description TEXT NOT NULL,
  sale_value NUMERIC NOT NULL CHECK (sale_value > 0),
  commission_percentage NUMERIC NOT NULL DEFAULT 0 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  commission_value NUMERIC GENERATED ALWAYS AS (sale_value * commission_percentage / 100) STORED,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policies for sales table
CREATE POLICY "Admins can manage all sales" 
ON public.sales 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view all sales" 
ON public.sales 
FOR SELECT 
USING (has_role(auth.uid(), 'user'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own sales" 
ON public.sales 
FOR INSERT 
WITH CHECK ((has_role(auth.uid(), 'user'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) AND created_by = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_sales_seller_id ON public.sales(seller_id);
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX idx_sales_status ON public.sales(status);