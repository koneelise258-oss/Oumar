import React, { useState } from 'react';
import { Lock, Mail, X, ShieldAlert, ArrowRight, ShieldCheck, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import { setAdminAuthenticated } from '../data/storeSettings';
import { isSupabaseConfigured, signInAdminWithPassword, SUPABASE_PROJECT_ID } from '../lib/supabase';

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
  // Supabase Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setAuthError(null);

    try {
      const result = await signInAdminWithPassword(email, password);
      if (result.isAdmin && result.user) {
        setAdminAuthenticated(true, result.user.email);
        setIsLoading(false);
        onSuccess();
      } else {
        setAuthError(result.error || "Accès refusé : Ce compte n'est pas répertorié comme administrateur actif.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setAuthError(err?.message || "Erreur lors de l'authentification.");
      setIsLoading(false);
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

      <div className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-slate-900 dark:text-white transition-all animate-in fade-in zoom-in-95 duration-150">
        
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
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3 shadow-inner border border-emerald-100 dark:border-emerald-900/50">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white font-['Outfit']">
            Espace Direction & Gestion
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Accès sécurisé réservé à la direction et à l'équipe OUMAR IPHONE.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Service momentanément indisponible :</strong> La connexion au serveur distant est en cours d'initialisation. Veuillez contacter l'assistance technique de la boutique.
            </span>
          </div>
        )}

        {/* AUTH FORM (EMAIL + PASSWORD) */}
        <form onSubmit={handleSupabaseSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Adresse e-mail professionnelle
            </label>
            <div className="relative">
              <input
                type="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="direction@oumar-iphone.ci"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !isSupabaseConfigured}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Vérification des droits...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Se connecter à l'espace de gestion</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            Accès protégé par chiffrement sécurisé · Boutique officielle OUMAR IPHONE Abidjan
          </p>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Espace professionnel sécurisé · OUMAR IPHONE SARL</span>
        </div>

      </div>
    </div>
  );
};
