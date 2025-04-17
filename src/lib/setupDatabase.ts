import { supabase } from './supabase';

export async function setupDatabase() {
  console.log('Setting up database tables...');
  
  try {
    // Check if connections table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'connections')
      .single();
    
    if (checkError || !existingTable) {
      console.log('Connections table does not exist. Creating it now...');
      
      // Create connections table
      const { error: createConnectionsError } = await supabase.rpc('create_connections_table');
      
      if (createConnectionsError) {
        console.error('Error creating connections table:', createConnectionsError);
        throw createConnectionsError;
      }
      
      console.log('Connections table created successfully');
      
      // Create messages table
      const { error: createMessagesError } = await supabase.rpc('create_messages_table');
      
      if (createMessagesError) {
        console.error('Error creating messages table:', createMessagesError);
        throw createMessagesError;
      }
      
      console.log('Messages table created successfully');
    } else {
      console.log('Database tables already exist');
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
} 