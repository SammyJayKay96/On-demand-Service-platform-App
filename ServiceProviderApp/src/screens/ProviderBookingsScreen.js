import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, Button, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getProviderBookings, updateBookingStatus } from '../services/api';

const ProviderBookingsScreen = ({ navigation }) => {
  const { user, providerProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'pending', 'confirmed', 'in_progress', 'completed', 'all'

  const fetchBookings = async () => {
    if (!providerProfile) {
        setBookings([]);
        return;
    }
    setIsLoading(true);
    try {
      // Backend should filter bookings for the logged-in provider.
      // We can add client-side filtering or ask backend to filter by status too.
      const response = await getProviderBookings();
      let fetchedBookings = response.data || [];
      if (filter !== 'all') {
        fetchedBookings = fetchedBookings.filter(b => b.status === filter);
      }
      setBookings(fetchedBookings);
    } catch (error) {
      console.error('Failed to fetch provider bookings:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load your bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch bookings when the screen focuses or providerProfile/filter changes
    const unsubscribe = navigation.addListener('focus', () => {
        fetchBookings();
    });
     // Also fetch when filter changes
    fetchBookings();
    return unsubscribe;
  }, [providerProfile, filter, navigation]);


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [providerProfile, filter]);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    Alert.alert(
        `Confirm ${newStatus}`,
        `Are you sure you want to mark this booking as "${newStatus}"?`,
        [
            {text: "Cancel", style: "cancel"},
            {
                text: "Confirm",
                onPress: async () => {
                    try {
                        await updateBookingStatus(bookingId, { status: newStatus });
                        Alert.alert('Success', `Booking status updated to ${newStatus}.`);
                        fetchBookings(); // Refresh list
                    } catch (error) {
                        console.error('Failed to update booking status:', error.response?.data || error.message);
                        const errorMsg = error.response?.data?.detail || `Could not update status.`;
                        Alert.alert('Update Failed', errorMsg);
                    }
                }
            }
        ]
    )
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingItem}>
      <Text style={styles.serviceName}>{item.service?.name || 'Service N/A'}</Text>
      <Text>Customer: {item.customer?.email || 'N/A'}</Text>
      <Text>Address: {item.address}</Text>
      <Text>Scheduled: {new Date(item.scheduled_time).toLocaleString() || 'Not yet scheduled'}</Text>
      <Text>Status: <Text style={styles[item.status] || styles.defaultStatus}>{item.status.replace(/_/g, ' ').toUpperCase()}</Text></Text>
      {item.customer_notes && <Text>Customer Notes: {item.customer_notes}</Text>}

      {/* Actions based on status */}
      {item.status === 'pending' && (
        <View style={styles.actionsContainer}>
          <Button title="Accept" onPress={() => handleUpdateStatus(item.id, 'confirmed')} color="green" />
          <View style={{width:10}}/>
          <Button title="Reject" onPress={() => handleUpdateStatus(item.id, 'rejected')} color="red" />
        </View>
      )}
      {item.status === 'confirmed' && (
        <View style={styles.actionsContainer}>
          <Button title="Start Work" onPress={() => handleUpdateStatus(item.id, 'in_progress')} color="orange"/>
          <View style={{width:10}}/>
          <Button title="Cancel Booking" onPress={() => handleUpdateStatus(item.id, 'cancelled_by_provider')} color="red" />
        </View>
      )}
      {item.status === 'in_progress' && (
         <View style={styles.actionsContainer}>
            <Button title="Mark Completed" onPress={() => handleUpdateStatus(item.id, 'completed')} color="blue"/>
         </View>
      )}
    </View>
  );

  const FilterButton = ({ title, statusFilter }) => (
    <TouchableOpacity
        style={[styles.filterButton, filter === statusFilter && styles.activeFilterButton]}
        onPress={() => setFilter(statusFilter)}
    >
        <Text style={[styles.filterButtonText, filter === statusFilter && styles.activeFilterButtonText]}>{title}</Text>
    </TouchableOpacity>
  );

  if (!providerProfile && !isLoading) {
    return (
        <View style={styles.centeredMessageContainer}>
            <Text style={styles.centeredMessageText}>Please complete your provider profile to view bookings.</Text>
            <Button title="Go to Profile Setup" onPress={() => navigation.navigate('ProfileSetup')} />
        </View>
    );
  }

  if (isLoading && !refreshing && bookings.length === 0) {
    return <ActivityIndicator size="large" color="#007bff" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
        <View style={styles.filterContainer}>
            <FilterButton title="Pending" statusFilter="pending" />
            <FilterButton title="Confirmed" statusFilter="confirmed" />
            <FilterButton title="In Progress" statusFilter="in_progress" />
            <FilterButton title="Completed" statusFilter="completed" />
            <FilterButton title="All" statusFilter="all" />
        </View>

      {bookings.length === 0 && !isLoading ? (
         <View style={styles.centeredMessageContainer}>
            <Text style={styles.centeredMessageText}>No {filter !== 'all' ? filter : ''} bookings found.</Text>
         </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#e9ecef'
  },
  activeFilterButton: {
    backgroundColor: '#007bff'
  },
  filterButtonText: {
    color: '#007bff',
    fontWeight: '500'
  },
  activeFilterButtonText: {
    color: '#fff'
  },
  bookingItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
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
  },
  // Status-specific styles (can be expanded)
  pending: { color: 'orange', fontWeight: 'bold' },
  confirmed: { color: 'green', fontWeight: 'bold' },
  in_progress: { color: 'blue', fontWeight: 'bold' },
  completed: { color: 'grey', fontWeight: 'bold' },
  cancelled_by_customer: { color: 'red', textDecorationLine: 'line-through' },
  cancelled_by_provider: { color: 'darkred', textDecorationLine: 'line-through' },
  rejected: { color: 'red', fontWeight: 'bold' },
  defaultStatus: { color: 'black', fontWeight: 'bold' },
});

export default ProviderBookingsScreen;
