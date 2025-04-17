/*
  # Add RLS policies for hackathons table

  1. Security Changes
    - Add policy to allow authenticated users to create hackathons
    - Add policy to allow users to update their own hackathons
    - Add policy to allow users to delete their own hackathons
*/

-- Add owner_id column to hackathons table
ALTER TABLE hackathons
ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- Policy to allow authenticated users to create hackathons
CREATE POLICY "Users can create hackathons"
ON public.hackathons
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Policy to allow users to update their own hackathons
CREATE POLICY "Users can update their own hackathons"
ON public.hackathons
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Policy to allow users to delete their own hackathons
CREATE POLICY "Users can delete their own hackathons"
ON public.hackathons
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);