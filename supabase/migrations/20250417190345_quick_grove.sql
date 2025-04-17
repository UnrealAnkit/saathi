/*
  # Add RLS policies for profiles table

  1. Security Changes
    - Add policy to allow users to insert their own profile
    - Add policy to allow users to update their own profile
    - Add policy to allow users to delete their own profile
*/

-- Policy to allow users to insert their own profile
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy to allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);