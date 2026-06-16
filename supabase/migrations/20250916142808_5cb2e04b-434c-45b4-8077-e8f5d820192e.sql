-- Enable Row Level Security on consultations table
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert consultation requests (for contact forms)
CREATE POLICY "Allow public consultation submissions" 
ON public.consultations 
FOR INSERT 
WITH CHECK (true);

-- Only authenticated users can view consultations (admin/staff access)
CREATE POLICY "Authenticated users can view consultations" 
ON public.consultations 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only authenticated users can update consultation status
CREATE POLICY "Authenticated users can update consultations" 
ON public.consultations 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Only authenticated users can delete consultations
CREATE POLICY "Authenticated users can delete consultations" 
ON public.consultations 
FOR DELETE 
USING (auth.uid() IS NOT NULL);