import { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Scan, LogOut, PackageSearch, AlertCircle, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import Login from './components/Login';
import Scanner from './components/Scanner';
import InventoryForm from './components/InventoryForm';
import HistoryList from './components/HistoryList';
import { Product, HistoryEntry, ApiResponse } from './types';
import { playScanSound, triggerVibrate } from './lib/utils';

const RAW_API_URL = import.meta.env.VITE_SHEETS_API_URL;
const API_URL = RAW_API_URL?.trim();

export default function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem('inventory_user'));
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchHistory = useCallback(async (username: string) => {
    if (!API_URL || API_URL.includes('...')) return;
    
    try {
      const res = await fetch(`${API_URL}?action=get_history&username=${encodeURIComponent(username)}`, {
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data: ApiResponse<HistoryEntry> = await res.json();
      if (data.success && data.history) {
        setHistory(data.history);
      } else {
        console.warn('API returned success:false', data.error);
      }
    } catch (e) {
      console.error('History fetch failed:', e);
      toast.error('Connection Error: Is the script deployed as "Anyone"?', { id: 'fetch-error' });
    }
  }, []);

  useEffect(() => {
    if (user && API_URL && !API_URL.includes('...')) {
      fetchHistory(user);
    }
  }, [user, fetchHistory]);

  const handleLogin = (username: string) => {
    setUser(username);
    localStorage.setItem('inventory_user', username);
    toast.success(`Welcome, ${username}`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('inventory_user');
    setIsScanning(false);
  };

  const handleScan = async (barcode: string) => {
    if (!API_URL || API_URL.includes('...')) {
      toast.error('Sheets API URL not configured!');
      return;
    }
    
    setIsScanning(false);
    setIsFetching(true);
    playScanSound();
    triggerVibrate();

    try {
      const res = await fetch(`${API_URL}?action=get_product&barcode=${encodeURIComponent(barcode)}`, {
        mode: 'cors'
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data: ApiResponse<Product> = await res.json();

      if (data.success && data.product) {
        setScannedProduct(data.product);
      } else {
        toast.error(data.error || 'Product Not Found', {
          icon: <AlertCircle className="text-red-500" />,
          duration: 3000
        });
        setIsScanning(true); 
      }
    } catch (e) {
      console.error('Scan fetch failed:', e);
      toast.error('Check script deployment and permissions.');
      setIsScanning(true);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmitEntry = async (quantity: number) => {
    if (!scannedProduct || !user || !API_URL) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // Bypass CORS preflight for simplified endpoint
        body: JSON.stringify({
          action: 'submit_entry',
          username: user,
          barcode: scannedProduct.barcode,
          name: scannedProduct.name,
          category: scannedProduct.category,
          uom: scannedProduct.uom,
          quantity
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Inventory logged successfully!');
        setScannedProduct(null);
        fetchHistory(user);
      } else {
        toast.error(data.error || 'Submission failed');
      }
    } catch (e) {
      toast.error('Network Error. Could not save entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLast = async () => {
    if (history.length === 0 || !user || !API_URL) return;
    
    const last = history[0];
    const newQty = prompt(`Update quantity for ${last.name}?`, String(last.quantity));
    
    if (newQty === null) return;
    const qty = parseFloat(newQty);
    
    if (isNaN(qty) || qty <= 0) {
      toast.error('Invalid quantity');
      return;
    }

    toast.loading('Updating...', { id: 'edit-entry' });
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'update_last_entry',
          username: user,
          quantity: qty
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Last entry updated', { id: 'edit-entry' });
        fetchHistory(user);
      } else {
        toast.error(data.error || 'Update failed', { id: 'edit-entry' });
      }
    } catch (e) {
      toast.error('Network error', { id: 'edit-entry' });
    }
  };

  if (!user) return <Login onLogin={handleLogin} />;

  // Configuration Guard UI
  if (!API_URL || API_URL.includes('...')) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-6">
          <div className="w-20 h-20 bg-amber-100 rounded-3xl mx-auto flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-natural-text">Configuration Required</h1>
            <p className="text-sm text-natural-muted font-medium">
              To connect this app to your Google Sheet, you must set the <code className="bg-white px-1">VITE_SHEETS_API_URL</code> environment variable.
            </p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-natural-border text-left text-[11px] space-y-3">
            <p className="font-bold uppercase tracking-wider text-natural-accent">Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-natural-muted font-medium">
              <li>Deploy the <code className="bg-natural-bg px-1">backend-script.gs</code> in Google Apps Script.</li>
              <li>Copy the <b>Web App URL</b>.</li>
              <li>Add it to <b>Secrets</b> as <code className="bg-natural-bg px-1">VITE_SHEETS_API_URL</code>.</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-natural-accent text-white rounded-2xl font-bold uppercase tracking-widest text-sm"
          >
            I've set it up, Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg pb-24">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-natural-screen/80 backdrop-blur-lg border-b border-natural-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-natural-accent rounded-xl shadow-sm">
            <Scan className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-natural-text leading-none tracking-tight">VIKRAM SCAN</h1>
            <span className="text-[10px] text-natural-muted font-bold uppercase tracking-widest">VIKRAM SCAN PRO</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-natural-muted font-bold uppercase tracking-wider">Operator</div>
            <div className="font-bold text-natural-text">{user}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-natural-border rounded-full text-natural-muted transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8">
        {/* Scanner Component */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isScanning ? (
              <motion.div
                key="scanner"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="overflow-hidden rounded-[32px] border-4 border-natural-border shadow-xl bg-natural-accent"
              >
                <Scanner onScan={handleScan} isScanning={isScanning} />
                <button
                  onClick={() => setIsScanning(false)}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold transition-all text-sm uppercase tracking-widest"
                >
                  Cancel Scan
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="scan-btn"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="aspect-square flex items-center justify-center p-2"
              >
                <button
                  onClick={() => setIsScanning(true)}
                  disabled={isFetching}
                  className="w-full h-full rounded-[48px] bg-natural-screen border-2 border-natural-border flex flex-col items-center justify-center gap-6 hover:border-natural-accent group transition-all shadow-sm"
                >
                  <div className="w-24 h-24 bg-natural-bg rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    {isFetching ? (
                      <RefreshCcw className="w-10 h-10 text-natural-accent animate-spin" />
                    ) : (
                      <Scan className="w-10 h-10 text-natural-accent" />
                    )}
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold text-natural-text block tracking-tight">Tap to Scan</span>
                    <span className="text-[11px] text-natural-muted font-bold uppercase tracking-widest mt-1">Ready for Entry</span>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Manual Lookup */}
        {!isScanning && (
          <div className="relative group">
            <PackageSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-natural-muted" />
            <input 
              type="text" 
              placeholder="ENTER BARCODE MANUALLY..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleScan((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-natural-border focus:border-natural-accent outline-none transition-all text-natural-text font-semibold text-sm tracking-wide"
            />
          </div>
        )}

        {/* History Section */}
        <HistoryList entries={history} onEditLast={handleEditLast} />
      </main>

      {/* Entry Form Modal */}
      <AnimatePresence>
        {scannedProduct && (
          <InventoryForm 
            product={scannedProduct} 
            isSubmitting={isSubmitting}
            onSubmit={handleSubmitEntry}
            onCancel={() => setScannedProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Nav Hint (for mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-50 dark:from-black via-zinc-50/50 dark:via-black/50 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto h-1 w-24 bg-zinc-300 dark:bg-zinc-700 rounded-full pointer-events-auto" />
      </div>
    </div>
  );
}
