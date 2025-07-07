import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient, { loginUser, registerUser, getUserProfile } from '../services/api';
import jwtDecode from 'jwt-decode'; // Corrected import

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User object from backend
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStoredTokens = async () => {
      try {
        setIsLoading(true);
        const storedAccessToken = await SecureStore.getItemAsync('accessToken');
        const storedRefreshToken = await SecureStore.getItemAsync('refreshToken');

        if (storedAccessToken) {
          // TODO: Add token validation/refresh logic here
          // For now, just set them if they exist
          setAccessToken(storedAccessToken);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;

          // Fetch user profile if token exists
          // This also helps validate if the token is still good on app start
          try {
            const profileResponse = await getUserProfile();
            setUser(profileResponse.data);
          } catch (e) {
            console.error("Failed to fetch profile with stored token, clearing tokens.", e);
            await logout(); // Token might be expired or invalid
          }
        }
        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken);
        }
      } catch (e) {
        console.error('Failed to load tokens from storage', e);
        setError('Failed to load session.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredTokens();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await loginUser({ email, password });
      const { access, refresh } = response.data;

      setAccessToken(access);
      setRefreshToken(refresh);
      await SecureStore.setItemAsync('accessToken', access);
      await SecureStore.setItemAsync('refreshToken', refresh);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      // Fetch user profile after login
      const profileResponse = await getUserProfile();
      setUser(profileResponse.data);
      return profileResponse.data;

    } catch (e) {
      console.error('Login failed', e.response?.data || e.message);
      const errorMessage = e.response?.data?.detail || 'Login failed. Please check credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setIsLoading(true);
      // The register endpoint in Django backend creates the user but doesn't log them in automatically.
      // After successful registration, we could auto-login or direct to login screen.
      // For simplicity, let's assume backend returns tokens upon registration or we log in subsequently.
      // Current Django setup does not return tokens on register. So user needs to login after.
      const response = await registerUser(userData);
      // console.log('Registration successful', response.data);
      // Optionally, log the user in directly if the backend supports it or by calling login()
      // For now, registration success means they can now login.
      return response.data; // Or some success message/object
    } catch (e) {
      console.error('Registration failed', e.response?.data || e.message);
      const errorData = e.response?.data;
      let errorMessage = 'Registration failed. Please try again.';
      if (errorData) {
        // Construct a more detailed error message
        errorMessage = Object.keys(errorData).map(key => `${key}: ${errorData[key].join ? errorData[key].join(', ') : errorData[key]}`).join('; ');
      }
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setIsLoading(true);
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      delete apiClient.defaults.headers.common['Authorization'];
    } catch (e) {
      console.error('Logout failed', e);
      setError('Logout failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Implement token refresh logic
  // const refreshAuthToken = async () => { ... }

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
