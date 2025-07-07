import React from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const ProviderHomeScreen = ({ navigation }) => {
  const { user, providerProfile, logout } = useAuth();

  // Simplified home screen for providers.
  // More sophisticated dashboard elements can be added later.

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {providerProfile?.user?.first_name || user?.username || 'Provider'}!</Text>
        <Button title="Logout" onPress={logout} color="red" />
      </View>

      {providerProfile ? (
        <View style={styles.profileSummary}>
          <Text style={styles.profileTitle}>Your Profile</Text>
          <Text>Status: {providerProfile.is_verified ? 'Verified' : 'Pending Verification'}</Text>
          <Text>Bio: {providerProfile.bio || 'Not set'}</Text>
          <Text>Address: {providerProfile.address || 'Not set'}</Text>
          <Button title="Edit My Profile" onPress={() => navigation.navigate('ProfileSetup')} />
        </View>
      ) : (
        <View style={styles.profileWarning}>
          <Text style={styles.warningText}>Your provider profile is not fully set up.</Text>
          <Button title="Set Up My Profile" onPress={() => navigation.navigate('ProfileSetup')} />
        </View>
      )}

      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>Manage Your Business</Text>
        <View style={styles.buttonContainer}>
            <Button title="View My Services" onPress={() => navigation.navigate('MyServices')} />
        </View>
        <View style={styles.buttonContainer}>
            <Button title="View Bookings" onPress={() => navigation.navigate('ProviderBookings')} />
        </View>
        {/* <View style={styles.buttonContainer}>
            <Button title="Earnings" onPress={() => navigation.navigate('EarningsDashboard')} />
        </View> */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  profileSummary: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  profileWarning: {
    padding: 20,
    backgroundColor: '#fff3cd',
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  warningText: {
    color: '#856404',
    fontSize: 16,
    marginBottom: 10,
  },
  menuContainer: {
    padding: 20,
    marginHorizontal: 15,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 15,
  }
});

export default ProviderHomeScreen;
