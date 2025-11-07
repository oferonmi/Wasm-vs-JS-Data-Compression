
import React from 'react';
import FileProcessor from './components/FileProcessor';
import { GithubIcon } from './components/icons';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-200 flex flex-col items-center justify-center p-4 font-sans transition-colors">
      <main className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-700 dark:from-brand-400 dark:to-brand-600">
            Client-Side Data Compression
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-slate-400">
            Wasm vs. JavaScript Data Compression/Decompression Performance Benchmark
          </p>
        </header>

        <FileProcessor />
      </main>
      <footer className="w-full max-w-4xl mx-auto text-center mt-10 text-gray-500 dark:text-slate-500">
        <p>© 2025 Victor Ocheri</p>
      </footer>
    </div>
  );
};

export default App;
