import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Ensure this IP address is correct for your Django development server.
// If using an Android emulator, '10.0.2.2' usually maps to your computer's localhost.
// If using a physical device, this needs to be your computer's network IP address.
// Make sure your Django server is running on 0.0.0.0:8000 to be accessible.
const API_URL = 'http://10.0.2.2:8000/api'; // FOR ANDROID EMULATOR
// const API_URL = 'http://<YOUR_COMPUTER_IP>:8000/api'; // FOR PHYSICAL DEVICE TESTING

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// TODO: Add interceptor for token refresh on 401 errors if needed later

export default apiClient;

// User Authentication
export const registerUser = (userData) => apiClient.post('/users/register/', userData);
export const loginUser = (credentials) => apiClient.post('/users/token/', credentials);
export const refreshToken = (refresh) => apiClient.post('/users/token/refresh/', { refresh });
export const getUserProfile = () => apiClient.get('/users/profile/');
export const updateUserProfile = (profileData) => apiClient.put('/users/profile/', profileData); // or PATCH

// Service Categories
export const getServiceCategories = () => apiClient.get('/categories/');
export const getServiceCategoryDetails = (id) => apiClient.get(`/categories/${id}/`);

// Services
export const getServices = (params) => apiClient.get('/services/', { params }); // params: { category_id, provider_id }
export const getServiceDetails = (id) => apiClient.get(`/services/${id}/`);

// Service Providers (if you have a direct endpoint for provider profiles)
// export const getServiceProviderProfiles = (params) => apiClient.get('/provider-profiles/', { params }); // Example
// export const getServiceProviderProfileDetails = (id) => apiClient.get(`/provider-profiles/${id}/`);

// Bookings
export const createBooking = (bookingData) => apiClient.post('/bookings/', bookingData);
export const getUserBookings = () => apiClient.get('/bookings/'); // Gets bookings for the logged-in user (customer or provider based on backend logic)
export const getBookingDetails = (id) => apiClient.get(`/bookings/${id}/`);
// export const updateBookingStatus = (id, statusData) => apiClient.patch(`/bookings/${id}/update_status/`, statusData);
// export const cancelBooking = (id) => apiClient.post(`/bookings/${id}/cancel_booking/`);
