-- Create user roles system for authorization
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on configurations" ON public.configurations;
DROP POLICY IF EXISTS "Allow all operations on teams" ON public.teams;
DROP POLICY IF EXISTS "Allow all operations on sellers" ON public.sellers;
DROP POLICY IF EXISTS "Allow all operations on global_goals" ON public.global_goals;
DROP POLICY IF EXISTS "Allow all operations on audit_logs" ON public.audit_logs;

-- Create secure RLS policies for configurations
CREATE POLICY "Admins can view configurations" ON public.configurations
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update configurations" ON public.configurations
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create secure RLS policies for teams
CREATE POLICY "Admins can view teams" ON public.teams
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert teams" ON public.teams
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update teams" ON public.teams
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete teams" ON public.teams
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create secure RLS policies for sellers
CREATE POLICY "Admins can view sellers" ON public.sellers
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sellers" ON public.sellers
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sellers" ON public.sellers
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sellers" ON public.sellers
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create secure RLS policies for global_goals
CREATE POLICY "Admins can view goals" ON public.global_goals
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert goals" ON public.global_goals
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update goals" ON public.global_goals
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete goals" ON public.global_goals
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create secure RLS policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- Create RLS policy for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert a default admin user role (you'll need to update this with actual user ID after signup)
-- This is a placeholder - the actual admin assignment should be done manually after user signup