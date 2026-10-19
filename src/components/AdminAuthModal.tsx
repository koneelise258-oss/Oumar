import React, { useState } from 'react';
import { Lock, KeyRound, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { verifyAdminPin, setAdminAuthenticated } from '../data/storeSettings';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    if (verifyAdminPin(pin)) {
      setAdminAuthenticated(true);
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
      setAttempts((prev) => prev + 1);
      setTimeout(() => setError(false), 2500);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-slate-900 dark:text-white transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white font-['Outfit']">
            Espace Administrateur
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Accès sécurisé réservé à la direction d’OUMAR IPHONE Abidjan.
          </p>
        </div>

        {/* PIN Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Code PIN ou Mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className={`w-full text-center text-lg tracking-widest font-mono font-bold bg-slate-50 dark:bg-slate-800/80 border rounded-xl py-3 px-4 focus:outline-none transition-colors ${
                  error
                    ? 'border-rose-500 text-rose-600 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-950 dark:focus:ring-white'
                }`}
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-4" />
            </div>
            {error && (
              <p className="text-xs text-rose-500 mt-1.5 text-center flex items-center justify-center gap-1 font-medium">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Code incorrect. Veuillez réessayer.</span>
              </p>
            )}
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Code PIN d’usine initial : <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">2025</code>
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-slate-950 dark:bg-white dark:text-slate-950 hover:opacity-90 active:scale-[0.98] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Déverrouiller l’espace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400">
          Chiffrement de session locale · OUMAR IPHONE SARL
        </div>

      </div>
    </div>
  );
};
