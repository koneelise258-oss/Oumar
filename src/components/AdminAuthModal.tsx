import React, { useState } from 'react';
import { Lock, Mail, KeyRound, X, ShieldAlert, ArrowRight, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { verifyAdminPin, setAdminAuthenticated } from '../data/storeSettings';
import { isSupabaseConfigured, signInAdminWithPassword, SUPABASE_PROJECT_ID } from '../lib/supabase';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMode = 'supabase' | 'pin';

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Default to Supabase Auth if configured, otherwise fallback PIN
  const [authMode, setAuthMode] = useState<AuthMode>(isSupabaseConfigured ? 'supabase' : 'pin');
  
  // Supabase Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // PIN fallback state
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

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
        setAuthError(result.error || "Accès refusé : Ce compte n'est pas autorisé.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setAuthError(err?.message || "Erreur lors de l'authentification.");
      setIsLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    if (verifyAdminPin(pin)) {
      setAdminAuthenticated(true, 'Admin Local (PIN)');
      setPinError(false);
      setPin('');
      onSuccess();
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2500);
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
            Accès sécurisé réservé à la direction d’OUMAR IPHONE Abidjan.
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('supabase');
              setAuthError(null);
            }}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'supabase'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>Supabase Auth</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('pin');
              setAuthError(null);
            }}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'pin'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>Code PIN de secours</span>
          </button>
        </div>

        {/* TAB 1: SUPABASE AUTH (EMAIL + PASSWORD) */}
        {authMode === 'supabase' && (
          <form onSubmit={handleSupabaseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Adresse e-mail administrateur
              </label>
              <div className="relative">
                <input
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@oumar-iphone.ci"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mot de passe Supabase
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
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Vérification des droits...</span>
                </>
              ) : (
                <>
                  <span>Connexion Cloud Sécurisée</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              Vérification stricte de l’appartenance à la table <code className="text-emerald-600 dark:text-emerald-400 font-mono">store_admins</code> de Supabase ({SUPABASE_PROJECT_ID}).
            </p>
          </form>
        )}

        {/* TAB 2: EMERGENCY PIN (TRANSITION) */}
        {authMode === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Code PIN Administrateur
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className={`w-full text-center text-lg tracking-widest font-mono font-bold bg-slate-50 dark:bg-slate-800/80 border rounded-xl py-3 px-4 focus:outline-none transition-colors ${
                    pinError
                      ? 'border-rose-500 text-rose-600 focus:ring-2 focus:ring-rose-500'
                      : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-950 dark:focus:ring-white'
                  }`}
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-4" />
              </div>

              {pinError && (
                <p className="text-xs text-rose-500 mt-1.5 text-center flex items-center justify-center gap-1 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Code PIN incorrect. Veuillez réessayer.</span>
                </p>
              )}

              <p className="text-[11px] text-slate-400 text-center mt-2">
                Mode de transition local. Code par défaut : <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">2025</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-slate-950 dark:bg-white dark:text-slate-950 hover:opacity-90 active:scale-[0.98] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Déverrouiller via PIN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Protection RBAC Supabase · OUMAR IPHONE SARL</span>
        </div>

      </div>
    </div>
  );
};
