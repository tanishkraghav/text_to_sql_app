function ResultsTable({ result }) {
  if (result.error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generated SQL</h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          {result.sql_query}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Executed in {result.execution_time.toFixed(3)}s
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Results</h3>
        
        {result.results.length === 0 ? (
          <p className="text-gray-500">No results found</p>
        ) : (
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
