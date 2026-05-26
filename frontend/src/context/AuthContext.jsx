import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const API_BASE = 'http://localhost:5050/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('growth_token') || null);

  // Parse JWT token helper (no npm jwt-decode needed)
  const decodeToken = (t) => {
    try {
      const base64Url = t.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding token', e);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        // Verify token expiration
        const decoded = decodeToken(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          // Token is valid, load profile
          try {
            const res = await fetch(`${API_BASE}/auth/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              setUser({ ...data, token });
            } else {
              // Token invalid on server
              logout();
            }
          } catch (e) {
            console.error('Failed to fetch profile', e);
            // Offline fallback if server is down (keep token but alert console)
            setUser({ _id: decoded.id, name: 'User (Offline Mode)', email: '' });
          }
        } else {
          // Token expired
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }
    localStorage.setItem('growth_token', data.token);
    setToken(data.token);
    setUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    localStorage.setItem('growth_token', data.token);
    setToken(data.token);
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('growth_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }
    setUser((prev) => ({ ...prev, ...data }));
    return data;
  };

  // Helper fetch method with JWT headers
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });
    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in.');
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
