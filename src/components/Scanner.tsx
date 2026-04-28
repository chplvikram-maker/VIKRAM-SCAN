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
          if (isMounted) setError('Could not access camera. Check permissions.');
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

  return (
    <div className="relative w-full aspect-square bg-black overflow-hidden group">
      {/* Scanner Element */}
      <div id="reader" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>
      
      {/* Custom Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Viewfinder Frame */}
        <div className="absolute inset-[15%] border-2 border-white/20 rounded-3xl">
          {/* Corner Accents */}
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-natural-accent rounded-tl-xl" />
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-natural-accent rounded-tr-xl" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-natural-accent rounded-bl-xl" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-natural-accent rounded-br-xl" />
          
          {/* Scanning Line Animation */}
          <motion.div 
            animate={{ 
              top: ['0%', '100%', '0%'],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute left-4 right-4 h-0.5 bg-natural-accent shadow-[0_0_15px_rgba(var(--natural-accent),0.8)]"
          />
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
          <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">
            Align Barcode within edges
          </p>
        </div>
      </div>

      {error && (
        <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-8 text-center space-y-4 z-30">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-white uppercase tracking-wider text-sm">Scanner Error</h3>
            <p className="text-zinc-500 text-xs">{error}</p>
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
