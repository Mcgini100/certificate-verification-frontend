import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Database,
  Lock,
  Eye,
  RefreshCw,
  Clock,
  Hash,
  GitBranch,
  Layers,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  getStatistics, 
  getLedgerStats, 
  getLedgerIntegrity, 
  validateLedgerIntegrity,
  getSystemHealth,
  getLedgerEntries
} from '../../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [ledgerStats, setLedgerStats] = useState(null);
  const [ledgerIntegrity, setLedgerIntegrity] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to safely convert strings to uppercase
  const safeToUpperCase = (str) => (str || '').toUpperCase();

  const fetchDashboardData = async () => {
    try {
      const [
        statisticsData,
        ledgerStatsData,
        integrityData,
        healthData,
        recentTxData
      ] = await Promise.all([
        getStatistics().catch(() => null),
        getLedgerStats().catch(() => null),
        getLedgerIntegrity().catch(() => null),
        getSystemHealth().catch(() => null),
        getLedgerEntries({ limit: 10, offset: 0 }).catch(() => ({ entries: [] }))
      ]);

      // Handle API response structures
      setStats(statisticsData);
      
      // Handle ledgerStats response (API returns {status: "success", stats: {...}})
      setLedgerStats(ledgerStatsData?.stats || ledgerStatsData);
      
      // Handle ledgerIntegrity response (API returns {status: "success", integrity: {...}})
      setLedgerIntegrity(integrityData?.integrity || integrityData);
      
      // Handle systemHealth response (API returns {status: "healthy", ...})
      setSystemHealth(healthData);
      
      // Handle recentTransactions
      setRecentTransactions(recentTxData?.entries || recentTxData || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleValidateLedger = async () => {
    try {
      const result = await validateLedgerIntegrity();
      // Handle response structure {status: "success", integrity: {...}}
      const integrity = result?.integrity || result;
      
      if (integrity?.is_valid) {
        toast.success('Ledger integrity validation passed!');
      } else {
        toast.error('Ledger integrity validation failed!');
      }
      setLedgerIntegrity(integrity);
    } catch (error) {
      toast.error('Failed to validate ledger integrity');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Prepare chart data with safe data handling
  const verificationData = stats?.certificates?.verification_stats ? [
    { name: 'Verified', value: stats.certificates.verification_stats.verified || 0, color: '#10B981' },
    { name: 'Failed', value: stats.certificates.verification_stats.failed || 0, color: '#EF4444' },
    { name: 'Pending', value: stats.certificates.verification_stats.pending || 0, color: '#F59E0B' },
  ] : [];

  const transactionTrends = ledgerStats?.transaction_types ? 
    Object.entries(ledgerStats.transaction_types).map(([type, count]) => ({
      name: safeToUpperCase((type || '').replace('_', ' ')),
      value: count || 0
    })) : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-black">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-black mt-1">
            Certificate verification system with immutable ledger
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleValidateLedger}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Shield className="w-4 h-4" />
            <span>Validate Ledger</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* System Health Alert */}
      {systemHealth && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border-l-4 ${
            systemHealth.status === 'healthy'
              ? 'bg-green-50 border-green-400 text-green-800'
              : systemHealth.status === 'degraded'
              ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
              : 'bg-red-50 border-red-400 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {systemHealth.status === 'healthy' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : systemHealth.status === 'degraded' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">
              System Status: {safeToUpperCase(systemHealth?.status) || 'UNKNOWN'}
            </span>
            {ledgerIntegrity && (
              <span className="text-sm">
                | Ledger Integrity: {ledgerIntegrity.is_valid ? 'VALID' : 'INVALID'}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Certificates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Certificates
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {ledgerStats?.unique_certificates || stats?.certificates?.total_certificates || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">
              {ledgerStats?.active_certificates || stats?.certificates?.recent_uploads || 0} active
            </span>
          </div>
        </motion.div>

        {/* Ledger Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Ledger Transactions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {ledgerStats?.total_entries || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <GitBranch className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Layers className="w-4 h-4 text-purple-500 mr-1" />
            <span className="text-purple-600 dark:text-purple-400">
              Block #{ledgerStats?.last_block_number || 0}
            </span>
          </div>
        </motion.div>

        {/* Verification Success Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Success Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.certificates?.verification_stats 
                  ? Math.round(
                      (stats.certificates.verification_stats.verified / 
                       (stats.certificates.verification_stats.verified + stats.certificates.verification_stats.failed || 1)) * 100
                    )
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Activity className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">
              {stats?.certificates?.verification_stats?.verified || 0} verified
            </span>
          </div>
        </motion.div>

        {/* Ledger Integrity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Ledger Integrity
              </p>
              <p className={`text-2xl font-bold ${
                ledgerIntegrity?.is_valid 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {ledgerIntegrity?.is_valid ? 'VALID' : 'INVALID'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              ledgerIntegrity?.is_valid 
                ? 'bg-green-100 dark:bg-green-900' 
                : 'bg-red-100 dark:bg-red-900'
            }`}>
              <Lock className={`w-6 h-6 ${
                ledgerIntegrity?.is_valid 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Hash className="w-4 h-4 text-gray-500 mr-1" />
            <span className="text-gray-600 dark:text-gray-400">
              {ledgerIntegrity?.unique_certificates || 0} unique certs
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Verification Status Distribution
          </h3>
          <div className="h-64">
            {verificationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verificationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {verificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No verification data available
              </div>
            )}
          </div>
        </motion.div>

        {/* Transaction Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ledger Transaction Types
          </h3>
          <div className="h-64">
            {transactionTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No transaction data available
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Ledger Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Ledger Transactions
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Real-time updates</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Certificate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Block #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => (
                  <tr key={transaction.transaction_id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                      {transaction.transaction_id?.substring(0, 8) || 'N/A'}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.transaction_type === 'CREATE' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : transaction.transaction_type === 'UPDATE'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : transaction.transaction_type === 'VERIFY'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {safeToUpperCase(transaction.transaction_type) || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {transaction.certificate_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      #{transaction.block_number || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {transaction.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Confirmed
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No recent transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Ledger Health Details */}
      {ledgerIntegrity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ledger Health Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Total Entries
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {ledgerIntegrity.total_entries || 0}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Unique Certificates
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {ledgerIntegrity.unique_certificates || 0}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Last Block Hash
                </span>
              </div>
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mt-2 truncate">
                {ledgerIntegrity.last_hash?.substring(0, 16) || 'N/A'}...
              </p>
            </div>
          </div>
          {ledgerIntegrity.transaction_types && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Transaction Distribution:
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ledgerIntegrity.transaction_types).map(([type, count]) => (
                  <span
                    key={type}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {safeToUpperCase(type) || 'UNKNOWN'}: {count || 0}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/admin/upload'}
            className="p-4 text-left bg-blue-50 dark:bg-blue-900 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
          >
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">
              Upload Certificate
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add new certificate to ledger
            </p>
          </button>
          <button
            onClick={() => window.location.href = '/admin/verify'}
            className="p-4 text-left bg-green-50 dark:bg-green-900 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
          >
            <Shield className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">
              Verify Certificate
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verify with ledger check
            </p>
          </button>
          <button
            onClick={() => window.location.href = '/admin/database'}
            className="p-4 text-left bg-purple-50 dark:bg-purple-900 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
          >
            <Database className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">
              Browse Ledger
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Explore certificate history
            </p>
          </button>
          <button
            onClick={handleValidateLedger}
            className="p-4 text-left bg-yellow-50 dark:bg-yellow-900 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-colors"
          >
            <Lock className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">
              Validate Integrity
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Check ledger consistency
            </p>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;