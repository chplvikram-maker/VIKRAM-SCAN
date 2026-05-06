import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, AlertCircle } from 'lucide-react';

interface ScannerProps {
  onScan: (barcode: string) => void;
  isScanning: boolean;
}

export default function Scanner({ onScan, isScanning }: ScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastScanRef = useRef<{ code: string; time: number } | null>(null);
  const [activeScan, setActiveScan] = useState(false);

  const DEBOUNCE_TIME = 2000; // 2 seconds between same barcode scans

  useEffect(() => {
    let isMounted = true;

    if (isScanning) {
      const startScanner = async () => {
        try {
          const scanner = new Html5Qrcode('reader');
          scannerRef.current = scanner;

          const config = {
            fps: 20,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.max(50, Math.floor(minEdgeSize * 0.7));
              return {
                width: qrboxSize,
                height: qrboxSize
              };
            },
            aspectRatio: 1.0
          };

          await scanner.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              const now = Date.now();
              const lastScan = lastScanRef.current;
              
              if (lastScan && lastScan.code === decodedText && (now - lastScan.time) < DEBOUNCE_TIME) {
                return; // Ignore duplicate scan within debounce window
              }

              lastScanRef.current = { code: decodedText, time: now };
              if (isMounted) {
                setActiveScan(true);
                setTimeout(() => {
                  if (isMounted) setActiveScan(false);
                }, 500); 
                onScan(decodedText);
              }
            },
            () => {
              // Ignore constant errors
            }
          );
          if (isMounted) setError(null);
        } catch (err) {
          console.error('Failed to start scanner:', err);
          if (isMounted) {
            const errorMessage = String(err).toLowerCase();
            if (errorMessage.includes('notallowederror') || errorMessage.includes('permission denied')) {
              setError('Camera access denied. Please enable permissions in your browser settings to use the scanner.');
            } else if (errorMessage.includes('notfounderror') || errorMessage.includes('no camera found')) {
              setError('No camera detected. Please ensure your device has a working camera connected.');
            } else if (errorMessage.includes('notreadableerror') || errorMessage.includes('could not start video source')) {
              setError('Camera is currently unavailable. It might be in use by another app or there is a hardware issue.');
            } else {
              setError('Failed to initialize camera. Please check your hardware or try refreshing the page.');
            }
          }
        }
      };

      startScanner();
    }

    return () => {
      isMounted = false;
      const scanner = scannerRef.current;
      if (scanner) {
        // Only attempt to stop if it is indeed scanning
        if (scanner.isScanning) {
          scanner.stop()
            .then(() => {
              scanner.clear();
            })
            .catch(err => {
              // Gracefully handle "scanner is not running" which can happen during race conditions
              if (!String(err).includes("not running")) {
                console.error('Error stopping scanner:', err);
              }
            });
        } else {
          scanner.clear();
        }
        scannerRef.current = null;
      }
    };
  }, [isScanning, onScan]);

  const handleRetry = () => {
    setError(null);
    // Setting error to null should trigger the useEffect again if isScanning is true
  };

  return (
    <div className="relative w-full aspect-square bg-black overflow-hidden group">
      {/* Scanner Element */}
      <div id="reader" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>
      
      {/* Custom Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Viewfinder Frame */}
        <div className="absolute inset-[15%] border-2 border-white/10 rounded-3xl overflow-hidden">
          {/* Corner Accents with Pulse */}
          <motion.div 
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-natural-accent rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-natural-accent rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-natural-accent rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-natural-accent rounded-br-xl" />
          </motion.div>
          
          {/* Scanning Line Animation */}
          <motion.div 
            animate={{ 
              top: ['-5%', '105%'],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-natural-accent/80 to-transparent shadow-[0_0_20px_rgba(90,90,64,0.5)]"
          />

          {/* Grainy scanning effect (subtle) */}
          <div className="absolute inset-0 bg-white/[0.02] mix-blend-overlay" />
        </div>

        {/* Live Indicator */}
        <div className="absolute top-6 left-0 right-0 flex justify-center">
          <motion.div 
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
            <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Scanner Active</span>
          </motion.div>
        </div>

        {/* Success Flash Overlay */}
        <AnimatePresence>
          {activeScan && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-emerald-500 z-20"
            />
          )}
        </AnimatePresence>

        {/* Info Text */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">
            Processing Frame...
          </p>
        </div>
      </div>

      {error && (
        <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-8 text-center z-30">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="max-w-xs space-y-4">
            <div className="space-y-2">
              <h3 className="font-black text-white uppercase tracking-[0.2em] text-sm">Scanner Error</h3>
              <p className="text-white/50 text-[11px] leading-relaxed font-medium">
                {error}
              </p>
            </div>
            <button 
              onClick={handleRetry}
              className="w-full py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-colors"
            >
              Retry Access
            </button>
            <p className="text-[9px] text-white/20 uppercase tracking-widest font-black">
              Check browser permissions
            </p>
          </div>
        </div>
      )}

      {!isScanning && !error && (
        <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-8 z-30">
          <Scan className="w-12 h-12 text-zinc-700 animate-pulse" />
          <p className="mt-4 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
            Camera Ready
          </p>
        </div>
      )}
    </div>
  );
}
