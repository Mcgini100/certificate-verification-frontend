import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <Shield className="h-10 w-10 text-primary-600" />
            <span className="text-2xl font-bold text-secondary-900">CertVerify</span>
          </div>

          {/* 404 Error */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
            <h2 className="text-2xl font-bold text-secondary-900 mb-2">
              Page Not Found
            </h2>
            <p className="text-secondary-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              to="/"
              className="btn-primary w-full flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="btn-secondary w-full flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>

          {/* Helpful Links */}
          <div className="mt-8 pt-8 border-t border-secondary-200">
            <p className="text-sm text-secondary-500 mb-4">
              Need help? Try these links:
            </p>
            <div className="space-y-2">
              <Link
                to="/login"
                className="block text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                Login to your account
              </Link>
              <Link
                to="/signup"
                className="block text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                Create new account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;