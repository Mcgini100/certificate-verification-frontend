import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/UserDashboard';
import AdminUpload from './pages/admin/AdminUpload';
import AdminDatabase from './pages/admin/AdminDatabase';
import AdminVerify from './pages/admin/AdminVerify';
import UserVerify from './pages/user/UserVerify';
import NotFoundPage from './pages/NotFoundPage';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/user'} /> : <LoginPage />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/user" /> : <SignupPage />} 
        />

        {/* Protected Admin Routes */}
        <Route 
          path="/admin/*" 
          element={
            user && user.role === 'admin' ? (
              <Layout>
                <Routes>
                  <Route index element={<AdminDashboard />} />
                  <Route path="upload" element={<AdminUpload />} />
                  <Route path="database" element={<AdminDatabase />} />
                  <Route path="verify" element={<AdminVerify />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Protected User Routes */}
        <Route 
          path="/user/*" 
          element={
            user && user.role === 'user' ? (
              <Layout>
                <Routes>
                  <Route index element={<UserDashboard />} />
                  <Route path="verify" element={<UserVerify />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;