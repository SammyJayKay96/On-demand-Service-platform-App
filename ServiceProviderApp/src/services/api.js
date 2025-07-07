import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Ensure this IP address is correct for your Django development server.
// If using an Android emulator, '10.0.2.2' usually maps to your computer's localhost.
// If using a physical device, this needs to be your computer's network IP address.
const API_URL = 'http://10.0.2.2:8000/api'; // FOR ANDROID EMULATOR
// const API_URL = 'http://<YOUR_COMPUTER_IP>:8000/api'; // FOR PHYSICAL DEVICE TESTING

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// User Authentication (shared with UserApp, but specific to provider login context)
export const loginUser = (credentials) => apiClient.post('/users/token/', credentials);
// Registration is assumed to be handled by the main app's registration flow (selecting 'provider' type)
// export const registerProvider = (userData) => apiClient.post('/users/register/', userData); // if separate needed

export const getUserProfile = () => apiClient.get('/users/profile/'); // Generic user details
export const getServiceProviderProfile = () => apiClient.get('/users/provider-profile/'); // Provider specific profile
export const updateServiceProviderProfile = (profileData) => apiClient.put('/users/provider-profile/', profileData);

// Service Categories (Providers might need to list these to tag their services)
export const getServiceCategories = () => apiClient.get('/categories/');

// Services (Providers manage their own services)
export const getMyServices = () => apiClient.get('/services/', { params: { provider_id: 'me' } }); // Assuming backend can filter by 'me' or pass provider_id
export const createService = (serviceData) => apiClient.post('/services/', serviceData);
export const updateService = (serviceId, serviceData) => apiClient.put(`/services/${serviceId}/`, serviceData);
export const deleteService = (serviceId) => apiClient.delete(`/services/${serviceId}/`);
export const getServiceDetails = (id) => apiClient.get(`/services/${id}/`);


// Bookings (Providers view and manage bookings assigned to them)
export const getProviderBookings = () => apiClient.get('/bookings/'); // Backend filters by logged-in provider
export const getBookingDetails = (id) => apiClient.get(`/bookings/${id}/`);
export const updateBookingStatus = (bookingId, statusData) => apiClient.patch(`/bookings/${bookingId}/update_status/`, statusData);
// Providers might not "cancel" in the same way customers do, but might reject or mark as no-show.
// The update_status endpoint should handle 'rejected', 'cancelled_by_provider'.

export default apiClient;
