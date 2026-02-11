import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { queryAPI, databaseAPI } from '../services/api';
import QueryInput from '../components/QueryInput';
import ResultsTable from '../components/ResultsTable';
import QueryHistory from '../components/QueryHistory';
import Header from '../components/Header';

function Dashboard() {
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  
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

  const handleQuerySubmit = async (question) => {
    setLoading(true);
    setQueryResult(null);

    try {
      const response = await queryAPI.execute({
        question,
        database_id: selectedDatabase
      });
      setQueryResult(response.data);
      setRefreshHistory(prev => prev + 1); // Trigger history refresh
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-600 mt-2">
            Ask questions about your data in natural language
          </p>
        </div>

        {databases.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Database
            </label>
            <select
              value={selectedDatabase || ''}
              onChange={(e) => setSelectedDatabase(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      </div>
    </div>
  );
}

export default Dashboard;
