import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext'; // Assuming register might be added to AuthContext

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [userType, setUserType] = useState('customer'); // Default to 'customer'
  // Add other fields like first_name, last_name, phone_number if needed for registration form

  const { register, isLoading, error, setError } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !password || !password2) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    if (password !== password2) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    const userData = {
      username,
      email,
      password,
      password2,
      user_type: userType, // Ensure backend expects 'user_type'
    };

    try {
      await register(userData);
      Alert.alert('Registration Successful', 'You can now login with your credentials.');
      navigation.navigate('Login');
    } catch (e) {
      // Error is set in AuthContext, specific alerts can be here if needed
      // Alert.alert('Registration Failed', e.message); // Error shown globally or dedicated component
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        onFocus={() => setError(null)}
      />
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
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={password2}
        onChangeText={setPassword2}
        secureTextEntry
        onFocus={() => setError(null)}
      />

      {/* Basic User Type Picker - Can be improved with a proper Picker component */}
      <Text style={styles.label}>I am a:</Text>
      <View style={styles.userTypeContainer}>
        <Button title="Customer" onPress={() => setUserType('customer')} color={userType === 'customer' ? '#007bff' : 'grey'} />
        <Button title="Service Provider" onPress={() => setUserType('provider')} color={userType === 'provider' ? '#007bff' : 'grey'} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Register" onPress={handleRegister} />
      )}
      <Button
        title="Already have an account? Login"
        onPress={() => navigation.navigate('Login')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  userTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  }
});

export default RegisterScreen;
