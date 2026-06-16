CREATE TABLE IF NOT EXISTS public.landing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_person text,
  phone text,
  email text,
  business_name text,
  source text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert" ON public.landing_leads
  FOR INSERT TO anon WITH CHECK (true);