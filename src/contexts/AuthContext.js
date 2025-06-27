import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Simulate API call - replace with actual API
      // For demo purposes, we'll use mock authentication
      let mockUser = null;
      
      // Mock admin login
      if (email === 'admin@admin.com' && password === 'admin123') {
        mockUser = {
          id: 1,
          email: 'admin@admin.com',
          name: 'Admin User',
          role: 'admin'
        };
      }
      // Mock user login
      else if (email === 'user@user.com' && password === 'user123') {
        mockUser = {
          id: 2,
          email: 'user@user.com',
          name: 'Regular User',
          role: 'user'
        };
      }
      // Allow any user signup as regular user
      else if (email && password) {
        mockUser = {
          id: Date.now(),
          email,
          name: email.split('@')[0],
          role: 'user'
        };
      }

      if (mockUser) {
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        toast.success(`Welcome back, ${mockUser.name}!`);
        return { success: true, user: mockUser };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true);
      
      // Simulate API call - replace with actual API
      const newUser = {
        id: Date.now(),
        email: userData.email,
        name: userData.name,
        role: 'user' // Regular users by default
      };

      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      toast.success(`Welcome, ${newUser.name}! Your account has been created.`);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};