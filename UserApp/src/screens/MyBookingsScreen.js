import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getUserBookings, cancelBooking } from '../services/api'; // Assuming cancelBooking API exists

const MyBookingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await getUserBookings(); // This fetches bookings for the logged-in user
      setBookings(response.data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to fetch your bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [user]);

  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          onPress: async () => {
            try {
              // Assuming your API endpoint for customer cancellation is setup
              // This might be a PATCH to update status or a specific POST action
              // For this example, using a hypothetical cancelBooking(bookingId) from api.js
              // which maps to `POST /api/bookings/{id}/cancel_booking/`
              await cancelBooking(bookingId);
              Alert.alert("Success", "Booking cancelled successfully.");
              fetchBookings(); // Refresh the list
            } catch (error) {
              console.error('Failed to cancel booking:', error.response?.data || error.message);
              const errorMsg = error.response?.data?.detail || "Could not cancel the booking at this time.";
              Alert.alert("Cancellation Failed", errorMsg);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingItem}>
      <Text style={styles.serviceName}>{item.service?.name || 'Service Not Available'}</Text>
      <Text>Provider: {item.provider_profile?.user?.email || 'N/A'}</Text>
      <Text>Status: <Text style={styles[item.status] || styles.defaultStatus}>{item.status}</Text></Text>
      <Text>Address: {item.address}</Text>
      <Text>Scheduled: {new Date(item.scheduled_time).toLocaleString() || 'Not yet scheduled'}</Text>
      <Text>Requested: {new Date(item.requested_time).toLocaleString()}</Text>
      {item.customer_notes && <Text>Your Notes: {item.customer_notes}</Text>}

      {(item.status === 'pending' || item.status === 'confirmed') && (
         <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(item.id)}>
           <Text style={styles.cancelButtonText}>Cancel Booking</Text>
         </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && !refreshing && bookings.length === 0) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      {bookings.length === 0 && !isLoading ? (
        <Text style={styles.noBookingsText}>You have no bookings yet.</Text>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={!isLoading && <Text style={styles.noBookingsText}>Pull down to refresh or create a new booking.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  noBookingsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: 'grey',
  },
  // Status-specific styles
  pending: { color: 'orange', fontWeight: 'bold' },
  confirmed: { color: 'green', fontWeight: 'bold' },
  in_progress: { color: 'blue', fontWeight: 'bold' },
  completed: { color: 'grey', fontWeight: 'bold' },
  cancelled_by_customer: { color: 'red', textDecorationLine: 'line-through' },
  cancelled_by_provider: { color: 'darkred', textDecorationLine: 'line-through' },
  rejected: { color: 'red', fontWeight: 'bold' },
  defaultStatus: { color: 'black', fontWeight: 'bold' },
  cancelButton: {
    marginTop: 10,
    backgroundColor: 'red',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MyBookingsScreen;
