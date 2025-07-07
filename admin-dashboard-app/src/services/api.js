import axios from 'axios';

// Adjust the API_URL if your Django server runs elsewhere or if this app is served differently
const API_URL = 'http://localhost:8000/api'; // Default for local development

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('adminAccessToken'); // Using localStorage for web
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication
export const adminLogin = (credentials) => apiClient.post('/users/token/', credentials); // Same token endpoint
// We'll check for is_staff attribute in the user profile response

// User Management (Admin specific - needs admin permissions on backend)
// These might need new dedicated admin API endpoints if the default ones are not sufficient
// or if we need more bulk operations / specific filters.
// For now, assuming generic endpoints and DRF's IsAdminUser permission.

// Example: Fetching all users (requires admin privileges)
// This might need a new endpoint like /api/admin/users/ or rely on IsAdminUser on existing /api/users/
// For now, let's assume a generic /users/ endpoint that an admin can access to get all users.
// Or, more realistically, you'd have specific admin endpoints.
// Let's define placeholder names for now and refine if backend needs adjustment.
export const getAllUsers = (params) => apiClient.get('/users/', { params }); // May need adjustment on backend for admin
export const getUserDetails = (userId) => apiClient.get(`/users/${userId}/`); // Standard endpoint
// export const updateUserByAdmin = (userId, userData) => apiClient.put(`/admin/users/${userId}/`, userData);

// Service Provider Profiles (Admin might need to list/view these)
export const getAllProviderProfiles = (params) => apiClient.get('/users/provider-profile/', { params }); // Assuming admin can list all
// export const verifyProviderProfile = (profileId, verificationData) => apiClient.patch(`/admin/provider-profiles/${profileId}/verify/`, verificationData);


// Bookings Management (Admin specific)
export const getAllBookings = (params) => apiClient.get('/bookings/', { params }); // Admin should get all
// export const getBookingDetailsByAdmin = (bookingId) => apiClient.get(`/admin/bookings/${bookingId}/`);
// export const updateBookingByAdmin = (bookingId, bookingData) => apiClient.put(`/admin/bookings/${bookingId}/`, bookingData);

// Service Categories (Admin can manage these)
export const getServiceCategories = () => apiClient.get('/categories/');
export const createServiceCategory = (categoryData) => apiClient.post('/categories/', categoryData);
export const updateServiceCategory = (categoryId, categoryData) => apiClient.put(`/categories/${categoryId}/`, categoryData);
export const deleteServiceCategory = (categoryId) => apiClient.delete(`/categories/${categoryId}/`);


// General User Profile (for admin to check their own details if needed)
export const getMyProfile = () => apiClient.get('/users/profile/');


export default apiClient;
