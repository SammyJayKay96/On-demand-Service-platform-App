import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getServiceCategories, getServices } from '../services/api'; // Assuming getServices can fetch providers too or you have another method

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [providers, setProviders] = useState([]); // Or services, depending on what you want to show
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await getServiceCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // TODO: Show error to user
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchServicesByCategoryId = async (categoryId) => {
    if (!categoryId) return;
    try {
      setIsLoadingProviders(true);
      // Assuming getServices can be filtered by category to show relevant services/providers
      const response = await getServices({ category_id: categoryId });
      // The response might be a list of services. You might need to extract unique providers from this
      // or adjust the backend to return providers for a category.
      // For now, let's assume it returns services, and we list them.
      // Or, if your /api/services endpoint returns services with provider info nested:
      setProviders(response.data); // This would be a list of Service objects
    } catch (error) {
      console.error('Failed to fetch services/providers for category:', error);
      // TODO: Show error to user
    } finally {
      setIsLoadingProviders(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchServicesByCategoryId(selectedCategory.id);
    } else {
      setProviders([]); // Clear providers if no category is selected
    }
  }, [selectedCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCategories();
    if (selectedCategory) {
      await fetchServicesByCategoryId(selectedCategory.id);
    }
    setRefreshing(false);
  }, [selectedCategory]);

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryItem, selectedCategory?.id === item.id && styles.selectedCategoryItem]}
      onPress={() => handleSelectCategory(item)}
    >
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProviderItem = ({ item }) => ( // item here is a Service object
    <TouchableOpacity
      style={styles.providerItem}
      onPress={() => navigation.navigate('BookingScreen', { serviceId: item.id, providerProfile: item.provider_profile })} // Pass service ID and provider info
    >
      <Text style={styles.providerName}>{item.name}</Text>
      <Text>Provider: {item.provider_email}</Text>
      <Text>Rate: ${item.base_rate}</Text>
      {/* Display more service/provider details here */}
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user?.username || 'User'}!</Text>
        <Button title="Logout" onPress={logout} color="red"/>
      </View>
      <Button title="View My Bookings" onPress={() => navigation.navigate('MyBookings')} />

      <Text style={styles.subTitle}>Service Categories</Text>
      {isLoadingCategories ? <ActivityIndicator /> : (
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryList}
        />
      )}

      {selectedCategory && (
        <>
          <Text style={styles.subTitle}>Available Services for {selectedCategory.name}</Text>
          {isLoadingProviders ? <ActivityIndicator /> : providers.length > 0 ? (
            <FlatList
              data={providers}
              renderItem={renderProviderItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.providerList}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          ) : (
            <Text style={styles.noProvidersText}>No services found for this category.</Text>
          )}
        </>
      )}
      {!selectedCategory && !isLoadingCategories && (
         <Text style={styles.noProvidersText}>Select a category to see services.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  categoryList: {
    maxHeight: 60,
  },
  categoryItem: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
    height: 40,
    justifyContent: 'center',
  },
  selectedCategoryItem: {
    backgroundColor: '#007bff',
  },
  categoryText: {
    fontSize: 14,
  },
  providerList: {
    flex: 1, // Ensure it takes remaining space
  },
  providerItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noProvidersText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'grey'
  }
});

export default HomeScreen;
