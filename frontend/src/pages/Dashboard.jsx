import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { queryAPI, databaseAPI } from '../services/api';
import QueryInput from '../components/QueryInput';
import ResultsTable from '../components/ResultsTable';
import QueryHistory from '../components/QueryHistory';
import DatasetUpload from '../components/DatasetUpload';
import AIChat from '../components/AIChat';
import Header from '../components/Header';

function Dashboard() {
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [activeTab, setActiveTab] = useState('query'); // 'query', 'upload', 'chat'
  
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    try {
      const response = await databaseAPI.list();
      setDatabases(response.data);
    } catch (error) {
      console.error('Failed to load databases:', error);
    }
  };

  const handleQuerySubmit = async (question, mode = 'natural') => {
    setLoading(true);
    setQueryResult(null);

    try {
      const response = await queryAPI.execute({
        question,
        query_mode: mode,
        database_id: selectedDatabase
      });
      setQueryResult(response.data);
      setRefreshHistory(prev => prev + 1);
    } catch (error) {
      setQueryResult({
        error: error.response?.data?.detail || 'Query execution failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{user?.username}!</span>
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Convert natural language to SQL queries and analyze your data
          </p>
        </div>

        {/* Database Selector */}
        {databases.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📊 Select Database
            </label>
            <select
              value={selectedDatabase || ''}
              onChange={(e) => setSelectedDatabase(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="">Default Database</option>
              {databases.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('query')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'query'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
            }`}
          >
            <span>🔍</span> Query Builder
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
            }`}
          >
            <span>📁</span> Upload Dataset
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
            }`}
          >
            <span>💬</span> AI Assistant
          </button>
        </div>

        {/* Query Tab */}
        {activeTab === 'query' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <QueryInput onSubmit={handleQuerySubmit} loading={loading} />
              
              {queryResult && (
                <ResultsTable result={queryResult} />
              )}
            </div>

            <div className="lg:col-span-1">
              <QueryHistory key={refreshHistory} />
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DatasetUpload onUploadSuccess={loadDatabases} />
              
              {/* Info Cards */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <span>💾</span> Supported Formats
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• CSV (Comma-Separated Values)</li>
                    <li>• JSON (JavaScript Object Notation)</li>
                    <li>• Excel (.xlsx, .xls)</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                    <span>📏</span> File Limits
                  </h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Maximum 10MB per file</li>
                    <li>• Unlimited uploads</li>
                    <li>• Auto-indexed columns</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 sticky top-24">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📊</span> Your Datasets
                </h4>
                {databases.length > 0 ? (
                  <div className="space-y-2">
                    {databases.map((db) => (
                      <div key={db.id} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                        <p className="font-semibold text-indigo-900 text-sm">{db.name}</p>
                        <p className="text-xs text-indigo-600 mt-1">ID: {db.id}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No datasets yet. Upload one to get started!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-96 lg:h-screen lg:sticky lg:top-20">
                <AIChat />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 sticky top-24">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>💡</span> Quick Tips
                </h4>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Ask questions about your data in plain English</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Get SQL query explanations and examples</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Learn SQL best practices and tips</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Debug and optimize your queries</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
