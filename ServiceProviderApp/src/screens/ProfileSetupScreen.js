import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getServiceProviderProfile, updateServiceProviderProfile } from '../services/api';

const ProfileSetupScreen = ({ navigation }) => {
  const { providerProfile, refreshProviderProfile, isLoading: authLoading, error: authError, setError } = useAuth();
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(''); // e.g. "lat,long" or city
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenLoading, setScreenLoading] = useState(false); // For initial load of profile

  useEffect(() => {
    if (providerProfile) {
      setBio(providerProfile.bio || '');
      setAddress(providerProfile.address || '');
      setLocation(providerProfile.location || '');
    } else {
      // If profile is null and not authLoading, try to fetch it once,
      // as it might not have been loaded if user navigated here quickly.
      // The AuthContext already tries to load it. This is an additional safeguard or manual refresh trigger.
      // For this phase, we primarily rely on AuthContext's loading.
      // If providerProfile is consistently null here, it implies it needs creation/setup.
      // The `updateServiceProviderProfile` should handle create if backend uses `update_or_create`.
      // Django `RetrieveUpdateAPIView` with PUT might create if `get_object` allows it or is overridden.
      // For now, we assume PUT to `/api/users/provider-profile/` will update or create.
    }
  }, [providerProfile]);


  const handleSaveProfile = async () => {
    setError(null); // Clear previous errors
    if (!bio || !address) { // Basic validation
      Alert.alert('Error', 'Please fill in at least Bio and Address.');
      return;
    }

    const profileData = {
      bio,
      address,
      location,
      // is_verified is usually handled by admin
    };

    setIsSubmitting(true);
    try {
      await updateServiceProviderProfile(profileData);
      await refreshProviderProfile(); // Refresh AuthContext state
      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack(); // Or navigate to Home
    } catch (e) {
      console.error('Failed to update profile:', e.response?.data || e.message);
      const errorMsg = e.response?.data ? JSON.stringify(e.response.data) : e.message;
      setError(`Failed to update profile: ${errorMsg}`); // Show error in screen or via AuthContext
      Alert.alert('Update Failed', `Could not update profile. ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || screenLoading) {
    return <ActivityIndicator size="large" color="#007bff" style={styles.loader} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Setup Your Provider Profile</Text>
      {authError && <Text style={styles.errorText}>{authError}</Text>}

      <Text style={styles.label}>Biography / About You</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Tell customers about yourself and your experience."
        value={bio}
        onChangeText={setBio}
        multiline
        onFocus={() => setError(null)}
      />

      <Text style={styles.label}>Primary Address / Service Area</Text>
      <TextInput
        style={styles.input}
        placeholder="Your business address or main service area"
        value={address}
        onChangeText={setAddress}
        onFocus={() => setError(null)}
      />

      <Text style={styles.label}>Location (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., City, State or Latitude,Longitude"
        value={location}
        onChangeText={setLocation}
        onFocus={() => setError(null)}
      />

      {/* Add fields for experience, certifications later if needed */}
      {/* These might be separate models or JSON fields in the profile */}

      {isSubmitting ? (
        <ActivityIndicator size="large" color="#007bff" style={{marginTop: 20}} />
      ) : (
        <Button title="Save Profile" onPress={handleSaveProfile} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top', // for Android
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default ProfileSetupScreen;
