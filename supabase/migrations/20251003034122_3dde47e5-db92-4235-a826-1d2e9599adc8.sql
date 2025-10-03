-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Posts are viewable by everyone"
ON public.community_posts
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own posts"
ON public.community_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.community_posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.community_posts
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;

-- Trigger for updated_at
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();