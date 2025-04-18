import { supabase } from './supabase';

export async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Check if profiles table exists
    const { data: profilesExists, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError && profilesError.code !== 'PGRST116') {
      console.error('Error checking profiles table:', profilesError);
      return false;
    }
    
    // Check if connections table exists
    const { data: connectionsExists, error: connectionsError } = await supabase
      .from('connections')
      .select('id')
      .limit(1);
    
    if (connectionsError && connectionsError.code !== 'PGRST116') {
      console.error('Error checking connections table:', connectionsError);
      return false;
    }
    
    // Check if hackathons table exists
    const { data: hackathonsExists, error: hackathonsError } = await supabase
      .from('hackathons')
      .select('id')
      .limit(1);
    
    if (hackathonsError && hackathonsError.code !== 'PGRST116') {
      console.error('Error checking hackathons table:', hackathonsError);
      // Don't return false here, we'll try to create the table
    }
    
    // If tables don't exist, create them
    if (!profilesExists || !connectionsExists || !hackathonsExists) {
      console.log('Creating missing tables...');
      
      // Create profiles table if it doesn't exist
      if (!profilesExists) {
        const { error } = await supabase.rpc('create_profiles_table');
        if (error) {
          console.error('Error creating profiles table:', error);
          return false;
        }
      }
      
      // Create connections table if it doesn't exist
      if (!connectionsExists) {
        const { error } = await supabase.rpc('create_connections_table');
        if (error) {
          console.error('Error creating connections table:', error);
          return false;
        }
      }
      
      // Create hackathons table if it doesn't exist
      if (!hackathonsExists) {
        const { error } = await supabase.rpc('create_hackathons_table');
        if (error) {
          console.error('Error creating hackathons table:', error);
          return false;
        }
      }
    }
    
    console.log('Database setup completed successfully');
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
}

async function createTablesDirectly() {
  // Create connections table with the correct column names
  const { error: connectionsError } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.connections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
        receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
        status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      
      ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can view their own connections"
        ON public.connections FOR SELECT
        USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
      
      CREATE POLICY IF NOT EXISTS "Users can insert their own connections"
        ON public.connections FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = sender_id);
      
      CREATE POLICY IF NOT EXISTS "Users can update their own connections"
        ON public.connections FOR UPDATE
        USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
        WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);
    `
  });
  
  if (connectionsError) {
    console.error('Error creating connections table:', connectionsError);
    throw connectionsError;
  }
  
  console.log('Connections table created successfully');
  
  // Create messages table with the correct column names
  const { error: messagesError } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        connection_id uuid REFERENCES public.connections(id) ON DELETE CASCADE,
        sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
        content text NOT NULL,
        read boolean DEFAULT false,
        created_at timestamptz DEFAULT now()
      );
      
      ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can view messages in their connections"
        ON public.messages FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.connections
            WHERE id = messages.connection_id
            AND (sender_id = auth.uid() OR receiver_id = auth.uid())
          )
        );
      
      CREATE POLICY IF NOT EXISTS "Users can send messages in their connections"
        ON public.messages FOR INSERT
        TO authenticated
        WITH CHECK (
          auth.uid() = sender_id AND
          EXISTS (
            SELECT 1 FROM public.connections
            WHERE id = messages.connection_id
            AND status = 'accepted'
            AND (sender_id = auth.uid() OR receiver_id = auth.uid())
          )
        );
    `
  });
  
  if (messagesError) {
    console.error('Error creating messages table:', messagesError);
    throw messagesError;
  }
  
  console.log('Messages table created successfully');
} 