-- Create the hackathons table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hackathons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  format TEXT CHECK (format IN ('online', 'in_person', 'hybrid')),
  website TEXT,
  image_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS to hackathons
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;

-- Create policies for hackathons
CREATE POLICY IF NOT EXISTS "Users can view all hackathons"
  ON public.hackathons
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can create hackathons"
  ON public.hackathons
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Users can update their own hackathons"
  ON public.hackathons
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Users can delete their own hackathons"
  ON public.hackathons
  FOR DELETE
  USING (auth.uid() = created_by);

-- Create the hackathon_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hackathon_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hackathon_id, profile_id)
);

-- Add RLS to hackathon_participants
ALTER TABLE public.hackathon_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for hackathon_participants
CREATE POLICY IF NOT EXISTS "Users can view all hackathon participants"
  ON public.hackathon_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can register themselves for hackathons"
  ON public.hackathon_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "Users can remove themselves from hackathons"
  ON public.hackathon_participants
  FOR DELETE
  USING (auth.uid() = profile_id); 