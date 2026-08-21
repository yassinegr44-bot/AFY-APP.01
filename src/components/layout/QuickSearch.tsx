import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, ArrowRight, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DeceasedRecord } from '../../types';
import { cn } from '../../lib/utils';

interface QuickSearchProps {
  records: DeceasedRecord[];
  onSelect: (id: string) => void;
}

export function QuickSearch({ records, onSelect }: QuickSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeceasedRecord[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length > 1) {
      const filtered = records.filter(r => 
        r.name.toLowerCase().includes(query.toLowerCase()) || 
        r.refNumber.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query, records]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative mb-6">
      <div 
        className={cn(
          "flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300",
          isOpen ? "ring-2 ring-[#006050]/10 border-[#006050]/20" : ""
        )}
      >
        <Search className={cn("text-slate-400 transition-colors", isOpen && "text-[#006050] dark:text-emerald-400")} size={18} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Recherche rapide (Nom ou REF)..."
          className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-medium"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-slate-300 hover:text-slate-500">
            <X size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.length > 1 && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/10 dark:bg-slate-950/40 backdrop-blur-[2px]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 transition-colors duration-300"
            >
              <div className="p-2">
                {results.length > 0 ? (
                  results.map((record) => (
                    <button
                      key={record.id}
                      onClick={() => handleSelect(record.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          record.isUnknown ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                        )}>
                          {record.isUnknown ? <Hash size={18} /> : <User size={18} />}
                        </div>
                        <div>
                          <p className={cn(
                            "text-sm font-black tracking-tight leading-tight transition-colors",
                            record.isUnknown ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-slate-100"
                          )}>
                            {record.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {record.refNumber}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-[#006050] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 dark:text-slate-700">
                      <Search size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucun résultat trouvé</p>
                  </div>
                )}
              </div>
              {results.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 p-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest text-center">
                    Tapez pour affiner la recherche
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
