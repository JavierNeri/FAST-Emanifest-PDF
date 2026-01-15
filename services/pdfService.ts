
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { PlacementResult } from '../types';

/**
 * PDF.js worker initialization.
 */
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const convertPdfPageToImage = async (pdfBuffer: ArrayBuffer): Promise<string> => {
  const loadingTask = pdfjsLib.getDocument({ 
    data: pdfBuffer,
    useSystemFonts: true 
  });
  
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) throw new Error("Could not get canvas context");
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  // Fix: Added the required 'canvas' property to RenderParameters as per type definitions.
  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas
  }).promise;
  
  return canvas.toDataURL('image/png').split(',')[1];
};

export const addFastStamp = async (
  pdfBuffer: ArrayBuffer, 
  placement: PlacementResult
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const text = 'FAST';
  
  // Calculate text width to perform horizontal centering
  const textWidth = helveticaBold.widthOfTextAtSize(text, placement.fontSize);
  
  // Gemini returns normalized coordinates (0-100) where (0,0) is TOP-LEFT.
  // We treat placement.x as the center point.
  // targetX = (center_percent * width) - (text_width / 2)
  const targetX = (placement.x / 100) * width - (textWidth / 2);
  
  // PDF-Lib uses 0,0 as BOTTOM-LEFT
  const targetY = height - ((placement.y / 100) * height);
  
  // Fix: Use the 'degrees' helper function from pdf-lib to set rotation correctly.
  firstPage.drawText(text, {
    x: targetX,
    y: targetY,
    size: placement.fontSize,
    font: helveticaBold,
    color: rgb(0.1, 0.2, 0.8),
    rotate: degrees(placement.rotation),
    opacity: 0.85,
  });
  
  return await pdfDoc.save();
};
