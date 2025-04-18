import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Hackathons from './pages/Hackathons';
import FindTeammates from './pages/FindTeammates';
import Messages from './pages/Messages';
import Connections from './pages/Connections';
import HackathonDetail from './pages/HackathonDetail';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setupDatabase } from './lib/setupDatabase';
import { supabase } from './lib/supabase';
import ProfileView from './pages/ProfileView';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/auth" />;
}

function App() {
  useEffect(() => {
    setupDatabase()
      .then(success => {
        if (success) {
          console.log('Database setup completed successfully');
        } else {
          console.error('Database setup failed');
        }
      });
  }, []);

  useEffect(() => {
    const createHackathonsTable = async () => {
      try {
        const { error } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.hackathons (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              name TEXT NOT NULL,
              description TEXT,
              start_date TIMESTAMP WITH TIME ZONE,
              end_date TIMESTAMP WITH TIME ZONE,
              location TEXT,
              format TEXT CHECK (format IN ('online', 'in_person', 'hybrid')),
              website TEXT,
              image_url TEXT,
              created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY IF NOT EXISTS "Users can view all hackathons"
              ON public.hackathons
              FOR SELECT
              TO authenticated
              USING (true);
            
            CREATE POLICY IF NOT EXISTS "Users can create hackathons"
              ON public.hackathons
              FOR INSERT
              TO authenticated
              WITH CHECK (auth.uid() = created_by);
            
            CREATE POLICY IF NOT EXISTS "Users can update their own hackathons"
              ON public.hackathons
              FOR UPDATE
              USING (auth.uid() = created_by);
            
            CREATE POLICY IF NOT EXISTS "Users can delete their own hackathons"
              ON public.hackathons
              FOR DELETE
              USING (auth.uid() = created_by);
          `
        });
        
        if (error) {
          console.error('Error creating hackathons table:', error);
        }
      } catch (error) {
        console.error('Error creating hackathons table:', error);
      }
    };
    
    createHackathonsTable();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/hackathons" element={<Hackathons />} />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route path="/find-teammates" element={<FindTeammates />} />
              <Route
                path="/connections"
                element={
                  <PrivateRoute>
                    <Connections />
                  </PrivateRoute>
                }
              />
              <Route
                path="/messages/:connectionId"
                element={
                  <PrivateRoute>
                    <Messages />
                  </PrivateRoute>
                }
              />
              <Route path="/hackathons/:hackathonId" element={<HackathonDetail />} />
              <Route 
                path="/profile/:profileId" 
                element={<ProfileView />} 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#1F2937',
                color: '#fff',
              },
            }} 
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;