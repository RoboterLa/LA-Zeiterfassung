import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    // Prevent infinite loop by checking if already on login page
    if (location.pathname === '/' || location.pathname === '/login') {
      return null; // Don't redirect if already on login page
    }
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default ProtectedRoute; 