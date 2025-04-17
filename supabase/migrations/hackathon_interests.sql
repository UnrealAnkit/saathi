-- Create hackathon_interests table
CREATE TABLE IF NOT EXISTS hackathon_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  interest text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, interest)
);

ALTER TABLE hackathon_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hackathon interests are viewable by everyone"
  ON hackathon_interests FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own hackathon interests"
  ON hackathon_interests FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id); 