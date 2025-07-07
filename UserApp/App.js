import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { LogBox } from 'react-native';

// Optional: Ignore specific warnings if they are known and non-critical
// LogBox.ignoreLogs(['Setting a timer']); // Example

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
