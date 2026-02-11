import { useState } from 'react';

function QueryInput({ onSubmit, loading }) {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState('natural');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit(question, mode);
    }
  };

  const exampleQueries = [
    "Show all users",
    "Count total records",
    "Find users created in the last week",
    "Show top 10 results by name"
  ];

  const handleExampleClick = (query) => {
    setQuestion(query);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Ask a Question</h2>
      
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('natural')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            mode === 'natural'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Natural Language
        </button>
        <button
          onClick={() => setMode('sql')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            mode === 'sql'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          SQL Query
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={mode === 'natural' 
              ? "Type your question in natural language..." 
              : "Write your SQL query..."}
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !question.trim()}
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

        {/* Example Queries */}
        {mode === 'natural' && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Example queries:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exampleQueries.map((query, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleExampleClick(query)}
                  className="text-left p-2 rounded-lg bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 text-sm transition border border-gray-200 hover:border-indigo-300"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default QueryInput;
