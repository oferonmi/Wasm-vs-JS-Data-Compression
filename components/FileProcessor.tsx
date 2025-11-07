
import React, { useState, useCallback, useEffect } from 'react';
import { Implementation, ProcessResult, ComparisonResult } from '../types';
import init, * as wasm from '../services/compressor';
import StatCard from './StatCard';
import { UploadIcon, DownloadIcon, WasmIcon, JsIcon } from './icons';

// @ts-ignore Pako is loaded from CDN
declare const pako: any;

const FileProcessor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<Uint8Array | null>(null);
  const [selectedImpl, setSelectedImpl] = useState<Implementation>(Implementation.Wasm);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [wasmReady, setWasmReady] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');

  useEffect(() => {
    init()
      .then(() => setWasmReady(true))
      .catch(console.error);
  }, []);

  const processSelectedFile = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setComparisonResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        setFileContent(new Uint8Array(event.target.result));
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file.");
    };
    reader.readAsArrayBuffer(selectedFile);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processSelectedFile(selectedFile);
    }
  }, [processSelectedFile]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      processSelectedFile(droppedFiles[0]);
    }
  }, [processSelectedFile]);

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const processFile = useCallback(async (operation: 'compress' | 'decompress') => {
    if (!fileContent || !file) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setComparisonResult(null);
    setProgress(0);
    setProgressMessage('Initializing...');

    try {
      // Comparison mode - run both implementations
      if (selectedImpl === Implementation.Compare) {
        if (!wasmReady) throw new Error("Wasm module not ready.");
        if (typeof pako === 'undefined') throw new Error("Pako library not loaded.");

        // Run WASM
        setProgress(25);
        setProgressMessage('Running WebAssembly compression...');
        await new Promise(resolve => setTimeout(resolve, 10)); // Allow UI to update
        
        const wasmStartTime = performance.now();
        const wasmProcessedData = operation === 'compress' 
          ? wasm.compress(fileContent) 
          : wasm.decompress(fileContent);
        const wasmEndTime = performance.now();

        // Run JavaScript
        setProgress(60);
        setProgressMessage('Running JavaScript compression...');
        await new Promise(resolve => setTimeout(resolve, 10)); // Allow UI to update
        
        const jsStartTime = performance.now();
        const jsProcessedData = operation === 'compress' 
          ? pako.gzip(fileContent) 
          : pako.ungzip(fileContent);
        const jsEndTime = performance.now();

        setProgress(90);
        setProgressMessage('Finalizing results...');
        await new Promise(resolve => setTimeout(resolve, 10)); // Allow UI to update

        const mimeType = operation === 'compress' ? 'application/gzip' : file.type;
        const outputFilename = operation === 'compress' 
          ? `${file.name}.gz` 
          : file.name.replace(/\.gz$/, '') + (file.name.endsWith('.gz') ? '' : '.decompressed');

        const wasmTime = wasmEndTime - wasmStartTime;
        const jsTime = jsEndTime - jsStartTime;

        setComparisonResult({
          wasm: {
            originalSize: fileContent.length,
            processedSize: wasmProcessedData.length,
            time: wasmTime,
            processedFile: new Blob([new Uint8Array(wasmProcessedData)], { type: mimeType }),
            fileName: outputFilename,
          },
          js: {
            originalSize: fileContent.length,
            processedSize: jsProcessedData.length,
            time: jsTime,
            processedFile: new Blob([new Uint8Array(jsProcessedData)], { type: mimeType }),
            fileName: outputFilename,
          },
          winner: {
            speed: wasmTime === jsTime ? 'tie' : (wasmTime < jsTime ? Implementation.Wasm : Implementation.JavaScript),
            size: wasmProcessedData.length === jsProcessedData.length ? 'tie' : (wasmProcessedData.length < jsProcessedData.length ? Implementation.Wasm : Implementation.JavaScript),
          }
        });
      } else {
        // Single implementation mode
        setProgress(30);
        setProgressMessage(`${operation === 'compress' ? 'Compressing' : 'Decompressing'} with ${selectedImpl === Implementation.Wasm ? 'WebAssembly' : 'JavaScript'}...`);
        await new Promise(resolve => setTimeout(resolve, 10)); // Allow UI to update
        
        const startTime = performance.now();
        let processedData: Uint8Array;
        
        if (selectedImpl === Implementation.Wasm) {
          if (!wasmReady) throw new Error("Wasm module not ready.");
          processedData = operation === 'compress' ? wasm.compress(fileContent) : wasm.decompress(fileContent);
        } else {
          if (typeof pako === 'undefined') throw new Error("Pako library not loaded.");
          processedData = operation === 'compress' ? pako.gzip(fileContent) : pako.ungzip(fileContent);
        }
        
        const endTime = performance.now();

        setProgress(90);
        setProgressMessage('Finalizing...');
        await new Promise(resolve => setTimeout(resolve, 10)); // Allow UI to update

        const mimeType = operation === 'compress' ? 'application/gzip' : file.type;
        const extension = operation === 'compress' ? '.gz' : (file.name.endsWith('.gz') ? file.name.slice(0,-3) : '.decompressed');
        const outputFilename = operation === 'compress' 
          ? `${file.name}.gz` 
          : file.name.replace(/\.gz$/, '') + extension;

        setResult({
          originalSize: fileContent.length,
          processedSize: processedData.length,
          time: endTime - startTime,
          processedFile: new Blob([new Uint8Array(processedData)], { type: mimeType }),
          fileName: outputFilename,
        });
      }

      setProgress(100);
      setProgressMessage('Complete!');

    } catch (e: any) {
      setError(e.message || "An unknown error occurred during processing.");
      setProgress(0);
      setProgressMessage('');
      console.error(e);
    } finally {
      setIsLoading(false);
      // Reset progress after a brief delay
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 1000);
    }
  }, [file, fileContent, selectedImpl, wasmReady]);
  
  const handleDownload = (implementation?: Implementation) => {
    // For single implementation mode
    if (result && !implementation) {
      const url = URL.createObjectURL(result.processedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    // For comparison mode
    else if (comparisonResult && implementation) {
      const resultToDownload = implementation === Implementation.Wasm 
        ? comparisonResult.wasm 
        : comparisonResult.js;
      const url = URL.createObjectURL(resultToDownload.processedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = resultToDownload.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  
  const RadioCard: React.FC<{
    value: Implementation;
    label: string;
    icon: React.ReactNode;
  }> = ({ value, label, icon }) => (
    <label className={`
      flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer
      ${selectedImpl === value 
        ? 'bg-brand-50 border-brand-500 dark:bg-brand-500/20 dark:border-brand-400' 
        : 'bg-white border-gray-300 hover:border-brand-400 dark:bg-slate-800 dark:border-slate-600 dark:hover:border-slate-500'}
    `}>
      <input
        type="radio"
        name="implementation"
        value={value}
        checked={selectedImpl === value}
        onChange={(e) => setSelectedImpl(e.target.value as Implementation)}
        className="sr-only"
      />
      <div className="flex items-center justify-center gap-3">
        {icon}
        <span className="font-semibold text-lg">{label}</span>
      </div>
    </label>
  );

  return (
    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-2xl dark:shadow-slate-900/50">
      
      {/* Step 1: File Upload with Drag & Drop */}
      <div className="mb-6">
        <label 
          htmlFor="file-upload" 
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/20 scale-105' 
              : 'border-gray-300 dark:border-slate-600 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-slate-800'
          }`}
        >
          <UploadIcon className={`w-10 h-10 mb-2 transition-colors ${
            isDragging 
              ? 'text-brand-500 dark:text-brand-400' 
              : 'text-gray-400 dark:text-slate-500'
          }`}/>
          <p className="font-semibold text-gray-700 dark:text-slate-300">
            {isDragging 
              ? 'Drop file here' 
              : file 
                ? 'File selected:' 
                : 'Click or drag & drop to upload'}
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {file ? file.name : 'Your data stays on your device'}
          </p>
        </label>
        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Step 2: Implementation Choice */}
      <div className="mb-6">
        <fieldset className="flex flex-col sm:flex-row gap-4">
          <legend className="sr-only">Choose Implementation</legend>
          <RadioCard value={Implementation.Wasm} label="WebAssembly" icon={<WasmIcon />} />
          <RadioCard value={Implementation.JavaScript} label="JavaScript" icon={<JsIcon />} />
          <RadioCard 
            value={Implementation.Compare} 
            label="Compare Both" 
            icon={
              <div className="flex gap-1">
                <WasmIcon className="w-5 h-5" />
                <span className="text-sm">vs</span>
                <JsIcon className="w-5 h-5" />
              </div>
            } 
          />
        </fieldset>
      </div>

      {/* Step 3: Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => processFile('compress')}
          disabled={!fileContent || isLoading}
          className="w-full text-lg font-bold bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-md"
        >
          {isLoading ? 'Processing...' : 'Compress'}
        </button>
        <button
          onClick={() => processFile('decompress')}
          disabled={!fileContent || isLoading}
          className="w-full text-lg font-bold bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 text-white py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-md"
        >
           {isLoading ? 'Processing...' : 'Decompress'}
        </button>
      </div>

      {/* Progress Bar */}
      {isLoading && progress > 0 && (
        <div className="mb-6 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              {progressMessage}
            </span>
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-400 dark:to-brand-500 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 4: Results */}
      {error && <div className="text-center p-4 mb-4 bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500 rounded-lg">{error}</div>}

      {/* Single Implementation Results */}
      {result && !comparisonResult && (
        <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-lg border border-gray-200 dark:border-slate-700">
          <h3 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-400 dark:to-brand-600">Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard label="Original Size" value={formatBytes(result.originalSize)} />
            <StatCard label="Processed Size" value={formatBytes(result.processedSize)} />
            <StatCard label="Time Taken" value={`${result.time.toFixed(2)} ms`} />
          </div>
          <button 
            onClick={() => handleDownload()}
            className="w-full flex items-center justify-center gap-2 text-lg font-bold bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white py-3 px-6 rounded-lg transition-colors shadow-md"
          >
            <DownloadIcon />
            Download Result
          </button>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-lg border border-gray-200 dark:border-slate-700">
          <h3 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-400 dark:to-brand-600">
            Comparison Results
          </h3>
          
          {/* Comparison Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-slate-600">
                  <th className="py-3 px-4 font-bold text-gray-700 dark:text-slate-300">Metric</th>
                  <th className="py-3 px-4 font-bold text-center">
                    <div className="flex items-center justify-center gap-2">
                      <WasmIcon className="w-5 h-5" />
                      <span>WebAssembly</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 font-bold text-center">
                    <div className="flex items-center justify-center gap-2">
                      <JsIcon className="w-5 h-5" />
                      <span>JavaScript</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Original Size</td>
                  <td className="py-3 px-4 text-center text-gray-600 dark:text-slate-400">{formatBytes(comparisonResult.wasm.originalSize)}</td>
                  <td className="py-3 px-4 text-center text-gray-600 dark:text-slate-400">{formatBytes(comparisonResult.js.originalSize)}</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Processed Size</td>
                  <td className={`py-3 px-4 text-center font-bold ${comparisonResult.winner.size === Implementation.Wasm || comparisonResult.winner.size === 'tie' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-slate-400'}`}>
                    {formatBytes(comparisonResult.wasm.processedSize)}
                    {(comparisonResult.winner.size === Implementation.Wasm || comparisonResult.winner.size === 'tie') && ' 🏆'}
                  </td>
                  <td className={`py-3 px-4 text-center font-bold ${comparisonResult.winner.size === Implementation.JavaScript || comparisonResult.winner.size === 'tie' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-slate-400'}`}>
                    {formatBytes(comparisonResult.js.processedSize)}
                    {(comparisonResult.winner.size === Implementation.JavaScript || comparisonResult.winner.size === 'tie') && ' 🏆'}
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Processing Time</td>
                  <td className={`py-3 px-4 text-center font-bold ${comparisonResult.winner.speed === Implementation.Wasm || comparisonResult.winner.speed === 'tie' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-slate-400'}`}>
                    {comparisonResult.wasm.time.toFixed(2)} ms
                    {(comparisonResult.winner.speed === Implementation.Wasm || comparisonResult.winner.speed === 'tie') && ' 🏆'}
                  </td>
                  <td className={`py-3 px-4 text-center font-bold ${comparisonResult.winner.speed === Implementation.JavaScript || comparisonResult.winner.speed === 'tie' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-slate-400'}`}>
                    {comparisonResult.js.time.toFixed(2)} ms
                    {(comparisonResult.winner.speed === Implementation.JavaScript || comparisonResult.winner.speed === 'tie') && ' 🏆'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Speed Difference</td>
                  <td colSpan={2} className="py-3 px-4 text-center font-bold text-brand-600 dark:text-brand-400">
                    {comparisonResult.winner.speed === 'tie'
                      ? 'Same speed!'
                      : comparisonResult.winner.speed === Implementation.Wasm 
                        ? `WebAssembly is ${(comparisonResult.js.time / comparisonResult.wasm.time).toFixed(2)}x faster`
                        : `JavaScript is ${(comparisonResult.wasm.time / comparisonResult.js.time).toFixed(2)}x faster`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Download Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => handleDownload(Implementation.Wasm)}
              className="flex items-center justify-center gap-2 text-lg font-bold bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              <DownloadIcon />
              Download WASM Result
            </button>
            <button 
              onClick={() => handleDownload(Implementation.JavaScript)}
              className="flex items-center justify-center gap-2 text-lg font-bold bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 text-white py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              <DownloadIcon />
              Download JS Result
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default FileProcessor;
