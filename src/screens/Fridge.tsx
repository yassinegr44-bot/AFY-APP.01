import { motion } from 'motion/react';
import { Refrigerator, User, ArrowRight, MoreVertical, AlertTriangle, Settings, Power } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useState } from 'react';

interface FridgeProps {
  data: any;
  onSelectDeceased: (id: string) => void;
  onNavigate: (screen: string) => void;
}

export function Fridge({ data, onSelectDeceased, onNavigate }: FridgeProps) {
  const { fridge = [], deceased = [], amputees = [] } = data || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  // Normal fridges: 1 to 10
  const normalFridges = fridge.filter((p: any) => p.fridgeNumber >= 1 && p.fridgeNumber <= 10).sort((a: any, b: any) => a.fridgeNumber - b.fridgeNumber);
  const occupiedNormalCount = normalFridges.filter((p: any) => p.status === 'occupied').length;

  // Frigo 11 (Unité Médico-Légale)
  const frigo11 = fridge.find((p: any) => p.fridgeNumber === 11);
  const isFrigo11Occupied = frigo11?.status === 'occupied';
  const frigo11Record = isFrigo11Occupied ? (amputees.find((a: any) => a.id === frigo11.deceasedId) || deceased.find((d: any) => d.id === frigo11.deceasedId)) : null;

  // Frigo 12 (Unité Néonatale): positions 1 to 15
  const frigo12Positions = fridge.filter((p: any) => p.fridgeNumber === 12).sort((a: any, b: any) => a.position - b.position);
  const occupied12Count = frigo12Positions.filter((p: any) => p.status === 'occupied').length;

  const updateFridgeStatus = async (id: string, status: 'available' | 'occupied' | 'panne' | 'out_of_service') => {
    setLoading(id);
    try {
      await updateDoc(doc(db, 'fridge', id), { status });
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-[#006050]/20 text-[#006050] dark:text-emerald-400 p-2 rounded-lg">
            <Refrigerator size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Gestion des Frigos (12 Frigos)</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Frigos 1-10 (Normaux) • Frigo 11 (Médico-Légal) • Frigo 12 (Néonatal)
            </p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('settings')}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Frigos 1 à 10 (Normaux) */}
      <div className="space-y-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
          const pos = normalFridges.find((p: any) => p.fridgeNumber === num);
          const isOccupied = pos?.status === 'occupied';
          const record = isOccupied ? deceased.find((d: any) => d.id === pos.deceasedId) : null;
          const posLabel = `Frigo ${num.toString().padStart(2, '0')}`;

          return (
            <section key={num} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 transition-colors duration-300 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frigo {num}</p>
                  <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Frigo Normal {num}</h2>
                </div>
                <span className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full",
                  isOccupied 
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "bg-emerald-50 dark:bg-emerald-900/30 text-[#006050] dark:text-emerald-400"
                )}>
                  {isOccupied ? 'Occupé (1/1)' : 'Disponible (0/1)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => isOccupied && record && onSelectDeceased(record.id)}
                  className={cn(
                    "p-4 rounded-xl border flex items-center justify-between transition-all text-left",
                    isOccupied
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{isOccupied ? '🔵' : '⚪'}</span>
                    <div>
                      <p className="text-xs font-black">{posLabel}</p>
                      <p className="text-xs font-bold opacity-90 truncate max-w-[200px]">
                        {isOccupied ? (record?.name || 'Occupé') : 'Libre'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold underline">Voir</span>
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* Frigo 11 (Unité Médico-Légale) */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 transition-colors duration-300 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frigo 11</p>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Unité Médico-Légale</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Membres amputés</p>
          </div>
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Capacité : 10</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cases (10)</p>
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 10 }).map((_, i) => {
              const posNum = i + 1;
              const pos = fridge.find((p: any) => p.fridgeNumber === 11 && p.position === posNum);
              const isOccupied = pos?.status === 'occupied';
              const record = isOccupied ? (amputees.find((a: any) => a.id === pos.deceasedId) || deceased.find((d: any) => d.id === pos.deceasedId)) : null;

              return (
                <div key={posNum} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500">{posNum.toString().padStart(2, '0')}</span>
                  <button
                    onClick={() => isOccupied && record && (record.refNumber?.startsWith('AMP') ? onNavigate('amputee') : onSelectDeceased(record.id))}
                    title={isOccupied ? record?.name || 'Occupé' : 'Libre'}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm",
                      isOccupied 
                        ? "bg-blue-600 text-white hover:scale-110" 
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"
                    )}
                  >
                    <div className={cn("w-3 h-3 rounded-full", isOccupied ? "bg-white" : "bg-slate-400")} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-2">
            <div className="w-3 h-3 bg-slate-200 dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700" />
            <span>Libre</span>
            <div className="w-3 h-3 bg-blue-600 rounded-full ml-2" />
            <span>Occupé</span>
            <span className="ml-auto italic">ⓘ Cliquez sur une case pour voir les détails</span>
          </div>
        </div>
      </section>

      {/* Frigo 12 (Unité Néonatale) */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 transition-colors duration-300 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frigo 12</p>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Unité Néonatale</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Fœtus, Mort-né, Enfants &lt; 1 an</p>
          </div>
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Capacité : 15</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cases (15)</p>
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 15 }).map((_, i) => {
              const posNum = i + 1;
              const pos = fridge.find((p: any) => p.fridgeNumber === 12 && p.position === posNum);
              const isOccupied = pos?.status === 'occupied';
              const record = isOccupied ? deceased.find((d: any) => d.id === pos.deceasedId) : null;

              return (
                <div key={posNum} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500">{posNum.toString().padStart(2, '0')}</span>
                  <button
                    onClick={() => isOccupied && record && onSelectDeceased(record.id)}
                    title={isOccupied ? record?.name || 'Occupé' : 'Libre'}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm",
                      isOccupied 
                        ? "bg-blue-600 text-white hover:scale-110" 
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"
                    )}
                  >
                    <div className={cn("w-3 h-3 rounded-full", isOccupied ? "bg-white" : "bg-slate-400")} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-2">
            <div className="w-3 h-3 bg-slate-200 dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700" />
            <span>Libre</span>
            <div className="w-3 h-3 bg-blue-600 rounded-full ml-2" />
            <span>Occupé</span>
            <span className="ml-auto italic">ⓘ Cliquez sur une case pour voir les détails</span>
          </div>
        </div>
      </section>
    </div>
  );
}
