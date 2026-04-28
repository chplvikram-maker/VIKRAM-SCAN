import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { Product } from '../types';
import { Package, Hash, Type, Ruler, CheckCircle2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface InventoryFormProps {
  product: Product;
  onSubmit: (quantity: number) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function InventoryForm({ product, onSubmit, onCancel, isSubmitting }: InventoryFormProps) {
  const [quantity, setQuantity] = useState<string>('');

  // Auto focus input on mount
  useEffect(() => {
    const input = document.getElementById('quantity-input');
    if (input) input.focus();
  }, []);

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

    onSubmit(val);
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
          <h2 className="text-xl font-black text-natural-text uppercase tracking-tight">Verify Entry</h2>
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full text-4xl font-black p-5 bg-white rounded-2xl border-2 border-natural-accent focus:ring-4 focus:ring-natural-accent/10 outline-none transition-all text-center text-natural-accent"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all uppercase tracking-widest",
              "bg-natural-accent hover:bg-natural-text text-white shadow-lg shadow-natural-accent/20",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6" />
                Submit Entry
              </>
            )}
          </button>
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
