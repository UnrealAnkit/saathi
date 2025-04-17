import React from 'react';
import { Search, Users, Globe2, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Find Your Perfect Hackathon Team
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Connect with talented developers, designers, and innovators worldwide. 
          Build amazing projects together.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <Globe2 className="h-8 w-8 text-indigo-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Global Network</h3>
          <p className="text-gray-600">
            Connect with developers from around the world and form diverse, skilled teams.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <Search className="h-8 w-8 text-indigo-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Smart Matching</h3>
          <p className="text-gray-600">
            Find teammates based on skills, experience, and timezone compatibility.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <Clock className="h-8 w-8 text-indigo-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
          <p className="text-gray-600">
            Stay connected with instant messaging and team collaboration tools.
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-6">Featured Hackathons</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
              Online
            </span>
            <h3 className="text-lg font-semibold mt-2">Global Innovation Challenge</h3>
            <p className="text-gray-600 text-sm mt-1">March 15-17, 2024</p>
          </div>

          <div className="border rounded-lg p-4">
            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
              In Person
            </span>
            <h3 className="text-lg font-semibold mt-2">AI for Good Hackathon</h3>
            <p className="text-gray-600 text-sm mt-1">April 1-3, 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
}