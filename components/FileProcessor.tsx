
import React, { useState, useCallback, useEffect } from 'react';
import { Implementation, ProcessResult } from '../types';
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
  const [wasmReady, setWasmReady] = useState<boolean>(false);

  useEffect(() => {
    init()
      .then(() => setWasmReady(true))
      .catch(console.error);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
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
    }
  }, []);

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

    const startTime = performance.now();
    try {
      let processedData: Uint8Array;
      
      // Determine which function to call
      if (selectedImpl === Implementation.Wasm) {
        if (!wasmReady) throw new Error("Wasm module not ready.");
        processedData = operation === 'compress' ? wasm.compress(fileContent) : wasm.decompress(fileContent);
      } else {
        if (typeof pako === 'undefined') throw new Error("Pako library not loaded.");
        processedData = operation === 'compress' ? pako.gzip(fileContent) : pako.ungzip(fileContent);
      }
      
      const endTime = performance.now();

      const mimeType = operation === 'compress' ? 'application/gzip' : file.type;
      const extension = operation === 'compress' ? '.gz' : (file.name.endsWith('.gz') ? file.name.slice(0,-3) : '.decompressed');
      const outputFilename = (operation === 'compress' ? file.name : file.name.replace(/\.gz$/, '')) + (operation === 'decompress' ? extension : '');

      setResult({
        originalSize: fileContent.length,
        processedSize: processedData.length,
        time: endTime - startTime,
        processedFile: new Blob([processedData], { type: mimeType }),
        fileName: outputFilename,
      });

    } catch (e: any) {
      setError(e.message || "An unknown error occurred during processing.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [file, fileContent, selectedImpl, wasmReady]);
  
  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const RadioCard: React.FC<{
    value: Implementation;
    label: string;
    icon: React.ReactNode;
  }> = ({ value, label, icon }) => (
    <label className={`
      flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer
      ${selectedImpl === value ? 'bg-cyan-500/20 border-cyan-400' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}
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
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-700 shadow-2xl shadow-slate-900/50">
      
      {/* Step 1: File Upload */}
      <div className="mb-6">
        <label htmlFor="file-upload" className="w-full h-40 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 hover:bg-slate-800 transition-all">
          <UploadIcon className="w-10 h-10 text-slate-500 mb-2"/>
          <p className="font-semibold text-slate-300">
            {file ? 'File selected:' : 'Click to upload a file'}
          </p>
          <p className="text-sm text-slate-400">
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
        </fieldset>
      </div>

      {/* Step 3: Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => processFile('compress')}
          disabled={!fileContent || isLoading}
          className="w-full text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {isLoading ? 'Processing...' : 'Compress'}
        </button>
        <button
          onClick={() => processFile('decompress')}
          disabled={!fileContent || isLoading}
          className="w-full text-lg font-bold bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
           {isLoading ? 'Processing...' : 'Decompress'}
        </button>
      </div>
      
      {/* Step 4: Results */}
      {error && <div className="text-center p-4 mb-4 bg-red-500/20 text-red-300 border border-red-500 rounded-lg">{error}</div>}

      {result && (
        <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
          <h3 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard label="Original Size" value={formatBytes(result.originalSize)} />
            <StatCard label="Processed Size" value={formatBytes(result.processedSize)} />
            <StatCard label="Time Taken" value={`${result.time.toFixed(2)} ms`} />
          </div>
          <button 
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 text-lg font-bold bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <DownloadIcon />
            Download Result
          </button>
        </div>
      )}

    </div>
  );
};

export default FileProcessor;
