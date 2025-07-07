import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // For navigation after login
import './AdminLoginScreen.css'; // Basic styling

const AdminLoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      await login(email, password);
      navigate('/'); // Navigate to dashboard home on successful login
    } catch (loginError) {
      // Error is already set in AuthContext and displayed
      console.error("Login attempt failed:", loginError.message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Admin Dashboard Login</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setError(null)} // Clear error on focus
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setError(null)} // Clear error on focus
            required
          />
        </div>
        <button type="submit" disabled={isLoading} className="login-button">
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginScreen;
