import { useState, useEffect } from 'react';
import { queryAPI } from '../services/api';

function QueryHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await queryAPI.getHistory(20);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Query History</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Query History</h3>
      
      {history.length === 0 ? (
        <p className="text-gray-500">No queries yet</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {history.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <p className="text-sm font-medium text-gray-900 mb-2">
                {item.question}
              </p>
              
              {item.sql_query && (
                <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded block mb-2 overflow-x-auto">
                  {item.sql_query}
                </code>
              )}
              
              {item.error_message && (
                <p className="text-xs text-red-600 mb-2">
                  Error: {item.error_message}
                </p>
              )}
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{formatDate(item.created_at)}</span>
                {item.execution_time && (
                  <span>{item.execution_time.toFixed(3)}s</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QueryHistory;
