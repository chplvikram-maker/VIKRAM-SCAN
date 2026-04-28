import { useState, useMemo } from 'react';
import { HistoryEntry } from '../types';
import { Clock, Edit2, Search, ArrowUpDown, Calendar, Hash } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface HistoryListProps {
  entries: HistoryEntry[];
  onEditLast: () => void;
}

type SortField = 'date' | 'quantity';
type SortOrder = 'asc' | 'desc';

export default function HistoryList({ entries, onEditLast }: HistoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredAndSortedEntries = useMemo(() => {
    const filtered = entries.filter(entry => 
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.barcode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' ? b.quantity - a.quantity : a.quantity - b.quantity;
      }
    });
  }, [entries, searchQuery, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Activity
          </h3>
          {entries.length > 0 && (
            <button 
              onClick={onEditLast}
              className="text-[10px] font-black text-natural-accent hover:text-natural-text flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg transition-colors border border-natural-border shadow-sm uppercase tracking-widest"
            >
              <Edit2 className="w-3 h-3" />
              Edit Last
            </button>
          )}
        </div>

        {entries.length > 0 && (
          <div className="space-y-3">
            <div className="relative group px-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted group-focus-within:text-natural-accent transition-colors" />
              <input 
                type="text"
                placeholder="FILTER RECENT ENTRIES..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/50 rounded-xl border border-natural-border focus:border-natural-accent outline-none transition-all text-natural-text font-bold text-[10px] tracking-widest uppercase"
              />
            </div>

            <div className="flex items-center gap-2 px-1">
              <button
                onClick={() => toggleSort('date')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all",
                  sortField === 'date' 
                    ? "bg-natural-accent text-white border-natural-accent" 
                    : "bg-white text-natural-muted border-natural-border hover:bg-natural-bg"
                )}
              >
                <Calendar className="w-3 h-3" />
                Date {sortField === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => toggleSort('quantity')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all",
                  sortField === 'quantity' 
                    ? "bg-natural-accent text-white border-natural-accent" 
                    : "bg-white text-natural-muted border-natural-border hover:bg-natural-bg"
                )}
              >
                <Hash className="w-3 h-3" />
                Qty {sortField === 'quantity' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-[32px] border-2 border-dashed border-natural-border">
            <p className="text-sm font-bold text-natural-muted uppercase tracking-widest">No entries logged</p>
            <p className="text-[10px] text-natural-muted/60 mt-1 uppercase tracking-widest font-black">Scan to begin session</p>
          </div>
        ) : filteredAndSortedEntries.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-[32px] border border-natural-border">
            <p className="text-[10px] font-black text-natural-muted uppercase tracking-widest">No matches found</p>
          </div>
        ) : (
          filteredAndSortedEntries.map((entry, idx) => (
            <motion.div
              key={entry.date + idx}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "group relative flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm",
                (idx === 0 && sortField === 'date' && sortOrder === 'desc')
                  ? "bg-natural-screen border-natural-accent/30 ring-1 ring-natural-accent/5 shadow-md" 
                  : "bg-white border-natural-border"
              )}
            >
              {(idx === 0 && sortField === 'date' && sortOrder === 'desc') && (
                <div className="absolute -top-2 left-6 px-2 py-0.5 bg-natural-accent text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">
                  Latest Action
                </div>
              )}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-opacity",
                  (idx === 0 && sortField === 'date' && sortOrder === 'desc') ? "bg-natural-accent animate-pulse" : "bg-natural-accent opacity-30"
                )} />
                <div className="min-w-0">
                  <div className={cn(
                    "font-bold truncate tracking-tight transition-colors",
                    (idx === 0 && sortField === 'date' && sortOrder === 'desc') ? "text-natural-accent" : "text-natural-text"
                  )}>{entry.name}</div>
                  <div className="text-[10px] text-natural-muted flex items-center gap-2 mt-0.5 font-black uppercase tracking-wider">
                    <span>{entry.barcode}</span>
                    <span className="text-natural-border">•</span>
                    <span>{new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-xl font-black text-natural-accent leading-none">
                  {entry.quantity}
                </div>
                <div className="text-[9px] font-black text-natural-muted uppercase tracking-widest mt-0.5">{entry.uom}</div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
