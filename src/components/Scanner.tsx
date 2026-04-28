import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
  onScan: (barcode: string) => void;
  isScanning: boolean;
}

export default function Scanner({ onScan, isScanning }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'reader',
        { 
          fps: 15, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          rememberLastUsedCamera: true,
          supportedScanTypes: [0] // 0 is for camera, ensures it starts with camera
        },
        /* verbose= */ false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText);
          // Auto stop scanner on success or keep it going based on needs
          // For continuous inventory, we might just call onScan and keep it running
          // But usually we want to confirm the data first
        },
        (error) => {
          // ignore scan errors as they happen constantly when no barcode is in view
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error('Failed to clear scanner', e));
        scannerRef.current = null;
      }
    };
  }, [isScanning, onScan]);

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl">
      <div id="reader" className="w-full"></div>
      {!isScanning && (
        <div className="p-8 text-center text-zinc-500">
          Camera is paused
        </div>
      )}
    </div>
  );
}
