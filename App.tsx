
import React from 'react';
import FileProcessor from './components/FileProcessor';
import { GithubIcon } from './components/icons';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center justify-center p-4 font-sans">
      <main className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            Wasm vs. JS Performance
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            A Client-Side Data Compression Benchmark
          </p>
        </header>

        <FileProcessor />
      </main>
      <footer className="w-full max-w-4xl mx-auto text-center mt-10 text-slate-500">
        <a 
          href="https://github.com/google/genaui" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-2 hover:text-cyan-400 transition-colors"
        >
          <GithubIcon />
          <span>Built with GenAI</span>
        </a>
      </footer>
    </div>
  );
};

export default App;
