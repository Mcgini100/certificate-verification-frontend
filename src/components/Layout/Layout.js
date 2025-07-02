import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Upload, 
  Database, 
  CheckCircle, 
  User, 
  LogOut,
  Home
} from 'lucide-react';

// CertVerify Logo Component
const CertVerifyLogo = ({ size = 40 }) => {
  return (
    <div 
      className="bg-primary-600 rounded-lg flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg 
        width={size * 0.6} 
        height={size * 0.6} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield shape */}
        <path
          d="M12 2L3 7V12C3 17.55 6.84 22.74 12 23C17.16 22.74 21 17.55 21 12V7L12 2Z"
          fill="white"
          fillOpacity="0.9"
        />
        {/* Checkmark */}
        <path
          d="M9 12L11 14L15 10"
          stroke="#2563EB"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

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
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        {/* Sidebar Header with New Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-secondary-200 bg-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <CertVerifyLogo size={40} />
            <span className="text-xl font-bold text-secondary-900">CertVerify</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-secondary-100 transition-colors"
          >
            <X className="h-5 w-5 text-secondary-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
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
                  w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
                  }
                `}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-secondary-500 group-hover:text-secondary-700'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className="border-t border-secondary-200 p-4 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-secondary-200 rounded-full flex items-center justify-center">
                <User className="h-7 w-7 text-secondary-600" />
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
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white border-b border-secondary-200 px-4 shadow-sm lg:px-6">
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
        <main className="flex-1 overflow-auto">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;