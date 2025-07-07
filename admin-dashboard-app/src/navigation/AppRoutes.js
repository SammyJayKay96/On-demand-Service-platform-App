import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import AdminLoginScreen from '../screens/AdminLoginScreen';
import DashboardHomeScreen from '../screens/DashboardHomeScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import BookingManagementScreen from '../screens/BookingManagementScreen';
import ServiceCategoryManagementScreen from '../screens/ServiceCategoryManagementScreen';
// Import other admin screens as they are created

// ProtectedRoute component to guard routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { adminUser, isLoading } = useAuth();

  if (isLoading) {
    // Optional: return a global loading spinner component
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading...</div>;
  }

  if (!adminUser) {
    // If not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // If authenticated and is_staff (checked in AuthContext), render the requested component
  return children;
};

const AppRoutes = () => {
  const { adminUser, isLoading } = useAuth();

  // A simple loading state for the initial check.
  // AuthContext also has isLoading which is more comprehensive for token validation.
  if (isLoading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Initializing Admin Dashboard...</div>;
  }

  return (
    <Router basename="/admin-dashboard"> {/* Set a basename if deploying to a subfolder */}
      <Routes>
        <Route path="/login" element={adminUser ? <Navigate to="/" replace /> : <AdminLoginScreen />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardHomeScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <UserManagementScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute>
              <BookingManagementScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/service-categories"
          element={
            <ProtectedRoute>
              <ServiceCategoryManagementScreen />
            </ProtectedRoute>
          }
        />
        {/* Add more protected routes here */}
        {/* <Route path="/admin/services" element={<ProtectedRoute><ServiceManagementScreen /></ProtectedRoute>} /> */}

        {/* Fallback for unmatched routes (optional) */}
        <Route path="*" element={<Navigate to={adminUser ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
