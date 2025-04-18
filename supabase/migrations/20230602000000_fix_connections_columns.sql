-- Check if the connections table exists with the old column names
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'connections' 
    AND column_name = 'requester_id'
  ) THEN
    -- Rename columns to match the code
    ALTER TABLE public.connections RENAME COLUMN requester_id TO sender_id;
    ALTER TABLE public.connections RENAME COLUMN recipient_id TO receiver_id;
    
    -- Update any existing policies
    DROP POLICY IF EXISTS "Users can view their own connections" ON public.connections;
    DROP POLICY IF EXISTS "Users can create connection requests" ON public.connections;
    DROP POLICY IF EXISTS "Users can update their own connections" ON public.connections;
    
    -- Create new policies with correct column names
    CREATE POLICY "Users can view their own connections"
      ON public.connections
      FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    
    CREATE POLICY "Users can insert their own connections"
      ON public.connections
      FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
    
    CREATE POLICY "Users can update their own connections"
      ON public.connections
      FOR UPDATE
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;
END $$;

-- If the table doesn't exist at all, create it with the correct column names
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is enabled
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS connections_sender_id_idx ON public.connections(sender_id);
CREATE INDEX IF NOT EXISTS connections_receiver_id_idx ON public.connections(receiver_id); 