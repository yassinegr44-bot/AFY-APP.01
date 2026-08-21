import { MoreVertical, Settings, LogOut, User, Shield } from 'lucide-react';
import { useState } from 'react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  title: string;
  onNavigate?: (screen: string) => void;
}

export function Header({ title, onNavigate }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleNavigate = (screen: string) => {
    if (onNavigate) {
      onNavigate(screen);
      setShowMenu(false);
    }
  };

  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center z-40">
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      
      <div className="relative">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors"
        >
          <MoreVertical size={24} className="text-slate-600" />
        </button>

        <AnimatePresence>
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)} 
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="p-2">
                  <MenuButton icon={User} label="Mon Compte" onClick={() => handleNavigate('settings')} />
                  <MenuButton icon={Shield} label="Administration" onClick={() => handleNavigate('settings')} />
                  <MenuButton icon={Settings} label="Paramètres" onClick={() => handleNavigate('settings')} />
                  <hr className="my-1 border-slate-100" />
                  <MenuButton 
                    icon={LogOut} 
                    label="Déconnexion" 
                    className="text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function MenuButton({ icon: Icon, label, className, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors ${className}`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
