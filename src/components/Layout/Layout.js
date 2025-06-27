import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Shield, 
  Upload, 
  Database, 
  CheckCircle, 
  User, 
  LogOut,
  Home
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const adminNavItems = [
    { path: '/admin', icon: Home, label: 'Dashboard' },
    { path: '/admin/upload', icon: Upload, label: 'Upload Certificates' },
    { path: '/admin/database', icon: Database, label: 'Database' },
    { path: '/admin/verify', icon: CheckCircle, label: 'Verify' },
  ];

  const userNavItems = [
    { path: '/user', icon: Home, label: 'Dashboard' },
    { path: '/user/verify', icon: CheckCircle, label: 'Verify Certificate' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;

  const isActivePath = (path) => {
    if (path === '/admin' || path === '/user') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-secondary-200 bg-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-secondary-900">CertVerify</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-secondary-100 transition-colors"
          >
            <X className="h-5 w-5 text-secondary-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
                  }
                `}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className="border-t border-secondary-200 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-secondary-200 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-secondary-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 truncate">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-secondary-500 truncate">
                {user?.email || 'admin@admin.com'}
              </p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                user?.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {user?.role || 'admin'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white border-b border-secondary-200 px-4 shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-secondary-100 transition-colors"
            >
              <Menu className="h-6 w-6 text-secondary-600" />
            </button>
            
            <h1 className="ml-2 lg:ml-0 text-lg font-semibold text-secondary-900">
              {navItems.find(item => isActivePath(item.path))?.label || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-block text-sm text-secondary-600">
              Welcome back, {user?.name || 'Admin User'}
            </span>
            <div className="w-8 h-8 bg-secondary-200 rounded-full flex items-center justify-center lg:hidden">
              <User className="h-5 w-5 text-secondary-600" />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;