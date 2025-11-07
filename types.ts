
export enum Implementation {
  Wasm = 'wasm',
  JavaScript = 'js',
}

export interface ProcessResult {
  originalSize: number;
  processedSize: number;
  time: number;
  processedFile: Blob;
  fileName: string;
}
