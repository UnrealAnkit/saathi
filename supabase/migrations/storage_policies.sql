-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Enable RLS on storage.buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to create buckets
CREATE POLICY "Allow authenticated users to create buckets"
ON storage.buckets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow public access to avatars bucket
CREATE POLICY "Public access to avatars bucket"
ON storage.buckets
FOR SELECT
USING (name = 'avatars');

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload objects to avatars bucket
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Create policy to allow users to update their own objects
CREATE POLICY "Allow users to update their own objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

-- Create policy to allow public access to objects in avatars bucket
CREATE POLICY "Public access to avatar objects"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars'); 