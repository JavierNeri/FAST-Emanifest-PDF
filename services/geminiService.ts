
import { GoogleGenAI, Type } from "@google/genai";
import { PlacementResult } from "../types";

// Initializing GoogleGenAI with the recommended named parameter and direct process.env usage.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeDocumentForStamping = async (base64Image: string): Promise<PlacementResult> => {
  // Using gemini-3-pro-preview for complex spatial reasoning tasks involving QR code detection and layout.
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    Analyze this document (Truck Manifest). 
    Your specific task is to find the QR code and suggest the coordinates to place the word "FAST" in a large, bold font.
    
    CRITICAL REQUIREMENTS:
    1. The word "FAST" MUST be placed directly ABOVE the QR code.
    2. The word "FAST" MUST be HORIZONTALLY CENTERED relative to the QR code.
    3. Return the (x, y) coordinates for the intended HORIZONTAL CENTER of the word "FAST".
    4. The (x, y) coordinates should be normalized from 0 to 100, where (0,0) is TOP-LEFT and (100,100) is BOTTOM-RIGHT.
    5. Suggest a font size (suggested 70-110) that makes the text clearly visible but fits within the width of the QR code or slightly wider.
    6. Provide a rotation if the document is slanted (usually 0).
    
    Return the result in JSON format.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          x: { type: Type.NUMBER, description: "X coordinate (horizontal center, 0-100)" },
          y: { type: Type.NUMBER, description: "Y coordinate (baseline, 0-100)" },
          fontSize: { type: Type.NUMBER, description: "Recommended font size" },
          rotation: { type: Type.NUMBER, description: "Rotation in degrees" },
          reasoning: { type: Type.STRING, description: "Explanation of QR code detection and placement" }
        },
        required: ["x", "y", "fontSize", "rotation", "reasoning"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  
  return JSON.parse(text) as PlacementResult;
};
