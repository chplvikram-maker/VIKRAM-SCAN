import { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Scan, LogOut, PackageSearch, AlertCircle, RefreshCcw, Wifi, WifiOff, CloudOff, CloudUpload, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

import Login from './components/Login';
import Scanner from './components/Scanner';
import InventoryForm from './components/InventoryForm';
import HistoryList from './components/HistoryList';
import { Product, HistoryEntry, ApiResponse, PendingSync } from './types';
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

  const [apiUrl, setApiUrl] = useState<string>(() => {
    const saved = localStorage.getItem('VITE_SHEETS_API_URL');
    if (saved) return saved;
    const envValue = import.meta.env.VITE_SHEETS_API_URL;
    return (envValue && !envValue.includes('...')) ? envValue.trim() : '';
  });

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [permissionRequested, setPermissionRequested] = useState(false);

  // Check camera permission status without triggering prompt
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // Some browsers don't support 'camera' query or permissions API
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' as any });
          if (result.state === 'granted') {
            setHasCameraPermission(true);
          } else if (result.state === 'denied') {
            setHasCameraPermission(false);
          } else {
            // It's 'prompt' - we'll show a soft-prompt first
            setHasCameraPermission(null);
          }

          result.onchange = () => {
            if (result.state === 'granted') setHasCameraPermission(true);
            if (result.state === 'denied') setHasCameraPermission(false);
          };
        } else {
          // Fallback: Just try to get it if we are ready
          // But maybe only when they first try to scan
        }
      } catch (e) {
        console.warn('Permissions API error:', e);
      }
    };

    if (user && apiUrl) {
      checkPermission();
    }
  }, [user, apiUrl]);

  const requestPermission = async () => {
    setPermissionRequested(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Close immediately
      setHasCameraPermission(true);
    } catch (err) {
      setHasCameraPermission(false);
      toast.error('Camera access was denied.');
    } finally {
      setPermissionRequested(false);
    }
  };

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [quickScanMode, setQuickScanMode] = useState(() => {
    return localStorage.getItem('quick_scan_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('quick_scan_mode', String(quickScanMode));
  }, [quickScanMode]);
  const [pendingSyncs, setPendingSyncs] = useState<PendingSync[]>(() => {
    const saved = localStorage.getItem('pending_inventory_syncs');
    return saved ? JSON.parse(saved) : [];
  });

  const [configInput, setConfigInput] = useState('');

  const fetchHistory = useCallback(async (username: string) => {
    if (!apiUrl) return;
    
    try {
      const res = await fetch(`${apiUrl}?action=get_history&username=${encodeURIComponent(username)}`, {
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!res.ok) {
        throw new Error(`Server Error: ${res.status} ${res.statusText}`);
      }
      
      const data: ApiResponse<HistoryEntry> = await res.json();
      if (data.success && data.history) {
        setHistory(data.history);
      } else {
        console.warn('API Success False:', data.error);
        if (data.error) toast.error(`History: ${data.error}`, { id: 'fetch-error' });
      }
    } catch (e) {
      console.error('History fetch failed:', e);
      const msg = e instanceof Error ? e.message : 'Unknown connection error';
      toast.error(`History Fetch Failed: ${msg}`, { id: 'fetch-error' });
    }
  }, [apiUrl]);

  // Sync effect
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save pending syncs to local storage
  useEffect(() => {
    localStorage.setItem('pending_inventory_syncs', JSON.stringify(pendingSyncs));
  }, [pendingSyncs]);

  const syncOfflineData = useCallback(async () => {
    if (!isOnline || pendingSyncs.length === 0 || !apiUrl || isSyncing) return;

    setIsSyncing(true);
    setSyncProgress(0);
    const totalToSync = pendingSyncs.length;
    const toastId = toast.loading(`Starting sync of ${totalToSync} entries...`);
    
    let successCount = 0;
    const remainingSyncs = [...pendingSyncs];
    const failedSyncs: PendingSync[] = [];

    for (let i = 0; i < remainingSyncs.length; i++) {
      const sync = remainingSyncs[i];
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: sync.action,
            ...sync.data
          })
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          failedSyncs.push(sync);
        }
      } catch (e) {
        failedSyncs.push(sync);
      }
      setSyncProgress(i + 1);
    }

    setPendingSyncs(failedSyncs);
    setIsSyncing(false);
    setSyncProgress(0);

    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} entries!`, { id: toastId });
      if (user) fetchHistory(user);
    } else if (failedSyncs.length > 0) {
      toast.error('Sync process encountered errors. Some items remains in queue.', { id: toastId });
    } else {
      toast.dismiss(toastId);
    }
  }, [isOnline, pendingSyncs, apiUrl, isSyncing, user, fetchHistory]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingSyncs.length > 0) {
      syncOfflineData();
    }
  }, [isOnline, pendingSyncs.length, syncOfflineData]);

  const handleSaveApiUrl = (url: string) => {
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('https://script.google.com')) {
      localStorage.setItem('VITE_SHEETS_API_URL', cleanUrl);
      setApiUrl(cleanUrl);
      toast.success('API URL saved successfully!');
    } else {
      toast.error('Please enter a valid Google Script URL');
    }
  };

  useEffect(() => {
    if (user && apiUrl) {
      fetchHistory(user);
    }
  }, [user, apiUrl, fetchHistory]);

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

  const handleScan = useCallback(async (barcode: string) => {
    if (!apiUrl) {
      toast.error('Sheets API URL not configured!');
      return;
    }
    
    // In Quick Scan mode, we don't necessarily want to stop the whole session
    if (!quickScanMode) {
      setIsScanning(false);
    }
    
    setIsFetching(true);
    playScanSound();
    triggerVibrate();

    try {
      const res = await fetch(`${apiUrl}?action=get_product&barcode=${encodeURIComponent(barcode)}`, {
        mode: 'cors'
      });
      
      if (!res.ok) {
        throw new Error(`Server Response: ${res.status}`);
      }
      
      let data: ApiResponse<Product>;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('Invalid response from script. Check deployment settings.');
      }

      if (data.success && data.product) {
        if (quickScanMode) {
          // Auto-submit 1 unit immediately
          handleSubmitEntry(1, data.product);
        } else {
          setScannedProduct(data.product);
        }
      } else {
        // If product not found, we always show the prompt regardless of quickScanMode
        // because we need a name
        setIsScanning(false); 
        const errorMsg = data.error || 'Product Not Found';
        const quickAdd = confirm(`${errorMsg}\n\nWould you like to log this as a New Product?`);
        if (quickAdd) {
          const name = prompt('Enter Product Name:');
          if (name) {
            setScannedProduct({
              barcode: barcode,
              name: name,
              category: 'NEW / UNKNOWN',
              uom: 'PCS'
            });
          } else {
            setIsScanning(true);
          }
        } else {
          setIsScanning(true);
        }
      }
    } catch (e) {
      console.error('Scan fetch failed:', e);
      const msg = e instanceof Error ? e.message : 'Is the script published as "Anyone"?';
      toast.error(`Scan Failed: ${msg}`);
      if (!quickScanMode) setIsScanning(true);
    } finally {
      setIsFetching(false);
    }
  }, [apiUrl, quickScanMode, user]);

  const handleSubmitEntry = async (quantity: number, productToSubmit?: Product, autoResume?: boolean) => {
    const product = productToSubmit || scannedProduct;
    if (!product || !user || !apiUrl) return;

    setIsSubmitting(true);
    const entryData = {
      username: user,
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      uom: product.uom,
      quantity
    };

    // Optimistic UI Update
    const tempId = crypto.randomUUID();
    const optimisticEntry: HistoryEntry = {
      id: tempId,
      date: new Date().toISOString(),
      ...entryData
    };
    setHistory(prev => [optimisticEntry, ...prev]);

    if (!isOnline) {
      const newSync: PendingSync = {
        id: crypto.randomUUID(),
        action: 'submit_entry',
        data: entryData,
        timestamp: new Date().toISOString()
      };
      setPendingSyncs(prev => [...prev, newSync]);
      toast.success('Queued offline.', { icon: '💾' });
      if (!productToSubmit) setScannedProduct(null);
      setIsSubmitting(false);
      if (autoResume) setIsScanning(true);
      return;
    }

    const toastId = quickScanMode ? undefined : toast.loading('Logging...');

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'submit_entry',
          ...entryData
        })
      });

      if (!res.ok) throw new Error(`Server Error: ${res.status}`);

      const data: ApiResponse<any> = await res.json();
      if (data.success) {
        toast.success(`Logged ${quantity} ${product.uom}: ${product.name}`, { 
          id: toastId,
          duration: 2000,
          icon: '✅'
        });
        if (!productToSubmit) setScannedProduct(null);
        fetchHistory(user);
        if (autoResume) setIsScanning(true);
      } else {
        // Rollback optimistic update
        setHistory(prev => prev.filter(e => e.id !== tempId));
        toast.error(`Error: ${data.error}`, { id: toastId });
      }
    } catch (e) {
      console.error('Submission failed:', e);
      // Keep optimistic entry as we fallback to local sync
      const newSync: PendingSync = {
        id: crypto.randomUUID(),
        action: 'submit_entry',
        data: entryData,
        timestamp: new Date().toISOString()
      };
      setPendingSyncs(prev => [...prev, newSync]);
      toast.success('Local save fallback.', { id: toastId });
      if (!productToSubmit) setScannedProduct(null);
      if (autoResume) setIsScanning(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);

  const handleEditLast = () => {
    if (history.length === 0) return;
    setEditingEntry(history[0]);
  };

  const handleUpdateEntry = async (quantity: number) => {
    if (!editingEntry || !user || !apiUrl) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Processing update...', { id: 'edit-entry' });

    const updateData = {
      username: user,
      barcode: editingEntry.barcode,
      name: editingEntry.name,
      category: editingEntry.category,
      uom: editingEntry.uom,
      quantity
    };

    if (!isOnline) {
      const newSync: PendingSync = {
        id: crypto.randomUUID(),
        action: 'update_last_entry',
        data: updateData,
        timestamp: new Date().toISOString()
      };
      setPendingSyncs(prev => [...prev, newSync]);
      toast.success('Edit queued offline!', { id: toastId });
      setEditingEntry(null);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'update_last_entry',
          ...updateData
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Entry updated successfully!', { id: toastId });
        setEditingEntry(null);
        fetchHistory(user);
      } else {
        toast.error(data.error || 'Update failed', { id: toastId });
      }
    } catch (e) {
      console.error('Update failed:', e);
      const newSync: PendingSync = {
        id: crypto.randomUUID(),
        action: 'update_last_entry',
        data: updateData,
        timestamp: new Date().toISOString()
      };
      setPendingSyncs(prev => [...prev, newSync]);
      toast.success('Network issue. Edit saved locally.', { id: toastId });
      setEditingEntry(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <Login onLogin={handleLogin} />;

  // Configuration Guard UI
  if (!apiUrl) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-6">
          <div className="w-20 h-20 bg-amber-100 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-amber-200/50">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-natural-text tracking-tight">Configuration</h1>
            <p className="text-sm text-natural-muted font-medium px-4">
              Connect this app to your Google Sheet to start scanning.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="text-left space-y-2 px-4">
              <label className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] ml-2">
                Google Sheets Web App URL
              </label>
              <input 
                type="text" 
                value={configInput}
                onChange={(e) => setConfigInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full p-4 bg-white rounded-2xl border-2 border-natural-border focus:border-natural-accent outline-none font-medium text-xs shadow-inner transition-all hover:border-natural-muted/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveApiUrl(configInput);
                  }
                }}
              />
            </div>

            <div className="p-5 bg-white/50 rounded-3xl border border-natural-border/50 text-left text-[11px] space-y-3 backdrop-blur-sm shadow-sm">
              <p className="font-bold uppercase tracking-wider text-natural-accent flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-natural-accent rounded-full animate-pulse" />
                Setup Help:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-natural-muted font-medium">
                <li>Deploy the script in Google Apps Script as <b>"Web App"</b>.</li>
                <li>Set access to <b>"Anyone"</b> (Crucial).</li>
                <li>Paste the URL above and click <b>Check Connection</b>.</li>
              </ol>
            </div>
            
            <button 
              onClick={() => handleSaveApiUrl(configInput)}
              className="w-full py-5 bg-natural-accent text-white rounded-2.5xl font-bold uppercase tracking-widest text-sm shadow-2xl shadow-natural-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Check Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Camera Permission Guard UI
  if (hasCameraPermission === false) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-8">
          <div className="w-24 h-24 bg-red-100 rounded-[3rem] flex items-center justify-center mx-auto shadow-xl shadow-red-200/50">
            <Scan className="w-12 h-12 text-red-600" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-natural-text tracking-tight">Camera Required</h1>
            <p className="text-sm text-natural-muted font-medium px-4 leading-relaxed">
              VIKRAM SCAN needs camera access to read barcodes. Please enable camera permissions in your browser settings.
            </p>
          </div>
          <div className="p-6 bg-white rounded-3xl border border-natural-border/50 text-left space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-natural-bg rounded-full flex items-center justify-center text-[10px] font-black">1</div>
              <p className="text-[11px] font-bold text-natural-muted uppercase tracking-wider">Tap the lock icon in the URL bar</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-natural-bg rounded-full flex items-center justify-center text-[10px] font-black">2</div>
              <p className="text-[11px] font-bold text-natural-muted uppercase tracking-wider">Change Camera to "Allow"</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-natural-bg rounded-full flex items-center justify-center text-[10px] font-black">3</div>
              <p className="text-[11px] font-bold text-natural-muted uppercase tracking-wider">Refresh the browser page</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-5 bg-natural-text text-white rounded-2.5xl font-bold uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all"
          >
            I've enabled it, Refresh
          </button>
        </div>
      </div>
    );
  }

  // Soft Prompt before browser prompt
  if (hasCameraPermission === null) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-natural-accent opacity-5 rounded-full blur-[100px] -top-1/2 -left-1/2 scale-150 pointer-events-none" />
        <div className="max-w-sm space-y-12 relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 bg-natural-accent rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl shadow-natural-accent/30 rotate-3"
          >
            <Scan className="w-16 h-16 text-white -rotate-3" />
          </motion.div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-natural-text tracking-tighter leading-none">
                CAMERA ACCESS<br />
                <span className="text-natural-accent">REQUIRED</span>
              </h1>
              <p className="text-[10px] text-natural-muted font-bold uppercase tracking-[0.3em]">Hardware Initialization</p>
            </div>
            <p className="text-sm text-natural-muted font-medium px-6 leading-relaxed">
              VIKRAM SCAN uses your device camera to identify and log inventory items instantly.
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={requestPermission}
              disabled={permissionRequested}
              className="w-full py-5 bg-natural-text text-white rounded-[2rem] font-bold uppercase tracking-[0.15em] text-sm shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {permissionRequested ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  Enable Camera
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[9px] text-natural-muted font-black uppercase tracking-widest opacity-50">
              One-time setup required
            </p>
          </div>
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
            <div className="flex items-center gap-1.5 leading-none">
              <h1 className="font-bold text-natural-text tracking-tight">VIKRAM SCAN</h1>
              {!isOnline && <WifiOff className="w-3 h-3 text-red-500" />}
              {isOnline && <Wifi className="w-3 h-3 text-emerald-500 opacity-50" />}
            </div>
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
        {/* Offline Queue Status */}
        {pendingSyncs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-natural-border rounded-2xl overflow-hidden shadow-xl"
          >
            <div className="p-4 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  {isSyncing ? (
                    <RefreshCcw className="w-5 h-5 text-amber-600 animate-spin" />
                  ) : (
                    <CloudOff className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-900 leading-tight">
                    {isSyncing ? 'Synchronizing Data' : 'Pending Synchronization'}
                  </div>
                  <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                    {isSyncing 
                      ? `Processing ${syncProgress} of ${pendingSyncs.length} entries` 
                      : `${pendingSyncs.length} entries awaiting cloud sync`}
                  </div>
                </div>
              </div>
              {!isSyncing && (
                <button
                  onClick={syncOfflineData}
                  disabled={!isOnline}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                >
                  <CloudUpload className="w-3 h-3" />
                  Sync Now
                </button>
              )}
            </div>
            {isSyncing && (
              <div className="bg-amber-50/50 px-4 pb-4">
                <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(syncProgress / pendingSyncs.length) * 100}%` }}
                    className="h-full bg-amber-500"
                  />
                </div>
                <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mt-2 text-right">
                  Do not close application
                </p>
              </div>
            )}
            {!isOnline && !isSyncing && (
              <div className="bg-red-50 border-t border-red-100 p-2 text-center">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center justify-center gap-2">
                  <WifiOff className="w-3 h-3" /> Network connection required to sync
                </p>
              </div>
            )}
          </motion.div>
        )}
        {/* Scanner Component */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isScanning ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-natural-muted"
              )} />
              <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">
                {isScanning ? 'Scanner Active' : 'Scanner Standby'}
              </span>
            </div>
            <button 
              onClick={() => setQuickScanMode(!quickScanMode)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                quickScanMode 
                  ? "bg-natural-accent border-natural-accent text-white shadow-lg shadow-natural-accent/20" 
                  : "bg-white border-natural-border text-natural-muted hover:border-natural-accent"
              )}
            >
              <div className={cn(
                "w-3 h-3 rounded-full flex items-center justify-center border",
                quickScanMode ? "bg-white border-white" : "border-natural-muted"
              )}>
                {quickScanMode && <Check className="w-2 h-2 text-natural-accent" />}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">Quick Scan (Qty: 1)</span>
            </button>
          </div>
          <AnimatePresence mode="wait">
            {isScanning ? (
              <motion.div
                key="scanner"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="overflow-hidden rounded-[2.5rem] border-4 border-natural-border shadow-2xl bg-black"
              >
                <Scanner onScan={handleScan} isScanning={isScanning} />
                <button
                  onClick={() => setIsScanning(false)}
                  className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-black transition-all text-[10px] uppercase tracking-[0.3em] border-t border-white/5"
                >
                  Terminate Scan Session
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="scan-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="aspect-square flex items-center justify-center p-2"
              >
                <button
                  onClick={() => setIsScanning(true)}
                  disabled={isFetching}
                  className="w-full h-full rounded-[4rem] bg-white border-2 border-natural-border flex flex-col items-center justify-center gap-8 hover:border-natural-accent group transition-all shadow-xl shadow-black/5 active:scale-[0.98]"
                >
                  <div className="w-32 h-32 bg-natural-bg rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner relative">
                    <div className="absolute inset-0 bg-natural-accent opacity-0 group-hover:opacity-10 rounded-full transition-opacity" />
                    {isFetching ? (
                      <RefreshCcw className="w-12 h-12 text-natural-accent animate-spin" />
                    ) : (
                      <Scan className="w-12 h-12 text-natural-accent" />
                    )}
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-2xl font-black text-natural-text block tracking-tighter">INITIALIZE SCANNER</span>
                    <span className="text-[10px] text-natural-muted font-bold uppercase tracking-[0.3em] opacity-60">Ready for data entry</span>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Manual Lookup */}
        {!isScanning && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group mt-4"
          >
            <div className="absolute inset-0 bg-natural-accent/5 blur-xl group-focus-within:bg-natural-accent/10 transition-all rounded-3xl" />
            <PackageSearch className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-natural-muted group-focus-within:text-natural-accent transition-colors z-10" />
            <input 
              type="text" 
              placeholder="MANUAL BARCODE LOOKUP..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleScan((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
              className="relative w-full pl-16 pr-6 py-5 bg-white rounded-[2rem] border-2 border-natural-border focus:border-natural-accent outline-none transition-all text-natural-text font-bold text-xs tracking-[0.1em] shadow-lg shadow-black/5 z-0"
            />
          </motion.div>
        )}

        {/* History Section */}
        <HistoryList entries={history} onEditLast={handleEditLast} />
      </main>

      {/* Entry Form Modal (Scanning) */}
      <AnimatePresence>
        {scannedProduct && (
          <InventoryForm 
            product={scannedProduct} 
            isSubmitting={isSubmitting}
            onSubmit={(qty) => handleSubmitEntry(qty)}
            onBatchSubmit={(qty) => handleSubmitEntry(qty, undefined, true)}
            onCancel={() => setScannedProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* Entry Form Modal (Editing) */}
      <AnimatePresence>
        {editingEntry && (
          <InventoryForm 
            product={{
              barcode: editingEntry.barcode,
              name: editingEntry.name,
              category: editingEntry.category,
              uom: editingEntry.uom
            }} 
            initialQuantity={editingEntry.quantity}
            isSubmitting={isSubmitting}
            onSubmit={handleUpdateEntry}
            onCancel={() => setEditingEntry(null)}
            title="Update Entry"
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
