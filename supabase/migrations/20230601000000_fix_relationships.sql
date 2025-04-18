-- Fix the relationships between connections and profiles tables

-- First, ensure the profiles table exists with the correct primary key
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the connections table with proper foreign keys if it doesn't exist
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the messages table with proper foreign keys if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

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

-- Add RLS policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their connections"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE 
        id = messages.connection_id AND
        (sender_id = auth.uid() OR receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their connections"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE 
        id = messages.connection_id AND
        (sender_id = auth.uid() OR receiver_id = auth.uid()) AND
        status = 'accepted'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS connections_sender_id_idx ON public.connections(sender_id);
CREATE INDEX IF NOT EXISTS connections_receiver_id_idx ON public.connections(receiver_id);
CREATE INDEX IF NOT EXISTS messages_connection_id_idx ON public.messages(connection_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id); 