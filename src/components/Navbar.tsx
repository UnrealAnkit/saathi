import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Code2, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">Saathi</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              to="/hackathons"
              className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <Code2 className="h-5 w-5" />
              <span>Hackathons</span>
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <UserCircle className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}