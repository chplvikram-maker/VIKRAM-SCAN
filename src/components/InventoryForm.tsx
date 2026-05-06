import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { Product } from '../types';
import { Package, Hash, Type, Ruler, CheckCircle2, X, ClipboardCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface InventoryFormProps {
  product: Product;
  onSubmit: (quantity: number, type: 'IN' | 'OUT' | 'AUDIT', remarks?: string) => void;
  onBatchSubmit?: (quantity: number, type: 'IN' | 'OUT' | 'AUDIT', remarks?: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  initialQuantity?: number;
  initialType?: 'IN' | 'OUT' | 'AUDIT';
  initialRemarks?: string;
  title?: string;
}

export default function InventoryForm({ 
  product, 
  onSubmit, 
  onBatchSubmit,
  onCancel, 
  isSubmitting,
  initialQuantity,
  initialType = 'IN',
  initialRemarks = '',
  title = "Verify Entry"
}: InventoryFormProps) {
  const [quantity, setQuantity] = useState<string>(initialQuantity ? String(initialQuantity) : '');
  const [type, setType] = useState<'IN' | 'OUT' | 'AUDIT'>(initialType);
  const [remarks, setRemarks] = useState<string>(initialRemarks);

  // Auto focus input on mount
  useEffect(() => {
    const input = document.getElementById('quantity-input');
    if (input) {
      input.focus();
      if (initialQuantity) {
        (input as HTMLInputElement).select();
      }
    }
  }, [initialQuantity]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!quantity || quantity.trim() === '') {
      toast.error('Please enter a quantity');
      return;
    }

    const val = parseFloat(quantity);
    
    if (isNaN(val) || val <= 0) {
      toast.error('Quantity must be a positive number');
      return;
    }

    onSubmit(val, type, remarks);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-natural-accent/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-natural-screen rounded-[32px] p-6 shadow-2xl border border-natural-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-natural-text uppercase tracking-tight">{title}</h2>
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-natural-bg rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-natural-muted" />
          </button>
        </div>

        <div className="space-y-3 mb-8">
          <DetailRow icon={<Hash />} label="Barcode" value={product.barcode} />
          <DetailRow icon={<Package />} label="Product Name" value={product.name} />
          <div className="grid grid-cols-2 gap-3">
            <DetailRow icon={<Type />} label="Category" value={product.category} />
            <DetailRow icon={<Ruler />} label="Unit" value={product.uom} />
          </div>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="quantity-input" className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] ml-2">
              Physical Count (Qty)
            </label>
            <input
              id="quantity-input"
              type="number"
              inputMode="decimal"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              className={cn(
                "w-full text-5xl font-black p-6 bg-white rounded-3xl border-2 outline-none transition-all text-center",
                type === 'IN' ? "border-emerald-500 text-emerald-500 focus:ring-emerald-500/10" : 
                type === 'OUT' ? "border-red-500 text-red-500 focus:ring-red-500/10" :
                "border-blue-500 text-blue-500 focus:ring-blue-500/10"
              )}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="remarks-input" className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] ml-2">
              Remarks (Optional)
            </label>
            <textarea
              id="remarks-input"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add notes..."
              rows={2}
              className="w-full p-4 bg-white rounded-2xl border-2 border-natural-border outline-none focus:border-natural-accent transition-all text-sm font-medium resize-none"
            />
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(quantity);
                  if (!val || val <= 0) {
                    toast.error('Enter valid quantity');
                    return;
                  }
                  onSubmit(val, 'IN', remarks);
                }}
                disabled={isSubmitting}
                className={cn(
                  "py-4 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-1 transition-all uppercase tracking-widest shadow-lg",
                  "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div className="text-[10px] opacity-70">Log As</div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Put (IN)
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(quantity);
                  if (!val || val <= 0) {
                    toast.error('Enter valid quantity');
                    return;
                  }
                  onSubmit(val, 'OUT', remarks);
                }}
                disabled={isSubmitting}
                className={cn(
                  "py-4 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-1 transition-all uppercase tracking-widest shadow-lg",
                  "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div className="text-[10px] opacity-70">Log As</div>
                <div className="flex items-center gap-2">
                  <X className="w-5 h-5" />
                  Take (OUT)
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const val = parseFloat(quantity);
                if (!val || val <= 0) {
                  toast.error('Enter valid quantity');
                  return;
                }
                onSubmit(val, 'AUDIT', remarks);
              }}
              disabled={isSubmitting}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-1 transition-all uppercase tracking-widest shadow-lg",
                "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="text-[10px] opacity-70">Set Absolute Count</div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Stock Take (AUDIT)
              </div>
            </button>
          </div>

          {onBatchSubmit && !initialQuantity && (
            <button
              type="button"
              onClick={() => {
                const val = parseFloat(quantity);
                if (!val || val <= 0) {
                  toast.error('Enter valid quantity');
                  return;
                }
                onBatchSubmit(val, type, remarks);
              }}
              disabled={isSubmitting}
              className="w-full py-4 mt-2 rounded-2xl font-black text-xs border-2 border-natural-text text-natural-text hover:bg-natural-text hover:text-white transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2"
            >
              Scan Continuous
            </button>
          )}
        </form>
      </div>
    </motion.div>
  );
}

function DetailRow({ icon, label, value }: { icon: ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-natural-border/50 shadow-sm">
      <div className="p-2 bg-natural-bg rounded-lg text-natural-accent">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-black text-natural-muted uppercase tracking-widest">{label}</div>
        <div className="font-bold text-natural-text truncate leading-tight">{value}</div>
      </div>
    </div>
  );
}
