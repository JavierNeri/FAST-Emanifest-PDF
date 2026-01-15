
import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Zap,
  RefreshCw,
  Image as ImageIcon,
  HelpCircle,
  X
} from 'lucide-react';
import { convertPdfPageToImage, addFastStamp } from './services/pdfService';
import { analyzeDocumentForStamping } from './services/geminiService';
import { generateExtensionIcons } from './services/iconService';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPdfUrl, setProcessedPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'processing' | 'ready'>('upload');
  const [statusMessage, setStatusMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStep('upload');
      setProcessedPdfUrl(null);
      setError(null);
    } else {
      setError("Por favor selecciona un archivo PDF válido.");
    }
  };

  const processPdf = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setStep('processing');
      setError(null);

      setStatusMessage("Leyendo documento...");
      const arrayBuffer = await file.arrayBuffer();
      
      setStatusMessage("Analizando código QR...");
      const base64Image = await convertPdfPageToImage(arrayBuffer.slice(0));
      
      const placement = await analyzeDocumentForStamping(base64Image);

      setStatusMessage("Agregando sello FAST...");
      const modifiedPdfBytes = await addFastStamp(arrayBuffer.slice(0), placement);
      
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setProcessedPdfUrl(url);
      setStep('ready');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error inesperado al procesar.");
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setProcessedPdfUrl(null);
    setError(null);
    setStep('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full flex flex-col bg-slate-50 min-h-[550px] relative">
      {/* Header Compacto */}
      <header className="bg-white border-b border-slate-200 p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-md">
            <Zap className="text-white w-4 h-4" />
          </div>
          <h1 className="text-sm font-bold text-slate-900">FAST PDF Stamper</h1>
        </div>
        <button 
          onClick={() => setShowHelp(true)}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-blue-600"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 p-4">
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-800">Sello Inteligente</h2>
              <p className="text-xs text-slate-500">Agrega "FAST" centrado arriba del QR</p>
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
            
            {!file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl py-12 px-4 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group text-center"
              >
                <div className="p-3 bg-slate-100 rounded-full group-hover:bg-blue-100 w-fit mx-auto mb-3 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Subir Manifiesto PDF</p>
                <p className="text-[10px] text-slate-400 mt-1">Haz clic para seleccionar</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={processPdf}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Procesar PDF
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Elegir otro archivo
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">Procesando...</p>
              <p className="text-[11px] text-slate-500">{statusMessage}</p>
            </div>
          </div>
        )}

        {step === 'ready' && processedPdfUrl && (
          <div className="space-y-4 text-center">
            <div className="p-3 bg-green-50 text-green-700 rounded-full w-fit mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">¡Listo!</h3>
              <p className="text-xs text-slate-500">Sello agregado correctamente arriba del QR.</p>
            </div>
            
            <a 
              href={processedPdfUrl} 
              download={`FAST_${file?.name}`}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Descargar PDF
            </a>

            <button 
              onClick={reset}
              className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Procesar otro
            </button>

            <div className="bg-slate-200 rounded-lg aspect-[3/4] max-w-[200px] mx-auto overflow-hidden shadow-inner border border-slate-300 mt-4">
              <iframe 
                src={processedPdfUrl} 
                className="w-full h-full border-none pointer-events-none" 
                title="Vista Previa"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight font-medium">{error}</p>
          </div>
        )}
      </main>

      <footer className="p-3 bg-white border-t border-slate-100 text-center space-y-2">
        <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
          Versión Extensión v1.0
        </p>
        <button 
          onClick={generateExtensionIcons}
          className="text-[9px] flex items-center gap-1 mx-auto bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
          title="Descarga los iconos para subir a la Chrome Web Store"
        >
          <ImageIcon className="w-3 h-3" />
          Descargar Iconos Store (.png)
        </button>
      </footer>

      {/* Modal de Ayuda para Instalación */}
      {showHelp && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-blue-50">
              <h3 className="font-bold text-blue-900 text-sm">¿Cómo instalar en el navegador?</h3>
              <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto max-h-[400px]">
              <div className="flex gap-3">
                <div className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</div>
                <p className="text-xs text-slate-600">Guarda todos los archivos del código en una carpeta local.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</div>
                <p className="text-xs text-slate-600">Haz clic en <b>"Descargar Iconos Store"</b> abajo y ponlos en esa misma carpeta.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</div>
                <p className="text-xs text-slate-600">En Chrome, ve a <code className="bg-slate-100 px-1">chrome://extensions/</code></p>
              </div>
              <div className="flex gap-3">
                <div className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">4</div>
                <p className="text-xs text-slate-600">Activa el <b>"Modo de desarrollador"</b>.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">5</div>
                <p className="text-xs text-slate-600">Usa <b>"Cargar descomprimida"</b> y selecciona tu carpeta.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowHelp(false)}
                className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
