import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../services/api'; // Assuming an admin endpoint
import './DashboardHomeScreen.css'; // Reuse some common styles

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // This endpoint needs to be admin-protected and return all users.
        // The current `/api/users/` in Django might need adjustment or a new admin-specific one.
        // For now, we assume `getAllUsers` points to a suitable endpoint.
        const response = await getAllUsers();
        setUsers(response.data.results || response.data); // Handle paginated or non-paginated response
      } catch (e) {
        console.error("Failed to fetch users:", e.response?.data || e.message);
        setError("Could not load users. Ensure you are logged in as an admin and the API is configured for admin access.");
      }
      setIsLoading(false);
    };
    fetchUsers();
  }, []);

  // Placeholder for actions like edit, delete, verify provider
  const handleEditUser = (userId) => {
    console.log("Edit user:", userId);
    // Navigate to an edit user page or open a modal
  };

  const handleDeleteUser = (userId) => {
    console.log("Delete user:", userId);
    // Implement delete functionality with confirmation
  };

  const handleVerifyProvider = (userId) => {
    console.log("Verify provider associated with user:", userId);
    // This would typically involve fetching the ServiceProviderProfile related to the user
    // and then calling an API to mark it as verified.
  };


  if (isLoading) {
    return <p className="loading-message">Loading users...</p>;
  }

  if (error) {
    return <p className="error-message-component">{error}</p>;
  }

  return (
    <div className="dashboard-main-content">
      <h2>User Management</h2>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Username</th>
              <th>User Type</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Phone</th>
              <th>Is Staff</th>
              <th>Is Active</th>
              <th>Date Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>{user.user_type}</td>
                <td>{user.first_name || '-'}</td>
                <td>{user.last_name || '-'}</td>
                <td>{user.phone_number || '-'}</td>
                <td>{user.is_staff ? 'Yes' : 'No'}</td>
                <td>{user.is_active ? 'Yes' : 'No'}</td>
                <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                <td>
                  <button className="edit-button" onClick={() => handleEditUser(user.id)}>Edit</button>
                  {user.user_type === 'provider' && (
                    <button className="verify-button" onClick={() => handleVerifyProvider(user.id)}>
                      {/* Check ServiceProviderProfile's is_verified status here if available directly on user or fetched separately */}
                      Verify Provider
                    </button>
                  )}
                  {/* <button className="delete-button" onClick={() => handleDeleteUser(user.id)}>Delete</button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagementScreen;
