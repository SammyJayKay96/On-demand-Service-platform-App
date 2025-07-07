import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
// Import other screens for logged-in users here
// e.g., ProfileScreen, ServiceDetailScreen, etc.

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
  </Stack.Navigator>
);

const MainAppStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'HandyMan Services' }} />
    <Stack.Screen name="BookingScreen" component={BookingScreen} options={{ title: 'Create Booking' }} />
    <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
    {/* Add other screens for authenticated users here */}
    {/* <Stack.Screen name="Profile" component={ProfileScreen} /> */}
    {/* <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} /> */}
  </Stack.Navigator>
);


const AppNavigator = () => {
  const { user, isLoading } = useAuth(); // Get user state and loading status

  // TODO: Could add a loading spinner screen here while isLoading is true
  // if (isLoading) {
  //   return <LoadingScreen />; // A simple screen with an ActivityIndicator
  // }

  return (
    <NavigationContainer>
      {user ? <MainAppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
