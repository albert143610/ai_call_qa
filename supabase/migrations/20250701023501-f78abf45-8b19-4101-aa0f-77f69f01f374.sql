
-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'reviewer', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
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
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY 
    CASE 
      WHEN role = 'admin' THEN 1
      WHEN role = 'reviewer' THEN 2
      WHEN role = 'user' THEN 3
    END
  LIMIT 1
$$;

-- Create review assignments table
CREATE TABLE public.review_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    UNIQUE (call_id, reviewer_id)
);

-- Enable RLS on review_assignments
ALTER TABLE public.review_assignments ENABLE ROW LEVEL SECURITY;

-- Add review tracking columns to quality_scores
ALTER TABLE public.quality_scores 
ADD COLUMN IF NOT EXISTS manual_review_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS manual_review_notes TEXT,
ADD COLUMN IF NOT EXISTS manual_review_status TEXT DEFAULT 'pending' CHECK (manual_review_status IN ('pending', 'in_progress', 'completed', 'approved', 'rejected'));

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for review_assignments
CREATE POLICY "Reviewers can view their assignments" 
ON public.review_assignments 
FOR SELECT 
USING (
    auth.uid() = reviewer_id OR 
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'reviewer')
);

CREATE POLICY "Admins and reviewers can manage assignments" 
ON public.review_assignments 
FOR ALL 
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'reviewer')
);

-- Update quality_scores RLS policies to include reviewers
DROP POLICY IF EXISTS "Users can view their own quality scores" ON public.quality_scores;
CREATE POLICY "Users can view relevant quality scores" 
ON public.quality_scores 
FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.calls WHERE calls.id = quality_scores.call_id AND calls.user_id = auth.uid()) OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'reviewer')
);

CREATE POLICY "Reviewers can update quality scores" 
ON public.quality_scores 
FOR UPDATE 
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'reviewer')
);

-- Function to automatically assign reviews for low scoring calls
CREATE OR REPLACE FUNCTION public.auto_assign_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Auto-assign for review if overall score is below 3 or requires_review is true
    IF (NEW.overall_satisfaction_score IS NOT NULL AND NEW.overall_satisfaction_score < 3) 
       OR NEW.requires_review = true THEN
        
        UPDATE public.quality_scores 
        SET manual_review_required = true,
            manual_review_status = 'pending'
        WHERE id = NEW.id;
        
        -- Assign to a random reviewer (if any exist)
        INSERT INTO public.review_assignments (call_id, reviewer_id, assigned_by)
        SELECT 
            (SELECT call_id FROM public.quality_scores WHERE id = NEW.id),
            ur.user_id,
            auth.uid()
        FROM public.user_roles ur 
        WHERE ur.role = 'reviewer'
        ORDER BY random()
        LIMIT 1
        ON CONFLICT (call_id, reviewer_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for auto-assignment
DROP TRIGGER IF EXISTS trigger_auto_assign_review ON public.quality_scores;
CREATE TRIGGER trigger_auto_assign_review
    AFTER INSERT OR UPDATE ON public.quality_scores
    FOR EACH ROW
    WHEN (NEW.overall_satisfaction_score IS NOT NULL)
    EXECUTE FUNCTION public.auto_assign_review();

-- Insert default admin user (you'll need to replace with actual user ID after signup)
-- This is just a placeholder - you'll need to run this after creating your first user
-- INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_ID_HERE', 'admin');
