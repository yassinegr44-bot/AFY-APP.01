import { useState } from 'react';
import { Plus, Search, User } from 'lucide-react';
import { AppData, AmputeeRecord } from '../types';

interface AmputeeListProps {
  data: AppData;
  onNavigate: (screen: string) => void;
  onSelectAmputee: (id: string) => void;
}

export function AmputeeList({ data, onNavigate, onSelectAmputee }: AmputeeListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { amputees = [] } = data || {};

  const filteredAmputees = amputees.filter(a => 
    (a.name && a.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (a.firstName && a.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.refNumber && a.refNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Personnes Amputées</h1>
        <button 
          onClick={() => onNavigate('new-amputee')}
          className="bg-[#006050] dark:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Plus size={16} /> Nouveau dossier
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Rechercher par nom, prénom ou référence..." 
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#006050]/20 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredAmputees.map((a: AmputeeRecord) => (
          <div key={a.id} onClick={() => onSelectAmputee(a.id)} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-[#006050] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[#006050]">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{a.firstName} {a.name}</h3>
                <p className="text-xs text-slate-400">{a.refNumber}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
