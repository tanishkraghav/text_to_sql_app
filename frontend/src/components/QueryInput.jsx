import { useState } from 'react';

function QueryInput({ onSubmit, loading }) {
  const [query, setQuery] = useState('');
  const [queryMode, setQueryMode] = useState('natural'); // 'natural' or 'sql'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query, queryMode);
      setQuery('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>🔍</span> Query Builder
      </h3>

      {/* Mode Selector */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setQueryMode('natural')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
            queryMode === 'natural'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>💬</span> Natural Language
        </button>
        <button
          onClick={() => setQueryMode('sql')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
            queryMode === 'sql'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>⚙️</span> SQL
        </button>
      </div>

      {/* Query Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {queryMode === 'natural' ? 'Ask a question' : 'Enter SQL Query'}
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              queryMode === 'natural'
                ? 'e.g., Show me the total sales by month'
                : 'e.g., SELECT * FROM users WHERE age > 18;'
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-32 font-mono text-sm"
          />
        </div>

        {/* Example Queries */}
        {queryMode === 'natural' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-900 mb-2">💡 Try these examples:</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setQuery('Show me the top 10 customers by revenue')}
                className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 rounded transition text-xs"
              >
                • Top 10 customers by revenue
              </button>
              <button
                type="button"
                onClick={() => setQuery('How many orders were placed in the last 30 days?')}
                className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 rounded transition text-xs"
              >
                • Orders in last 30 days
              </button>
              <button
                type="button"
                onClick={() => setQuery('Average order value by product category')}
                className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 rounded transition text-xs"
              >
                • Average order value by category
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span> Executing...
            </>
          ) : (
            <>
              <span>▶</span> Execute Query
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default QueryInput;
              Executing...
            </span>
          ) : (
            'Run Query'
          )}
        </button>
      </form>

      <div className="mt-6">
        <p className="text-sm text-gray-600 mb-3">Example queries:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(query)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QueryInput;
