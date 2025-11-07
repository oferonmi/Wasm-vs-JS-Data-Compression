// Type declarations for the Wasm module
// This file provides TypeScript types for the generated Wasm bindings
// It prevents TypeScript errors before the Wasm module is built

declare module '../pkg/wasm_compressor.js' {
  export default function init(): Promise<void>;
  export function compress(data: Uint8Array): Uint8Array;
  export function decompress(data: Uint8Array): Uint8Array;
}
