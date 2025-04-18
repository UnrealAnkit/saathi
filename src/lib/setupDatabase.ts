import { supabase } from './supabase';

export async function setupDatabase() {
  console.log('Setting up database tables...');
  
  try {
    // Check if connections table exists using a different approach
    const { data, error } = await supabase.rpc('check_table_exists', { 
      table_name: 'connections' 
    });
    
    if (error) {
      console.error('Error checking if table exists:', error);
      
      // Create the function if it doesn't exist
      await supabase.rpc('create_check_table_exists_function').catch(err => {
        console.error('Error creating function:', err);
      });
      
      // Try direct table creation
      await createTablesDirectly();
    } else if (!data) {
      console.log('Connections table does not exist. Creating it now...');
      await createTablesDirectly();
    } else {
      console.log('Database tables already exist');
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    // Try direct table creation as a fallback
    try {
      await createTablesDirectly();
      return true;
    } catch (err) {
      console.error('Failed to create tables directly:', err);
      return false;
    }
  }
}

async function createTablesDirectly() {
  // Create connections table
  const { error: connectionsError } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.connections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
        recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
        status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(requester_id, recipient_id)
      );
      
      ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can view their own connections"
        ON public.connections FOR SELECT
        USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
      
      CREATE POLICY IF NOT EXISTS "Users can create connection requests"
        ON public.connections FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = requester_id);
      
      CREATE POLICY IF NOT EXISTS "Users can update their own connections"
        ON public.connections FOR UPDATE
        USING (auth.uid() = requester_id OR auth.uid() = recipient_id)
        WITH CHECK (auth.uid() = requester_id OR auth.uid() = recipient_id);
    `
  });
  
  if (connectionsError) {
    console.error('Error creating connections table:', connectionsError);
    throw connectionsError;
  }
  
  console.log('Connections table created successfully');
  
  // Create messages table
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
            AND (requester_id = auth.uid() OR recipient_id = auth.uid())
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
            AND (requester_id = auth.uid() OR recipient_id = auth.uid())
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