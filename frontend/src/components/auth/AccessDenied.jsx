// frontend/src/components/auth/AccessDenied.jsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Access Denied page shown when a user tries to access a page they don't have permission for
 */
const AccessDenied = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Determine where to redirect based on user role
  const goToDashboard = () => {
    if (!user) return navigate('/login');
    
    const role = user.selectedPortal || user.role;
    
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'landlord':
        navigate('/landlord/properties');
        break;
      case 'tenant':
        navigate('/tenant/dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
        
        <div className="text-gray-600 mb-6">
          <p className="mb-4">
            You don't have permission to access this page.
          </p>
          <p>
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={goToDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
          
          <Link
            to="/"
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
          >
            Go to Home
          </Link>
          
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
