import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { createBooking } from '../services/api';

// This screen is for creating a new booking for a specific service.
// It would be navigated to from a service detail or provider profile screen.
const BookingScreen = ({ route, navigation }) => {
  const { serviceId, providerProfile } = route.params; // Expect serviceId and providerProfile to be passed
  const { user, isLoading: authLoading } = useAuth(); // Use auth context for user details and token

  const [address, setAddress] = useState('');
  const [scheduledTime, setScheduledTime] = useState(''); // Could use a DateTimePicker
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBooking = async () => {
    if (!serviceId || !user) {
      Alert.alert('Error', 'Service information or user not found.');
      return;
    }
    if (!address) {
      Alert.alert('Error', 'Please enter the service address.');
      return;
    }
    // Basic validation for scheduledTime - can be improved
    if (!scheduledTime) {
        Alert.alert('Error', 'Please enter a preferred time (e.g., YYYY-MM-DD HH:MM).');
        return;
    }

    const bookingData = {
      service_id: serviceId,
      customer_id: user.id, // Backend should take the authenticated user, but good to be explicit if API allows
      address: address,
      // Django backend expects datetime in ISO format e.g. "2024-01-01T10:00:00Z" or "2024-01-01 10:00"
      // For simplicity, we'll let user input a string. A date picker would be better.
      scheduled_time: scheduledTime,
      customer_notes: customerNotes,
      // provider_profile_id will be derived by the backend from the service_id
    };

    setIsSubmitting(true);
    try {
      await createBooking(bookingData);
      Alert.alert('Booking Successful', 'Your booking request has been submitted.');
      navigation.navigate('MyBookings'); // Or back to home/service list
    } catch (error) {
      console.error('Failed to create booking:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Failed to create booking. Please try again.';
      Alert.alert('Booking Failed', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Book Service</Text>
      {/* Display service and provider info if available */}
      {providerProfile && <Text style={styles.providerInfo}>Provider: {providerProfile.user.email}</Text>}
      <Text style={styles.label}>Service Address:</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Address for Service"
        value={address}
        onChangeText={setAddress}
        multiline
      />
      <Text style={styles.label}>Preferred Date & Time:</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD HH:MM (e.g., 2024-08-15 14:30)"
        value={scheduledTime}
        onChangeText={setScheduledTime}
      />
      {/* Consider using a DateTimePicker component here for better UX */}

      <Text style={styles.label}>Notes for Provider (Optional):</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Any specific requests or details..."
        value={customerNotes}
        onChangeText={setCustomerNotes}
        multiline
      />

      {isSubmitting ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Request Booking" onPress={handleCreateBooking} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  providerInfo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    color: 'gray',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top', // For Android
  },
});

export default BookingScreen;
