import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient, { loginUser, getUserProfile, getServiceProviderProfile } from '../services/api';
// import jwtDecode from 'jwt-decode'; // Not strictly needed if not decoding token in JS for roles/expiry checks here

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Generic user details (username, email, user_type)
  const [providerProfile, setProviderProfile] = useState(null); // Specific service provider profile data
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null); // For token refresh later
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStoredData = async () => {
      setIsLoading(true);
      try {
        const storedAccessToken = await SecureStore.getItemAsync('accessToken');
        const storedRefreshToken = await SecureStore.getItemAsync('refreshToken');

        if (storedAccessToken) {
          setAccessToken(storedAccessToken);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;

          // Fetch user profile and provider profile
          // Ensure the user is indeed a provider
          const userProfileResponse = await getUserProfile();
          if (userProfileResponse.data && userProfileResponse.data.user_type === 'provider') {
            setUser(userProfileResponse.data);
            try {
                const serviceProviderProfileResponse = await getServiceProviderProfile();
                setProviderProfile(serviceProviderProfileResponse.data);
            } catch (e) {
                console.error("Failed to fetch service provider profile", e);
                // This provider might not have completed their profile setup yet.
                // The app should probably guide them to do so.
                setProviderProfile(null); // Or a placeholder indicating profile needs setup
            }
          } else {
            // Logged in user is not a provider, or token is invalid for fetching profile
            await logout(); // Clear tokens and state
            setError("Access denied. Please log in as a service provider.");
          }
        }
        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken);
        }
      } catch (e) {
        console.error('Failed to load tokens or user data', e);
        await logout(); // Clear any partial state if loading fails
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredData();
  }, []);

  const login = async (email, password) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await loginUser({ email, password });
      const { access, refresh } = response.data;

      setAccessToken(access);
      setRefreshToken(refresh);
      await SecureStore.setItemAsync('accessToken', access);
      await SecureStore.setItemAsync('refreshToken', refresh);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      const userProfileResponse = await getUserProfile();
      if (userProfileResponse.data && userProfileResponse.data.user_type === 'provider') {
        setUser(userProfileResponse.data);
        try {
            const serviceProviderProfileResponse = await getServiceProviderProfile();
            setProviderProfile(serviceProviderProfileResponse.data);
        } catch (e) {
            console.error("Failed to fetch service provider profile post-login", e);
            setProviderProfile(null); // Provider needs to setup profile
            // May want to navigate to a profile setup screen.
        }
        return userProfileResponse.data;
      } else {
        // Not a provider, or error fetching profile
        await logout(); // Log them out from provider app
        const loginError = "This application is for service providers only.";
        setError(loginError);
        throw new Error(loginError);
      }
    } catch (e) {
      console.error('Login failed', e.response?.data || e.message);
      const errorMessage = e.response?.data?.detail || e.message || 'Login failed. Please check credentials.';
      setError(errorMessage);
      await logout(); // Ensure clean state on login failure
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Registration is typically handled by a general registration form that allows user_type selection.
  // If a provider-specific registration is needed, it would be similar to UserApp's register.

  const logout = async () => {
    setError(null); // Clear any existing errors
    setUser(null);
    setProviderProfile(null);
    setAccessToken(null);
    setRefreshToken(null);
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    } catch (e) {
        console.error("Error clearing secure store on logout", e);
    }
    delete apiClient.defaults.headers.common['Authorization'];
    // No need to set isLoading to true/false here unless logout itself is async involving server
  };

  // Function to refetch provider profile, e.g., after update
  const refreshProviderProfile = async () => {
    if (!user || user.user_type !== 'provider') return; // Only for logged-in providers
    try {
        setIsLoading(true);
        const serviceProviderProfileResponse = await getServiceProviderProfile();
        setProviderProfile(serviceProviderProfileResponse.data);
        setError(null); // Clear previous errors if successful
    } catch (e) {
        console.error("Failed to refresh service provider profile", e);
        setError("Could not reload provider profile.");
        // Potentially keep stale profile or clear it, depending on desired UX
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ user, providerProfile, accessToken, isLoading, error, login, logout, refreshProviderProfile, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider for ServiceProviderApp');
  }
  return context;
};
