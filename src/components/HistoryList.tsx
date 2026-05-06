import { useState, useMemo } from 'react';
import { HistoryEntry } from '../types';
import { Clock, Edit2, Search, ArrowUpDown, Calendar, Hash, Filter, X, ChevronDown, Check, ClipboardCheck, Box, History, CheckCircle2 } from 'lucide-react';
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
  const [selectedType, setSelectedType] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'activity' | 'summary'>('activity');

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

      // Type Filter
      const matchesType = selectedType === 'All' || entry.type === selectedType;

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

      return matchesSearch && matchesCategory && matchesType && matchesDate;
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
    setSelectedType('All');
    setStartDate('');
    setEndDate('');
    setSortField('date');
    setSortOrder('desc');
  };

  const stats = useMemo(() => {
    return filteredAndSortedEntries.reduce((acc, curr) => {
      if (curr.type === 'OUT') {
        acc.out += curr.quantity;
      } else if (curr.type === 'IN') {
        acc.in += curr.quantity;
      } else if (curr.type === 'AUDIT') {
        acc.auditCount++;
      }
      return acc;
    }, { in: 0, out: 0, auditCount: 0 });
  }, [filteredAndSortedEntries]);

  const stockSummary = useMemo(() => {
    const summary: Record<string, { barcode: string, name: string, in: number, out: number, lastAudit: number | null, uom: string }> = {};
    
    entries.forEach(entry => {
      if (!summary[entry.barcode]) {
        summary[entry.barcode] = { barcode: entry.barcode, name: entry.name, in: 0, out: 0, lastAudit: null, uom: entry.uom };
      }
      if (entry.type === 'IN') summary[entry.barcode].in += entry.quantity;
      if (entry.type === 'OUT') summary[entry.barcode].out += entry.quantity;
      if (entry.type === 'AUDIT') summary[entry.barcode].lastAudit = entry.quantity;
    });
    
    return Object.values(summary);
  }, [entries]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedType !== 'All') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (searchQuery) count++;
    return count;
  }, [selectedCategory, startDate, endDate, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Stock Activity Summary */}
      <div className="grid grid-cols-3 gap-2 px-1">
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">Put (IN)</span>
          </div>
          <div className="text-xl font-black text-emerald-700 flex items-baseline gap-1">
            {stats.in.toLocaleString()}
            <span className="text-[9px] opacity-70">{stats.in === 1 ? 'unit' : 'units'}</span>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black text-red-700 uppercase tracking-widest">Take (OUT)</span>
          </div>
          <div className="text-xl font-black text-red-700 flex items-baseline gap-1">
            {stats.out.toLocaleString()}
            <span className="text-[9px] opacity-70">{stats.out === 1 ? 'unit' : 'units'}</span>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black text-blue-700 uppercase tracking-widest">Audits</span>
          </div>
          <div className="text-xl font-black text-blue-700 flex items-baseline gap-1">
            {stats.auditCount.toLocaleString()}
            <span className="text-[9px] opacity-70">logs</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* View Switcher */}
        <div className="flex bg-natural-bg p-1 rounded-2xl border border-natural-border/50 shadow-inner">
          <button 
            onClick={() => setView('activity')}
            className={cn(
              "flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all",
              view === 'activity' ? "bg-white text-natural-accent shadow-sm" : "text-natural-muted hover:text-natural-text"
            )}
          >
            Transaction Log
          </button>
          <button 
            onClick={() => setView('summary')}
            className={cn(
              "flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all",
              view === 'summary' ? "bg-white text-natural-accent shadow-sm" : "text-natural-muted hover:text-natural-text"
            )}
          >
            Stock Balance
          </button>
        </div>

        {view === 'activity' ? (
          <>
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Records
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
                  className="w-full pl-10 pr-4 py-3.5 bg-white/50 rounded-xl border border-natural-border focus:border-natural-accent outline-none transition-all text-natural-text font-bold text-xs tracking-widest uppercase"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "p-3.5 rounded-xl border transition-all relative min-w-[48px] flex items-center justify-center",
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">By Category</label>
                        {selectedCategory !== 'All' && (
                          <button 
                            onClick={() => setSelectedCategory('All')}
                            className="text-[10px] font-black text-natural-accent uppercase tracking-widest px-2 py-1 hover:bg-natural-accent/5 rounded-md transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                              "px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all min-h-[40px] flex items-center justify-center",
                              selectedCategory === cat 
                                ? "bg-natural-accent text-white shadow-md shadow-natural-accent/20" 
                                : "bg-white/70 text-natural-muted border border-natural-border hover:bg-white"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] ml-1">By Transaction Type</label>
                       <div className="flex gap-2">
                         {['All', 'IN', 'OUT'].map(t => (
                           <button
                             key={t}
                             onClick={() => setSelectedType(t)}
                             className={cn(
                               "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                               selectedType === t 
                                 ? "bg-natural-text text-white border-natural-text" 
                                 : "bg-white/70 text-natural-muted border-natural-border hover:bg-white"
                             )}
                           >
                             {t === 'All' ? 'Every' : t === 'IN' ? 'Put' : 'Take'}
                           </button>
                         ))}
                       </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] ml-1">By Date Range</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted pointer-events-none" />
                            <input 
                              type="date"
                              value={startDate}
                              aria-label="Start Date"
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-natural-border rounded-xl text-xs font-bold uppercase outline-none focus:border-natural-accent transition-all min-h-[48px]"
                            />
                         </div>
                         <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted pointer-events-none" />
                            <input 
                              type="date"
                              value={endDate}
                              aria-label="End Date"
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-natural-border rounded-xl text-xs font-bold uppercase outline-none focus:border-natural-accent transition-all min-h-[48px]"
                            />
                         </div>
                       </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-4 border-t border-natural-border/30">
                       <button 
                         onClick={resetFilters}
                         className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-2 p-2"
                       >
                         <X className="w-3.5 h-3.5" />
                         Clear All
                       </button>
                       <button 
                         onClick={() => setShowFilters(false)}
                         className="px-6 py-3 bg-natural-text text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-transform"
                       >
                         Apply & Close
                       </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-3 px-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] ml-1">Order By</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => toggleSort('date')}
                  className={cn(
                    "flex flex-items items-center justify-between gap-2 py-3.5 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm min-h-[48px]",
                    sortField === 'date' 
                      ? "bg-natural-text text-white border-natural-text shadow-md shadow-black/10" 
                      : "bg-white text-natural-muted border-natural-border hover:bg-natural-bg"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Date</span>
                  </div>
                  {sortField === 'date' ? (
                    sortOrder === 'desc' ? <ArrowUpDown className="w-3.5 h-3.5 rotate-180" /> : <ArrowUpDown className="w-3.5 h-3.5" />
                  ) : <ArrowUpDown className="w-3.5 h-3.5 opacity-20" />}
                </button>
                <button
                  onClick={() => toggleSort('quantity')}
                  className={cn(
                    "flex items-center justify-between gap-2 py-3.5 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm min-h-[48px]",
                    sortField === 'quantity' 
                      ? "bg-natural-text text-white border-natural-text shadow-md shadow-black/10" 
                      : "bg-white text-natural-muted border-natural-border hover:bg-natural-bg"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" />
                    <span>Quantity</span>
                  </div>
                  {sortField === 'quantity' ? (
                    sortOrder === 'desc' ? <ArrowUpDown className="w-3.5 h-3.5 rotate-180" /> : <ArrowUpDown className="w-3.5 h-3.5" />
                  ) : <ArrowUpDown className="w-3.5 h-3.5 opacity-20" />}
                </button>
              </div>
            </div>
          </div>
        )}

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
                      entry.type === 'IN' ? "bg-emerald-500" :
                      entry.type === 'OUT' ? "bg-red-500" :
                      "bg-blue-500",
                      (idx === 0 && sortField === 'date' && sortOrder === 'desc') && "animate-pulse"
                    )} />
                    <div className="min-w-0">
                      <div className={cn(
                        "font-bold truncate tracking-tight transition-colors flex items-center gap-2",
                        (idx === 0 && sortField === 'date' && sortOrder === 'desc') ? "text-natural-accent" : "text-natural-text"
                      )}>
                        {entry.name}
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest leading-none",
                          entry.type === 'IN' 
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                            : entry.type === 'OUT'
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        )}>
                          {entry.type === 'AUDIT' ? 'AUDIT' : entry.type || 'IN'}
                        </span>
                      </div>
                      <div className="text-[11px] text-natural-muted flex items-center gap-2 mt-0.5 font-black uppercase tracking-wider">
                        <span>{entry.barcode}</span>
                        <span className="text-natural-border">•</span>
                        <span>{new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={cn(
                      "text-xl font-black leading-none tabular-nums tracking-tighter",
                      entry.type === 'IN' ? "text-emerald-600" :
                      entry.type === 'OUT' ? "text-red-500" :
                      "text-blue-600"
                    )}>
                      {entry.type === 'IN' ? '+' : entry.type === 'OUT' ? '-' : ''}{entry.quantity}
                    </div>
                    <div className="text-[10px] font-black text-natural-muted uppercase tracking-widest mt-0.5">{entry.uom}</div>
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
                          <span className="text-[10px] font-black text-natural-muted uppercase tracking-widest">Category</span>
                          <p className="text-[11px] font-bold text-natural-text uppercase leading-tight">
                            {entry.category || 'NO CATEGORY'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-natural-muted uppercase tracking-widest">Entry Type</span>
                          <p className="text-[11px] font-bold text-natural-text uppercase leading-tight">
                            {entry.type === 'IN' ? 'Stock Added' : entry.type === 'OUT' ? 'Stock Removed' : 'Manual Audit'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-natural-muted uppercase tracking-widest">Unit of Measure</span>
                          <p className="text-[11px] font-bold text-natural-text uppercase leading-tight">
                            {entry.uom}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-natural-muted uppercase tracking-widest">Log Time</span>
                          <p className="text-[11px] font-bold text-natural-text uppercase leading-tight">
                            {new Date(entry.date).toLocaleString()}
                          </p>
                        </div>
                        {entry.remarks && (
                          <div className="col-span-2 space-y-1 bg-natural-bg/50 p-3 rounded-xl border border-natural-border/30">
                            <span className="text-[10px] font-black text-natural-muted uppercase tracking-widest flex items-center gap-2">
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              Operator Remarks
                            </span>
                            <p className="text-[11px] font-medium text-natural-text leading-relaxed italic">
                              "{entry.remarks}"
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
        </div>
      </>
    ) : (
          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] flex items-center gap-2">
                <Box className="w-3.5 h-3.5" />
                Inventory Balance
              </h3>
            </div>

            {stockSummary.length === 0 ? (
              <div className="text-center py-20 bg-white/50 rounded-[32px] border-2 border-dashed border-natural-border">
                <Box className="w-12 h-12 text-natural-muted/20 mx-auto mb-4" />
                <p className="text-natural-muted font-black text-xs uppercase tracking-widest">No stock data available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {stockSummary.map((item, idx) => {
                  const netStock = item.in - item.out;
                  return (
                    <motion.div
                      key={item.barcode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white p-5 rounded-3xl border border-natural-border shadow-sm group hover:border-natural-accent transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="min-w-0">
                          <h4 className="font-black text-natural-text truncate uppercase tracking-tight text-lg leading-none mb-1">{item.name}</h4>
                          <div className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">{item.barcode}</div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "text-3xl font-black tabular-nums tracking-tighter leading-none",
                            netStock > 0 ? "text-emerald-600" : netStock < 0 ? "text-red-500" : "text-natural-text"
                          )}>
                            {netStock}
                            <span className="text-xs ml-1 opacity-50 font-black">{item.uom}</span>
                          </div>
                          <div className="text-[9px] font-black text-natural-muted uppercase tracking-widest mt-1">Available</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-emerald-50/50 rounded-xl p-2 text-center border border-emerald-100/50">
                          <div className="text-[8px] font-black text-emerald-700/60 uppercase tracking-widest mb-0.5 text-center">In</div>
                          <div className="text-xs font-black text-emerald-600 tabular-nums">{item.in}</div>
                        </div>
                        <div className="bg-red-50/50 rounded-xl p-2 text-center border border-red-100/50">
                          <div className="text-[8px] font-black text-red-700/60 uppercase tracking-widest mb-0.5 text-center">Out</div>
                          <div className="text-xs font-black text-red-500 tabular-nums">{item.out}</div>
                        </div>
                        <div className="bg-blue-50/50 rounded-xl p-2 text-center border border-blue-100/50">
                          <div className="text-[8px] font-black text-blue-700/60 uppercase tracking-widest mb-0.5 text-center">Audit</div>
                          <div className="text-xs font-black text-blue-600 tabular-nums">
                            {item.lastAudit !== null ? item.lastAudit : '—'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
