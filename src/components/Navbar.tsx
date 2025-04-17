import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Code, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white mr-2">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">Saathi</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/hackathons"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <Code className="h-4 w-4 mr-1" />
                Hackathons
              </Link>
              <Link
                to="/find-teammates"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <Users className="h-4 w-4 mr-1" />
                Find Teammates
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <User className="h-5 w-5 mr-1" />
                  <span className="hidden md:inline">Profile</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="sm:hidden border-t border-gray-200">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/hackathons"
            className="text-gray-500 hover:bg-gray-50 hover:text-gray-700 block pl-3 pr-4 py-2 text-base font-medium"
          >
            Hackathons
          </Link>
          <Link
            to="/find-teammates"
            className="text-gray-500 hover:bg-gray-50 hover:text-gray-700 block pl-3 pr-4 py-2 text-base font-medium"
          >
            Find Teammates
          </Link>
          {user && (
            <Link
              to="/profile"
              className="text-gray-500 hover:bg-gray-50 hover:text-gray-700 block pl-3 pr-4 py-2 text-base font-medium"
            >
              Profile
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}