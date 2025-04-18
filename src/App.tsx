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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/auth" />;
}

function App() {
  // Comment out or remove the setupDatabase call
  // useEffect(() => {
  //   setupDatabase()
  //     .then(success => {
  //       if (success) {
  //         console.log('Database setup completed successfully');
  //       } else {
  //         console.error('Database setup failed');
  //       }
  //     });
  // }, []);

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