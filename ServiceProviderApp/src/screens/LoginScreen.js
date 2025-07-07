import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, setError } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    try {
      await login(email, password);
      // Navigation to the main part of the app will be handled by AppNavigator
      // based on user & providerProfile state.
    } catch (e) {
      // Error is already set in AuthContext and displayed.
      // Alert.alert('Login Failed', e.message); // Can be redundant
    }
  };

  // Providers register through the main app/website or a unified registration form.
  // So, no direct "Register" button here, or it could link externally if needed.

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Service Provider Login</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        onFocus={() => setError(null)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        onFocus={() => setError(null)}
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
      {/* Optionally, add a link to the main registration page if applicable */}
      {/* <Button title="Need an account? Register as Provider" onPress={() => { /* Navigate or link * /}} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
  },
});

export default LoginScreen;
