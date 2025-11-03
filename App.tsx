
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload.tsx';
import { ResultsTable } from './components/ResultsTable.tsx';
import { readFileAsArray, exportArrayToExcel } from './services/excelService.ts';
import { SpinnerIcon } from './components/Icons.tsx';
import type { ProcessedRow } from './types.ts';

// Fix: Use React.ReactElement instead of JSX.Element to resolve "Cannot find namespace 'JSX'" error.
function App(): React.ReactElement {
  const [file, setFile] = useState<File | null>(null);
  const [startColumn, setStartColumn] = useState<number>(6);
  const [endColumn, setEndColumn] = useState<number>(8);
  const [bestOf, setBestOf] = useState<number>(2);
  
  const [processedData, setProcessedData] = useState<ProcessedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = useCallback((droppedFile: File) => {
    if (droppedFile && (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || droppedFile.name.endsWith('.xlsx'))) {
      setFile(droppedFile);
      setProcessedData([]);
      setHeaders([]);
      setError(null);
    } else {
      setError('Invalid file type. Please upload a .xlsx file.');
    }
  }, []);
  
  const handleProcess = useCallback(async () => {
    if (!file) {
      setError('Please upload an Excel file first.');
      return;
    }
    if (isNaN(startColumn) || isNaN(endColumn) || isNaN(bestOf) || startColumn <= 0 || endColumn <= 0 || bestOf <= 0) {
      setError('Please enter valid, positive numbers for all fields.');
      return;
    }
    if (startColumn > endColumn) {
      setError('Start column index cannot be greater than the end column index.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProcessedData([]);

    try {
      const data = await readFileAsArray(file);
      if (data.length < 2) {
          throw new Error("Excel file must have a header row and at least one data row.");
      }

      const originalHeaders = data[0] as string[];
      const studentData = data.slice(1);

      const newHeaders = [...originalHeaders, 'Best Pop quiz Result'];
      setHeaders(newHeaders);

      const newProcessedData: ProcessedRow[] = studentData.map((row, rowIndex) => {
        const quizScores: number[] = [];
        // Adjust for 0-based index
        for (let i = startColumn - 1; i < endColumn; i++) {
          const score = parseFloat(row[i]);
          if (!isNaN(score)) {
            quizScores.push(score);
          }
        }
        
        quizScores.sort((a, b) => b - a);
        const topScores = quizScores.slice(0, bestOf);
        
        const average = topScores.length > 0
          ? topScores.reduce((sum, score) => sum + score, 0) / topScores.length
          : 0;

        return {
          originalRow: row,
          calculatedAvg: parseFloat(average.toFixed(2))
        };
      });

      setProcessedData(newProcessedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during processing.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [file, startColumn, endColumn, bestOf]);
  
  const handleDownload = () => {
    if (processedData.length === 0 || headers.length === 0) {
      setError("No data available to download.");
      return;
    }
    const dataToExport = [headers, ...processedData.map(row => [...row.originalRow, row.calculatedAvg])];
    exportArrayToExcel(dataToExport, "pop_quiz_results.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">
            Pop Quiz 'Best Of' Calculator
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Upload student grades, and we'll calculate the average of the top quiz scores.
          </p>
        </header>

        <main className="space-y-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">1. Upload Your File</h2>
            <FileUpload onFileDrop={handleFileDrop} file={file} />
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">2. Configure Calculation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="startColumn" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pop Quiz Start Column</label>
                <input
                  id="startColumn"
                  type="number"
                  min="1"
                  value={startColumn}
                  onChange={(e) => setStartColumn(parseInt(e.target.value, 10))}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., 6"
                />
              </div>
              <div>
                <label htmlFor="endColumn" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pop Quiz End Column</label>
                <input
                  id="endColumn"
                  type="number"
                  min="1"
                  value={endColumn}
                  onChange={(e) => setEndColumn(parseInt(e.target.value, 10))}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., 8"
                />
              </div>
              <div>
                <label htmlFor="bestOf" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Number of 'Best Of'</label>
                <input
                  id="bestOf"
                  type="number"
                  min="1"
                  value={bestOf}
                  onChange={(e) => setBestOf(parseInt(e.target.value, 10))}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., 2"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleProcess}
              disabled={!file || isLoading}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isLoading && <SpinnerIcon />}
              {isLoading ? 'Processing...' : 'Calculate Results'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {processedData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">3. Results</h2>
                <button 
                  onClick={handleDownload}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all transform hover:scale-105"
                >
                  Download as Excel
                </button>
              </div>
              <ResultsTable headers={headers} data={processedData} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;