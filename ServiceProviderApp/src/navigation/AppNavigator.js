import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import ProviderHomeScreen from '../screens/ProviderHomeScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import MyServicesScreen from '../screens/MyServicesScreen';
import AddEditServiceScreen from '../screens/AddEditServiceScreen';
import ProviderBookingsScreen from '../screens/ProviderBookingsScreen';
// Import other provider-specific screens here

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    {/* Providers register via the main app/website, so no register screen here unless specifically designed */}
  </Stack.Navigator>
);

const MainAppStack = () => (
  <Stack.Navigator initialRouteName="ProviderHome">
    <Stack.Screen name="ProviderHome" component={ProviderHomeScreen} options={{ title: 'Provider Dashboard' }} />
    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ title: 'Manage Profile' }} />
    <Stack.Screen name="MyServices" component={MyServicesScreen} options={{ title: 'My Services' }} />
    <Stack.Screen name="AddEditService" component={AddEditServiceScreen} />
    {/* Title for AddEditService can be set dynamically in the screen options based on route.params */}
    <Stack.Screen name="ProviderBookings" component={ProviderBookingsScreen} options={{ title: 'Manage Bookings' }} />
    {/* <Stack.Screen name="EarningsDashboard" component={EarningsDashboardScreen} options={{ title: 'My Earnings' }} /> */}
  </Stack.Navigator>
);

const LoadingScreen = () => (
    <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
    </View>
);

const AppNavigator = () => {
  const { user, providerProfile, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is logged in (token exists) but providerProfile is null,
  // it might mean they are a provider but haven't completed profile setup.
  // The ProfileSetupScreen can be the initial route in this case, or ProviderHome can guide them.
  // For simplicity, ProviderHome will handle guiding to ProfileSetup if providerProfile is null.

  return (
    <NavigationContainer>
      {user && user.user_type === 'provider' ? <MainAppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default AppNavigator;
