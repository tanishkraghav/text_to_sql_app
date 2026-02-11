function ResultsTable({ result }) {
  if (!result) return null;

  if (result.error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
          <span className="text-2xl">❌</span>
          <div>
            <p className="font-semibold">Error executing query</p>
            <p className="text-sm mt-1">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const data = result.results || result.data || [];
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">📭 No results found</p>
          <p className="text-gray-400 text-sm mt-2">Try a different query</p>
        </div>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* SQL Query Display */}
      {result.sql_query && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">Generated SQL:</p>
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap break-words">
            {result.sql_query}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span>📊</span> Query Results ({data.length} rows)
        </h3>
        {result.execution_time && (
          <p className="text-indigo-100 text-sm mt-1">⚡ Executed in {result.execution_time.toFixed(3)}s</p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-indigo-50 transition"
              >
                {columns.map((col) => (
                  <td
                    key={`${idx}-${col}`}
                    className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap max-w-xs truncate"
                  >
                    {typeof row[col] === 'object'
                      ? JSON.stringify(row[col])
                      : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-600">
        <span>Total records: <span className="font-semibold">{data.length}</span></span>
      </div>
    </div>
  );
}

export default ResultsTable;
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(result.results[0]).map((key) => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.results.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.values(row).map((value, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {value !== null ? String(value) : 'NULL'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            
            <p className="text-sm text-gray-500 mt-3">
              {result.results.length} row(s) returned
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsTable;
