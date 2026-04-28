import { useState, useMemo } from 'react';
import { HistoryEntry } from '../types';
import { Clock, Edit2, Search, ArrowUpDown, Calendar, Hash, Filter, X, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // New Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(entries.map(e => e.category).filter(Boolean));
    return ['All', ...Array.from(cats)].sort();
  }, [entries]);

  const filteredAndSortedEntries = useMemo(() => {
    let filtered = entries.filter(entry => {
      // Search Filter
      const matchesSearch = entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           entry.barcode.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category Filter
      const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;

      // Date Range Filter
      let matchesDate = true;
      if (startDate || endDate) {
        const entryDate = new Date(entry.date).setHours(0, 0, 0, 0);
        if (startDate) {
          const start = new Date(startDate).setHours(0, 0, 0, 0);
          if (entryDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate).setHours(23, 59, 59, 999);
          if (entryDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesCategory && matchesDate;
    });

    return [...filtered].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' ? b.quantity - a.quantity : a.quantity - b.quantity;
      }
    });
  }, [entries, searchQuery, sortField, sortOrder, selectedCategory, startDate, endDate]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setStartDate('');
    setEndDate('');
    setSortField('date');
    setSortOrder('desc');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (searchQuery) count++;
    return count;
  }, [selectedCategory, startDate, endDate, searchQuery]);

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
            <div className="flex gap-2 px-1">
              <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-natural-muted group-focus-within:text-natural-accent transition-colors" />
                <input 
                  type="text"
                  placeholder="SEARCH ENTRIES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 rounded-xl border border-natural-border focus:border-natural-accent outline-none transition-all text-natural-text font-bold text-[10px] tracking-widest uppercase"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "p-3 rounded-xl border transition-all relative",
                  showFilters || activeFilterCount > 0
                    ? "bg-natural-text text-white border-natural-text" 
                    : "bg-white text-natural-muted border-natural-border hover:bg-natural-bg"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-natural-accent text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-natural-bg animate-in zoom-in">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-white/30 rounded-2xl border border-natural-border/50 mx-1"
                >
                  <div className="p-4 space-y-4">
                    {/* Category Filter */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[8px] font-black text-natural-muted uppercase tracking-[0.2em] ml-1">By Category</label>
                        {selectedCategory !== 'All' && (
                          <button 
                            onClick={() => setSelectedCategory('All')}
                            className="text-[8px] font-black text-natural-accent uppercase tracking-widest"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                              selectedCategory === cat 
                                ? "bg-natural-accent text-white shadow-sm" 
                                : "bg-white/50 text-natural-muted border border-natural-border hover:bg-white"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-2">
                       <label className="text-[8px] font-black text-natural-muted uppercase tracking-[0.2em] ml-1">By Date Range</label>
                       <div className="grid grid-cols-2 gap-2">
                         <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-natural-muted pointer-events-none" />
                            <input 
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 bg-white/50 border border-natural-border rounded-lg text-[10px] font-bold uppercase outline-none focus:border-natural-accent transition-all"
                            />
                         </div>
                         <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-natural-muted pointer-events-none" />
                            <input 
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 bg-white/50 border border-natural-border rounded-lg text-[10px] font-bold uppercase outline-none focus:border-natural-accent transition-all"
                            />
                         </div>
                       </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-4">
                       <button 
                         onClick={resetFilters}
                         className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                       >
                         <X className="w-2.5 h-2.5" />
                         Clear All Filters
                       </button>
                       <button 
                         onClick={() => setShowFilters(false)}
                         className="px-4 py-1.5 bg-natural-text text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                       >
                         Done
                       </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-2 px-1">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-natural-muted uppercase tracking-[0.2em] ml-1">Order By</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSort('date')}
                  className={cn(
                    "flex-1 flex items-center justify-between gap-2 py-2.5 px-4 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all shadow-sm",
                    sortField === 'date' 
                      ? "bg-natural-text text-white border-natural-text" 
                      : "bg-white text-natural-muted border-natural-border hover:bg-natural-bg"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>Date</span>
                  </div>
                  {sortField === 'date' ? (
                    sortOrder === 'desc' ? <ArrowUpDown className="w-3 h-3 rotate-180" /> : <ArrowUpDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-20" />}
                </button>
                <button
                  onClick={() => toggleSort('quantity')}
                  className={cn(
                    "flex-1 flex items-center justify-between gap-2 py-2.5 px-4 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all shadow-sm",
                    sortField === 'quantity' 
                      ? "bg-natural-text text-white border-natural-text" 
                      : "bg-white text-natural-muted border-natural-border hover:bg-natural-bg"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3" />
                    <span>Quantity</span>
                  </div>
                  {sortField === 'quantity' ? (
                    sortOrder === 'desc' ? <ArrowUpDown className="w-3 h-3 rotate-180" /> : <ArrowUpDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-20" />}
                </button>
              </div>
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
          filteredAndSortedEntries.map((entry, idx) => {
            const isExpanded = expandedId === entry.date + idx;
            return (
              <motion.div
                key={entry.date + idx}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setExpandedId(isExpanded ? null : entry.date + idx)}
                className={cn(
                  "group relative flex flex-col p-4 rounded-2xl border transition-all shadow-sm cursor-pointer",
                  (idx === 0 && sortField === 'date' && sortOrder === 'desc')
                    ? "bg-natural-screen border-natural-accent/30 ring-1 ring-natural-accent/5 shadow-md" 
                    : "bg-white border-natural-border",
                  isExpanded && "ring-2 ring-natural-accent ring-offset-2"
                )}
              >
                {(idx === 0 && sortField === 'date' && sortOrder === 'desc') && (
                  <div className="absolute -top-2 left-6 px-2 py-0.5 bg-natural-accent text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm z-10">
                    Latest Action
                  </div>
                )}
                
                <div className="flex items-center justify-between w-full">
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
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-natural-border/50 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[8px] font-black text-natural-muted uppercase tracking-widest">Category</span>
                          <p className="text-[11px] font-bold text-natural-text uppercase leading-tight">
                            {entry.category || 'NO CATEGORY'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-black text-natural-muted uppercase tracking-widest">Log Time</span>
                          <p className="text-[11px] font-bold text-natural-text uppercase leading-tight">
                            {new Date(entry.date).toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-black text-natural-muted uppercase tracking-widest">Unit of Measure</span>
                          <p className="text-[11px] font-bold text-natural-text uppercase leading-tight">
                            {entry.uom}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-black text-natural-muted uppercase tracking-widest">Barcode ID</span>
                          <p className="text-[11px] font-bold text-natural-text uppercase leading-tight font-mono">
                            {entry.barcode}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
