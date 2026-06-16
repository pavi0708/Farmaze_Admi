-- Enable RLS on market_insights table
ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read market insights (public information)
CREATE POLICY "Allow public read access to market insights" 
ON public.market_insights 
FOR SELECT 
USING (true);

-- Only authenticated users can insert/update/delete market insights
CREATE POLICY "Authenticated users can manage market insights" 
ON public.market_insights 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update market insights" 
ON public.market_insights 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete market insights" 
ON public.market_insights 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Enable RLS on product_suggestions table
ALTER TABLE public.product_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own product suggestions
CREATE POLICY "Users can view their own product suggestions" 
ON public.product_suggestions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own product suggestions
CREATE POLICY "Users can create their own product suggestions" 
ON public.product_suggestions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own product suggestions
CREATE POLICY "Users can update their own product suggestions" 
ON public.product_suggestions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own product suggestions
CREATE POLICY "Users can delete their own product suggestions" 
ON public.product_suggestions 
FOR DELETE 
USING (auth.uid() = user_id);