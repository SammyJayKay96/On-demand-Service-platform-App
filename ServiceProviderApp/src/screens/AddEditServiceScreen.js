import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, ScrollView, Picker } from 'react-native'; // Picker for categories
import { useAuth } from '../contexts/AuthContext';
import { createService, updateService, getServiceDetails, getServiceCategories } from '../services/api';

const AddEditServiceScreen = ({ route, navigation }) => {
  const { serviceId } = route.params || {}; // serviceId will be present if editing
  const { providerProfile } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);

  const [isLoading, setIsLoading] = useState(false); // For loading service details or categories
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch categories for the Picker
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await getServiceCategories();
        setCategories(response.data || []);
        if (response.data?.length > 0 && !serviceId) { // Default to first category if creating new
            // setCategoryId(response.data[0].id); // Or let user pick explicitly
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
        setError("Could not load service categories.");
      }
      setIsLoading(false);
    };
    fetchCategories();
  }, [serviceId]);

  // Fetch service details if editing
  useEffect(() => {
    if (serviceId) {
      const fetchServiceDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await getServiceDetails(serviceId);
          const service = response.data;
          setName(service.name);
          setDescription(service.description);
          setBaseRate(service.base_rate.toString()); // API returns decimal, convert to string for input
          setCategoryId(service.category?.id || null); // service.category is an object
        } catch (e) {
          console.error("Failed to fetch service details", e);
          setError("Could not load service details for editing.");
          Alert.alert("Error", "Failed to load service details.");
        }
        setIsLoading(false);
      };
      fetchServiceDetails();
    }
  }, [serviceId]);

  const handleSubmit = async () => {
    if (!name || !description || !baseRate || !categoryId) {
      Alert.alert('Validation Error', 'Please fill all fields and select a category.');
      return;
    }
    if (!providerProfile) {
        Alert.alert('Error', 'Provider profile not found. Cannot create service.');
        return;
    }

    const serviceData = {
      name,
      description,
      base_rate: parseFloat(baseRate), // Ensure it's a number
      category_id: categoryId,
      // provider_profile_id is set by backend based on authenticated user (provider)
      // or explicitly if API requires: provider_profile_id: providerProfile.id
      // The ServiceSerializer in Django expects provider_profile_id if not inferring from request.user.provider_profile
      // Our current ServiceViewSet `perform_create` sets it from `request.user.provider_profile`
      // and `update` uses the existing instance.
      // However, the serializer itself has 'provider_profile_id' as a write_only PrimaryKeyRelatedField.
      // It's safer to provide it explicitly for the serializer, especially if it's required.
      // But this means the serializer's `validate_provider_profile_id` will run.
      // Let's assume for now the backend handles setting the provider via `perform_create` or `perform_update`.
      // If not, we'd pass: provider_profile_id: providerProfile.id,
    };

    setIsSubmitting(true);
    setError(null);
    try {
      if (serviceId) {
        await updateService(serviceId, serviceData);
        Alert.alert('Success', 'Service updated successfully.');
      } else {
        // When creating, ensure the backend links it to the current provider.
        // The Django ServiceSerializer has a `provider_profile_id` field.
        // If not set by view's perform_create, it must be in serviceData.
        // Let's add it for clarity during creation, assuming the API requires/allows it.
        // If your perform_create in Django's ServiceViewSet correctly assigns provider_profile, this isn't strictly needed.
        // serviceData.provider_profile_id = providerProfile.id; // This might be needed if backend doesn't auto-assign
        await createService(serviceData);
        Alert.alert('Success', 'Service added successfully.');
      }
      navigation.goBack();
    } catch (e) {
      console.error('Failed to save service:', e.response?.data || e.message);
      const errorMsg = e.response?.data ? JSON.stringify(e.response.data) : "An unknown error occurred.";
      setError(`Failed to save service: ${errorMsg}`);
      Alert.alert('Save Failed', `Could not save the service. ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#007bff" style={styles.loader} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{serviceId ? 'Edit Service' : 'Add New Service'}</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.label}>Service Name:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Standard House Cleaning" />

      <Text style={styles.label}>Description:</Text>
      <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Detailed description of the service" multiline />

      <Text style={styles.label}>Base Rate ($):</Text>
      <TextInput style={styles.input} value={baseRate} onChangeText={setBaseRate} placeholder="e.g., 50.00" keyboardType="numeric" />

      <Text style={styles.label}>Service Category:</Text>
      {categories.length > 0 ? (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={categoryId}
            onValueChange={(itemValue) => setCategoryId(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="-- Select a Category --" value={null} />
            {categories.map((cat) => (
              <Picker.Item label={cat.name} value={cat.id} key={cat.id} />
            ))}
          </Picker>
        </View>
      ) : (
        <Text>Loading categories or no categories available...</Text>
      )}


      {isSubmitting ? (
        <ActivityIndicator size="large" color="#007bff" style={{marginTop: 20}}/>
      ) : (
        <Button title={serviceId ? 'Save Changes' : 'Add Service'} onPress={handleSubmit} disabled={isSubmitting} />
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
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default AddEditServiceScreen;
