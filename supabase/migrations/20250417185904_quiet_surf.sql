/*
  # Initial Schema Setup for Saathi Platform

  1. New Tables
    - `profiles`
      - Stores user profile information
      - Links to Supabase auth.users
      - Includes location, timezone, and availability status
    
    - `skills`
      - User skills with proficiency levels
      - References profiles table
    
    - `languages`
      - User language proficiencies
      - References profiles table
    
    - `hackathons`
      - Hackathon event details
      - Includes dates, format, location, theme
    
    - `hackathon_participants`
      - Links users to hackathons they're participating in
      - Tracks team assignments

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to:
      - Read public profile data
      - Manage their own profile
      - View and join hackathons
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  avatar_url text,
  location text,
  timezone text,
  github_url text,
  linkedin_url text,
  website_url text,
  availability_status text DEFAULT 'open' CHECK (availability_status IN ('actively_looking', 'open', 'unavailable')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  proficiency_level text NOT NULL CHECK (proficiency_level IN ('Beginner', 'Intermediate', 'Expert')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, name)
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills are viewable by everyone"
  ON skills FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own skills"
  ON skills FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Languages table
CREATE TABLE IF NOT EXISTS languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  language text NOT NULL,
  proficiency_level text NOT NULL CHECK (proficiency_level IN ('Basic', 'Conversational', 'Fluent', 'Native')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, language)
);

ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Languages are viewable by everyone"
  ON languages FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own languages"
  ON languages FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Hackathons table
CREATE TABLE IF NOT EXISTS hackathons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  format text NOT NULL CHECK (format IN ('online', 'in_person', 'hybrid')),
  location text,
  theme text,
  max_team_size int DEFAULT 4,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hackathons are viewable by everyone"
  ON hackathons FOR SELECT
  USING (true);

-- Hackathon participants and teams
CREATE TABLE IF NOT EXISTS hackathon_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid REFERENCES hackathons(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  team_id uuid,
  role text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(hackathon_id, profile_id)
);

ALTER TABLE hackathon_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants are viewable by everyone"
  ON hackathon_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own participation"
  ON hackathon_participants FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_hackathons_updated_at
  BEFORE UPDATE ON hackathons
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_hackathon_participants_updated_at
  BEFORE UPDATE ON hackathon_participants
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();