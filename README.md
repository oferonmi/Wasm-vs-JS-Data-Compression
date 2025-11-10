# Wasm vs JS Data Compression

A client-side data compression utility that demonstrates the performance difference between WebAssembly and JavaScript implementations. This application performs computationally intensive data compression/decompression entirely within the user's browser.

## Features

✅ **Rust-based WebAssembly compression** using the `flate2` crate  
✅ **Pure JavaScript compression** using the Pako.js library  
✅ **Side-by-side performance comparison** between Wasm and JS  
✅ **Client-side file processing** - your data never leaves your browser  
✅ **File upload and download** functionality  
✅ **Compression and decompression** capabilities  

## Architecture

- **Rust (WebAssembly)**: High-performance compression using `flate2` compiled to Wasm
- **JavaScript**: Pure JS implementation using Pako.js for comparison
- **React + TypeScript**: Modern UI with real-time performance metrics
- **Vite**: Fast build tool and dev server

## Prerequisites

To build and run this project, you need:

- **Node.js** (v18 or higher)
- **Rust** (latest stable version)
- **wasm-pack** (for compiling Rust to WebAssembly)

### Install Rust

If you don't have Rust installed:

```bash
# Windows (PowerShell)
Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile rustup-init.exe; .\rustup-init.exe

# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

After installation, restart your terminal and verify:
```bash
rustc --version
cargo --version
```

### Install wasm-pack
```bash
# Windows (PowerShell)
# iwr https://rustwasm.github.io/wasm-pack/installer/init.ps1 -useb | iex
cargo install wasm-pack 

# macOS/Linux
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

Verify installation:
```bash
wasm-pack --version
```

## Setup and Run

1. **Install Node dependencies**:
   ```bash
   npm install
   ```

2. **Build the WebAssembly module**:
   ```bash
   npm run build:wasm
   ```
   
   This compiles the Rust code to WebAssembly and generates JavaScript bindings in the `pkg/` directory.

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** to the URL shown (typically `http://localhost:5173`)

## Usage

1. **Upload a file** by clicking the upload area
2. **Select implementation**: Choose between WebAssembly or JavaScript
3. **Compress or Decompress**: Click the desired operation button
4. **View results**: See file sizes and processing time
5. **Download**: Get your processed file

## Performance Comparison

Try both implementations with different file sizes to see the performance difference:
- Small files (<100KB): Minimal difference
- Medium files (100KB-1MB): Wasm starts showing advantages
- Large files (>1MB): Wasm should significantly faster

## Troubleshooting

### If wasm-pack build fails:
1. Make sure Rust is properly installed: `rustc --version`
2. Make sure you're in the project root directory
3. Try running manually: `cd rust && wasm-pack build --target web --out-dir ../pkg`

### If the TypeScript error persists:
- This is expected before building the Wasm module
- Run `npm run build:wasm` first
- The error will disappear once the `pkg/` directory is generated

### If compression fails in the browser:
- Check browser console for errors
- Make sure Pako.js is loaded (check Network tab)
- Ensure the Wasm module initialized properly


## Project Structure

```
.
├── rust/
│   ├── src/
│   │   └── lib.rs          # Rust compression functions
│   └── Cargo.toml          # Rust dependencies
├── services/
│   └── compressor.ts       # Wasm module interface
├── components/
│   ├── FileProcessor.tsx   # Main UI component
│   ├── StatCard.tsx        # Results display
│   └── icons.tsx           # SVG icons
├── pkg/                    # Generated Wasm bindings (after build)
├── package.json
└── index.html
```

## Building for Production

```bash
npm run build
```

This will:
1. Build the Rust code to WebAssembly
2. Bundle the React application
3. Output to the `dist/` directory

## How It Works

### WebAssembly Path
1. Rust code in `rust/src/lib.rs` uses the `flate2` crate for compression
2. `wasm-pack` compiles Rust to `.wasm` binary with JS bindings
3. The app imports and calls the Wasm functions directly

### JavaScript Path
1. Uses Pako.js library (loaded from CDN)
2. Pure JavaScript implementation of gzip compression
3. Runs in the main thread for comparison

### Performance Comparison
The app measures execution time for both implementations, allowing you to see:
- Processing speed differences
- File size reduction
- Memory efficiency

## Technical Details

- **Compression Algorithm**: Gzip (RFC 1952)
- **Rust Crate**: `flate2` for high-performance compression
- **JS Library**: Pako.js for JavaScript implementation
- **Wasm Target**: `wasm32-unknown-unknown`
- **Build Tool**: wasm-pack with `--target web`

## Notes

- The TypeScript error for the Wasm import is expected before building - it will resolve after running `npm run build:wasm`
- All file processing happens client-side; no data is sent to any server
- Larger files will show more significant performance differences between implementations

## License

MIT
