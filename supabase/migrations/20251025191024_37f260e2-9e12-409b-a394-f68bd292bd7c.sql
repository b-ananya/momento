-- Create memories table
CREATE TABLE public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_url TEXT,
  thought TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own memories" 
ON public.memories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories" 
ON public.memories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" 
ON public.memories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" 
ON public.memories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for memory photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('memory-photos', 'memory-photos', true);

-- Create storage policies for memory photos
CREATE POLICY "Users can view memory photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'memory-photos');

CREATE POLICY "Users can upload their own photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'memory-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'memory-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'memory-photos' AND auth.uid()::text = (storage.foldername(name))[1]);