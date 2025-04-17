-- Create connections table for teammate connections
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own connections
CREATE POLICY "Users can view their own connections"
  ON connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Policy to allow users to create connection requests
CREATE POLICY "Users can create connection requests"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Policy to allow users to update connections they're part of
CREATE POLICY "Users can update their own connections"
  ON connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Create messages table for teammate messaging
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES connections(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view messages in their connections
CREATE POLICY "Users can view messages in their connections"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE id = messages.connection_id
      AND (requester_id = auth.uid() OR recipient_id = auth.uid())
    )
  );

-- Policy to allow users to send messages in their connections
CREATE POLICY "Users can send messages in their connections"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM connections
      WHERE id = messages.connection_id
      AND status = 'accepted'
      AND (requester_id = auth.uid() OR recipient_id = auth.uid())
    )
  );

-- Add trigger to update updated_at on connections
CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column(); 