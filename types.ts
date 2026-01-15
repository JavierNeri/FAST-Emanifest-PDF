
export interface PlacementResult {
  x: number; // 0-100 normalized
  y: number; // 0-100 normalized
  fontSize: number;
  rotation: number;
  reasoning: string;
}

export interface PDFMetadata {
  name: string;
  size: number;
  lastModified: number;
}
