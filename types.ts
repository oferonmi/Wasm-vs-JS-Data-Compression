
export enum Implementation {
  Wasm = 'wasm',
  JavaScript = 'js',
  Compare = 'compare',
}

export interface ProcessResult {
  originalSize: number;
  processedSize: number;
  time: number;
  processedFile: Blob;
  fileName: string;
}

export interface ComparisonResult {
  wasm: ProcessResult;
  js: ProcessResult;
  winner: {
    speed: Implementation | 'tie';
    size: Implementation | 'tie';
  };
}
