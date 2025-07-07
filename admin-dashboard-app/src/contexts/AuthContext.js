import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient, { adminLogin, getMyProfile } from '../services/api';
// import jwtDecode from 'jwt-decode'; // Can be used to check token expiry or roles client-side

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null); // User object for the admin
  const [accessToken, setAccessToken] = useState(localStorage.getItem('adminAccessToken'));
  const [isLoading, setIsLoading] = useState(true); // For initial token validation and profile fetch
  const [error, setError] = useState(null);

  useEffect(() => {
    const validateTokenAndFetchUser = async () => {
      const token = localStorage.getItem('adminAccessToken');
      if (token) {
        setAccessToken(token); // Already set by useState initial value, but good for clarity
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const profileResponse = await getMyProfile(); // Fetch logged-in user's profile
          // IMPORTANT: Check if the user is staff/admin
          if (profileResponse.data && profileResponse.data.is_staff) { // Assuming 'is_staff' field from Django User model
            setAdminUser(profileResponse.data);
          } else {
            // User is not staff, or token is invalid for profile fetch
            await logout(); // Clear token and user state
            setError("Access Denied. You must be an admin to access this dashboard.");
          }
        } catch (e) {
          console.error("Token validation/Profile fetch failed", e);
          await logout(); // Clear token if validation fails
          setError("Session expired or invalid. Please login again.");
        }
      }
      setIsLoading(false);
    };

    validateTokenAndFetchUser();
  }, []); // Run once on app load

  const login = async (email, password) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await adminLogin({ email, password });
      const { access, refresh } = response.data; // Assuming backend sends refresh token too

      // Before setting user, fetch profile to verify they are staff
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      const profileResponse = await getMyProfile();

      if (profileResponse.data && profileResponse.data.is_staff) {
        setAdminUser(profileResponse.data);
        setAccessToken(access);
        localStorage.setItem('adminAccessToken', access);
        if (refresh) {
            localStorage.setItem('adminRefreshToken', refresh); // Store refresh token if available
        }
        // apiClient already updated with new token header from above
        return profileResponse.data;
      } else {
        delete apiClient.defaults.headers.common['Authorization']; // Remove token if user not staff
        const loginError = "Access Denied. You are not authorized to access the admin dashboard.";
        setError(loginError);
        throw new Error(loginError);
      }
    } catch (e) {
      console.error('Admin login failed', e.response?.data || e.message);
      const errorMessage = e.response?.data?.detail || e.message || 'Login failed. Please check credentials or ensure you are an admin.';
      setError(errorMessage);
      localStorage.removeItem('adminAccessToken'); // Clear any token on failure
      localStorage.removeItem('adminRefreshToken');
      delete apiClient.defaults.headers.common['Authorization'];
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setAdminUser(null);
    setAccessToken(null);
    setError(null);
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    delete apiClient.defaults.headers.common['Authorization'];
    // Potentially call a backend /logout endpoint if it exists to invalidate tokens server-side
  };

  // TODO: Add token refresh logic if refresh tokens are implemented and used.

  return (
    <AuthContext.Provider value={{ adminUser, accessToken, isLoading, error, login, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider for AdminDashboardApp');
  }
  return context;
};
