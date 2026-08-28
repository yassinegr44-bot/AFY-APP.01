import { LayoutDashboard, Users, Plus, Refrigerator, BarChart2, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface NavbarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export function Navbar({ currentScreen, onNavigate }: NavbarProps) {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deceased', label: 'Décès', icon: Users },
    { id: 'new', label: 'Nouveau', icon: Plus, isMain: true },
    { id: 'reports', label: 'Rapports', icon: FileText, adminOnly: true },
    { id: 'frigo', label: 'Frigo', icon: Refrigerator },
    { id: 'statistics', label: 'Stats', icon: BarChart2, adminOnly: true },
  ];

  const filteredItems = items.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-2 py-3 z-50 transition-colors duration-300">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1">
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm transition-all duration-500",
          isOnline 
            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50" 
            : "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50"
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse",
            isOnline ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-red-500 shadow-sm shadow-red-500/50"
          )} />
          {isOnline ? 'En Ligne' : 'Hors Ligne'}
        </div>
      </div>

      <div className="max-w-md mx-auto flex justify-between items-end">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-200",
              item.isMain ? "relative -top-6" : "flex-1",
              currentScreen === item.id ? "text-[#00695c] dark:text-emerald-400" : "text-slate-400 dark:text-slate-600"
            )}
          >
            {item.isMain ? (
              <div className="bg-[#00695c] dark:bg-emerald-600 text-white p-4 rounded-xl shadow-xl shadow-[#00695c]/20 dark:shadow-emerald-900/20 hover:bg-[#005a4f] dark:hover:bg-emerald-500 transition-all active:scale-95">
                <item.icon size={28} strokeWidth={3} />
              </div>
            ) : (
              <>
                <item.icon size={22} strokeWidth={currentScreen === item.id ? 2.5 : 2} />
                <span className={cn("text-[10px] mt-1 font-bold uppercase tracking-tighter", currentScreen === item.id ? "opacity-100" : "opacity-80")}>
                  {item.label}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
