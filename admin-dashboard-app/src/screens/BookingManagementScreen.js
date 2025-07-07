import React, { useEffect, useState } from 'react';
import { getAllBookings } from '../services/api'; // Admin endpoint for all bookings
import './DashboardHomeScreen.css'; // Reuse some common styles

const BookingManagementScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // TODO: Add filtering options (by status, date range, user, provider)

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // This endpoint needs to be admin-protected and return all bookings.
        const response = await getAllBookings();
        setBookings(response.data.results || response.data); // Handle paginated or non-paginated
      } catch (e) {
        console.error("Failed to fetch bookings:", e.response?.data || e.message);
        setError("Could not load bookings. Ensure you are logged in as an admin.");
      }
      setIsLoading(false);
    };
    fetchBookings();
  }, []);

  // Placeholder for actions
  const handleViewBookingDetails = (bookingId) => {
    console.log("View details for booking:", bookingId);
    // Navigate to a booking detail page or open a modal
  };

  const handleUpdateBooking = (bookingId) => {
    console.log("Update booking:", bookingId);
    // Navigate to an edit booking page or open a modal
  };


  if (isLoading) {
    return <p className="loading-message">Loading bookings...</p>;
  }

  if (error) {
    return <p className="error-message-component">{error}</p>;
  }

  return (
    <div className="dashboard-main-content">
      <h2>Booking Management</h2>
      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Provider</th>
              <th>Service</th>
              <th>Status</th>
              <th>Scheduled Time</th>
              <th>Address</th>
              <th>Requested Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>{booking.customer?.email || 'N/A'}</td>
                <td>{booking.provider_profile?.user?.email || 'N/A'}</td>
                <td>{booking.service?.name || 'N/A'}</td>
                <td style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{booking.status.replace(/_/g, ' ')}</td>
                <td>{booking.scheduled_time ? new Date(booking.scheduled_time).toLocaleString() : 'ASAP/Unscheduled'}</td>
                <td>{booking.address}</td>
                <td>{new Date(booking.requested_time).toLocaleString()}</td>
                <td>
                  <button className="edit-button" onClick={() => handleViewBookingDetails(booking.id)}>Details</button>
                  {/* <button className="edit-button" onClick={() => handleUpdateBooking(booking.id)}>Edit</button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BookingManagementScreen;
