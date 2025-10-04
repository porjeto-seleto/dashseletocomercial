-- Add total_sold column to daily_reports table
ALTER TABLE public.daily_reports 
ADD COLUMN IF NOT EXISTS total_sold numeric DEFAULT 0;