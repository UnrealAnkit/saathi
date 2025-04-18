import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, MessageSquare, Users, Calendar, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Hackathons', path: '/hackathons' },
    { name: 'Find Teammates', path: '/find-teammates' },
  ];

  const profileLinks = user ? [
    { name: 'My Profile', path: '/profile', icon: <User className="h-5 w-5" /> },
    { name: 'Connections', path: '/connections', icon: <Users className="h-5 w-5" /> },
    { name: 'Messages', path: '/messages', icon: <MessageSquare className="h-5 w-5" /> },
  ] : [];

  return (
    <nav className="bg-gray-900 border-b border-purple-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <motion.div 
              className="flex-shrink-0 flex items-center"
              whileHover={{ scale: 1.05 }}
            >
              <Link to="/" className="text-white font-bold text-xl flex items-center">
                <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-transparent bg-clip-text">Team-Up</span>
              </Link>
            </motion.div>
            
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === link.path
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden md:flex md:items-center">
            {user ? (
              <div className="flex items-center">
                {profileLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`ml-4 px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                      location.pathname === link.path
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {link.icon}
                    <span className="ml-2">{link.name}</span>
                  </Link>
                ))}
                
                <button
                  onClick={handleSignOut}
                  className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="ml-2">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="ml-4 px-4 py-2 rounded-md text-sm font-medium bg-purple-600 text-white hover:bg-purple-700"
              >
                Sign In
              </Link>
            )}
          </div>
          
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <motion.div 
          className="md:hidden"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === link.path
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            
            {user && profileLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === link.path
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  {link.icon}
                  <span className="ml-2">{link.name}</span>
                </div>
              </Link>
            ))}
          </div>
          
          {user ? (
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-white">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-auto bg-gray-800 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-3 border-t border-gray-700">
              <Link
                to="/auth"
                className="block text-center w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </nav>
  );
}