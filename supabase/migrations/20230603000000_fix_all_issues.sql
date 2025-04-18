-- Comprehensive migration to fix all database issues

-- First, ensure the profiles table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS to profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles
CREATE POLICY IF NOT EXISTS "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create the profile_skills table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profile_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, name)
);

-- Add RLS to profile_skills
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_skills
CREATE POLICY IF NOT EXISTS "Users can view all profile skills"
  ON public.profile_skills
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can update their own profile skills"
  ON public.profile_skills
  FOR ALL
  USING (auth.uid() = profile_id);

-- Create the profile_languages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profile_languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, language)
);

-- Add RLS to profile_languages
ALTER TABLE public.profile_languages ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_languages
CREATE POLICY IF NOT EXISTS "Users can view all profile languages"
  ON public.profile_languages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can update their own profile languages"
  ON public.profile_languages
  FOR ALL
  USING (auth.uid() = profile_id);

-- Create the profile_hackathon_interests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profile_hackathon_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, interest)
);

-- Add RLS to profile_hackathon_interests
ALTER TABLE public.profile_hackathon_interests ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_hackathon_interests
CREATE POLICY IF NOT EXISTS "Users can view all profile hackathon interests"
  ON public.profile_hackathon_interests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can update their own profile hackathon interests"
  ON public.profile_hackathon_interests
  FOR ALL
  USING (auth.uid() = profile_id);

-- Create the hackathons table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hackathons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  format TEXT CHECK (format IN ('online', 'in_person', 'hybrid')),
  website_url TEXT,
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

-- Create functions for database setup
CREATE OR REPLACE FUNCTION public.create_profiles_table()
RETURNS void AS $$
BEGIN
  -- This function is now a no-op since we create the table directly in the migration
  RAISE NOTICE 'Profiles table already created in migration';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.create_connections_table()
RETURNS void AS $$
BEGIN
  -- This function is now a no-op since we create the table directly in the migration
  RAISE NOTICE 'Connections table already created in migration';
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 