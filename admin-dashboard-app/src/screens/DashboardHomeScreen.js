import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } //, useNavigate
from 'react-router-dom';
import './DashboardHomeScreen.css'; // Basic styling

const DashboardHomeScreen = () => {
  const { adminUser, logout } = useAuth();
  // const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    // Navigation to login screen will be handled by AppRoutes due to adminUser becoming null
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="header-user-info">
          <span>Welcome, {adminUser?.email || 'Admin'}!</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <ul>
          <li><Link to="/admin/users">Manage Users</Link></li>
          <li><Link to="/admin/bookings">Manage Bookings</Link></li>
          <li><Link to="/admin/service-categories">Manage Categories</Link></li>
          {/* Add more links as features are added */}
          {/* <li><Link to="/admin/services">Manage Services</Link></li> */}
          {/* <li><Link to="/admin/settings">Settings</Link></li> */}
        </ul>
      </nav>

      <main className="dashboard-main-content">
        <h2>Overview</h2>
        <p>This is the main dashboard area. Statistics and quick actions will be displayed here.</p>
        {/* Placeholder for future content like stats cards */}
        <div className="stats-cards-container">
            <div className="stat-card">
                <h3>Total Users</h3>
                <p>--</p> {/* Placeholder for actual data */}
            </div>
            <div className="stat-card">
                <h3>Total Bookings</h3>
                <p>--</p> {/* Placeholder for actual data */}
            </div>
            <div className="stat-card">
                <h3>Pending Verifications</h3>
                <p>--</p> {/* Placeholder for actual data */}
            </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardHomeScreen;
