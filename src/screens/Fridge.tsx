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
  const { fridge = [], deceased = [] } = data || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const occupiedCount = fridge.filter((p: any) => p.status === 'occupied').length;
  const availableCount = fridge.filter((p: any) => p.status === 'available').length;

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
    <div className="space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-[#006050]/20 text-[#006050] dark:text-emerald-400 p-2 rounded-lg">
            <Refrigerator size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">AFY Clinical</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Frigo — Occupation de la Morgue (12 Positions)
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

      {/* Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 text-center transition-colors duration-300">
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">Occupation Actuelle</h2>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">{occupiedCount} Occupés | {availableCount} Disponibles</p>
        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Occupé</span>
          </div>
        </div>
      </div>

      {/* Vertical List of Fridge Positions */}
      <div className="space-y-3">
        {Array.from({ length: 12 }, (_, i) => {
          const posNum = (i + 1).toString().padStart(2, '0');
          const posData = fridge.find((p: any) => p.position === (i + 1));
          const isOccupied = posData?.status === 'occupied';
          const isPanne = posData?.status === 'panne';
          const isOutOfService = posData?.status === 'out_of_service';
          const record = isOccupied ? deceased.find((d: any) => d.id === posData.deceasedId) : null;
          const status = posData?.status || 'available';

          return (
            <div
              key={posNum}
              className={cn(
                "w-full bg-white dark:bg-slate-900 rounded-xl border p-4 flex items-center justify-between text-left transition-all",
                isOccupied 
                  ? "border-l-4 border-l-red-400 border-slate-100 dark:border-slate-800" 
                  : isPanne ? "border-l-4 border-l-amber-400 border-slate-100 dark:border-slate-800"
                  : isOutOfService ? "border-l-4 border-l-slate-400 border-slate-100 dark:border-slate-800"
                  : "border-l-4 border-l-emerald-400 border-slate-100 dark:border-slate-800"
              )}
            >
              <button
                onClick={() => isOccupied && record && onSelectDeceased(record.id)}
                className="flex items-center gap-4 flex-1"
              >
                <span className="text-xl font-black text-slate-300 dark:text-slate-800 w-8">{posNum}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FRIGO {posNum}</p>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold",
                      isOccupied ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : isPanne ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      : isOutOfService ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    )}>
                      {isOccupied ? 'Occupé' : isPanne ? 'En Panne' : isOutOfService ? 'Hors Service' : 'Disponible'}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm font-bold",
                    isOccupied ? "text-slate-800 dark:text-slate-100" : "text-slate-300 dark:text-slate-700"
                  )}>
                    {isOccupied ? (record?.name || record?.refNumber || 'Occupé') : '—'}
                  </p>
                  {isOccupied && record && (
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-tighter">
                      REF: {record.refNumber}
                    </p>
                  )}
                </div>
              </button>
              {user?.role === 'admin' && (
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => updateFridgeStatus(posData.id, 'available')}
                        disabled={loading === posData.id}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-emerald-600"
                        title="Disponible"
                    >
                        <Power size={14} />
                    </button>
                    <button 
                        onClick={() => updateFridgeStatus(posData.id, 'panne')}
                        disabled={loading === posData.id}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-amber-600"
                        title="En Panne"
                    >
                        <AlertTriangle size={14} />
                    </button>
                    <button 
                        onClick={() => updateFridgeStatus(posData.id, 'out_of_service')}
                        disabled={loading === posData.id}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600"
                        title="Hors Service"
                    >
                        <Settings size={14} />
                    </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
