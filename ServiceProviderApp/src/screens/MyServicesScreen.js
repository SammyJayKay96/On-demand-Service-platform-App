import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getMyServices, deleteService, getServiceCategories } from '../services/api'; // Assuming getMyServices fetches services for the logged-in provider

const MyServicesScreen = ({ navigation }) => {
  const { user, providerProfile } = useAuth(); // Ensure providerProfile is loaded
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyServices = async () => {
    if (!providerProfile) { // Only fetch if provider profile exists
        Alert.alert("Profile Incomplete", "Please complete your provider profile to manage services.");
        // navigation.navigate('ProfileSetup'); // Optionally navigate
        setServices([]); // Clear services if profile is not available
        return;
    }
    setIsLoading(true);
    try {
      // The backend for getMyServices should filter by the authenticated provider automatically.
      // Or, if it needs provider_id, ensure it's passed correctly.
      // For this phase, assuming `/api/services/` (GET) when authenticated as provider returns their services
      // or a specific endpoint like `/api/my-services/` exists.
      // The `api.js` has `getMyServices` which could be `apiClient.get('/services/')`
      // and DRF ViewSet filters by `request.user.provider_profile`.
      const response = await getMyServices();
      setServices(response.data || []);
    } catch (error) {
      console.error('Failed to fetch services:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load your services.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch services when the screen focuses or providerProfile changes
    const unsubscribe = navigation.addListener('focus', () => {
        fetchMyServices();
    });
    return unsubscribe;
  }, [navigation, providerProfile]); // Depend on providerProfile to refetch if it changes (e.g. after setup)

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyServices();
    setRefreshing(false);
  }, [providerProfile]);

  const handleDeleteService = async (serviceId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this service? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteService(serviceId);
              Alert.alert("Success", "Service deleted successfully.");
              fetchMyServices(); // Refresh list
            } catch (error) {
              console.error('Failed to delete service:', error.response?.data || error.message);
              Alert.alert("Delete Failed", "Could not delete the service.");
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const renderServiceItem = ({ item }) => (
    <View style={styles.serviceItem}>
      <Text style={styles.serviceName}>{item.name}</Text>
      <Text>Category: {item.category?.name || 'N/A'}</Text>
      <Text>Description: {item.description}</Text>
      <Text>Base Rate: ${item.base_rate}</Text>
      <View style={styles.actionsContainer}>
        <Button title="Edit" onPress={() => navigation.navigate('AddEditService', { serviceId: item.id })} />
        <View style={{width: 10}} />
        <Button title="Delete" onPress={() => handleDeleteService(item.id)} color="red" />
      </View>
    </View>
  );

  if (!providerProfile && !isLoading) {
    return (
        <View style={styles.centeredMessageContainer}>
            <Text style={styles.centeredMessageText}>Please complete your provider profile to add and manage services.</Text>
            <Button title="Go to Profile Setup" onPress={() => navigation.navigate('ProfileSetup')} />
        </View>
    );
  }

  if (isLoading && !refreshing && services.length === 0) {
    return <ActivityIndicator size="large" color="#007bff" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Button title="Add New Service" onPress={() => navigation.navigate('AddEditService')} />
      {services.length === 0 && !isLoading ? (
        <View style={styles.centeredMessageContainer}>
            <Text style={styles.centeredMessageText}>You haven't added any services yet. Click "Add New Service" to begin.</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          contentContainerStyle={{paddingBottom: 20}}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8f9fa',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    marginTop: 10,
  },
  serviceItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centeredMessageText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'grey',
    marginBottom: 15,
  }
});

export default MyServicesScreen;
