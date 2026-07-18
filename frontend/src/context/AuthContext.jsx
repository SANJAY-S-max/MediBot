import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('medibot_token') || '');
  const [loading, setLoading] = useState(true);

  // Set API base URL based on environment or vite.config
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/auth/me`);
      setUser(res.data);
    } catch (err) {
      console.error('Error fetching current user profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { access_token, name, role } = res.data;
      localStorage.setItem('medibot_token', access_token);
      setToken(access_token);
      return { success: true, role };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Authentication failed. Please check credentials.';
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    try {
      await axios.post(`${API_URL}/auth/register`, userData);
      // Auto login after patient registration
      return await login(userData.email, userData.password);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Email might be in use.';
      return { success: false, error: msg };
    }
  };

  const registerDoctor = async (userData, doctorProfileData) => {
    try {
      await axios.post(`${API_URL}/auth/register/doctor`, {
        ...userData,
        ...doctorProfileData
      });
      return { success: true, pendingApproval: true };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Doctor registration failed.';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('medibot_token');
    setToken('');
    setUser(null);
    setLoading(false);
  };

  const updateProfile = async (profileData) => {
    try {
      // Metada update
      const res = await axios.put(`${API_URL}/auth/me`, profileData);
      setUser(res.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Update profile failed.' };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    registerDoctor,
    logout,
    updateProfile,
    API_URL
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
