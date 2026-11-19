import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  ArrowLeft,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  Clock,
  Sun,
  Moon
} from 'lucide-react';
import { setAdminAuthenticated } from '../data/storeSettings';
import { isSupabaseConfigured, signInAdminWithPassword } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import {
  getLoginLockState,
  recordFailedLoginAttempt,
  resetLoginAttempts
} from '../utils/security';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Page dédiée d'authentification sécurisée (plein écran, sans fenêtre pop-up).
 * Protections actives : anti-brute force exponentiel, honeypot anti-bot,
 * PKCE + RBAC Supabase, nettoyage mémoire du mot de passe et balise noindex.
 */
export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Champ piège (honeypot) invisible destiné à bloquer les bots automatisés
  const [honeypot, setHoneypot] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lockSeconds, setLockSeconds] = useState<number>(0);

  // Injecter dynamiquement noindex/nofollow pendant l'affichage de la page d'authentification
  useEffect(() => {
    if (!isOpen) return;
    const prevTitle = document.title;
    document.title = 'Accès Privé — OUMAR IPHONE';
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;
    const prevContent = meta?.content || '';
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
      created = true;
    }
    meta.content = 'noindex, nofollow, noarchive';

    return () => {
      document.title = prevTitle;
      if (meta) {
        if (created) {
          meta.remove();
        } else {
          meta.content = prevContent;
        }
      }
    };
  }, [isOpen]);

  // Synchroniser l'état du verrouillage anti-brute force à l'ouverture et pendant le décompte
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setShowPassword(false);
      setAuthError(null);
      return;
    }

    const syncLock = () => {
      const state = getLoginLockState();
      setLockSeconds(state.isLocked ? state.remainingSeconds : 0);
    };

    syncLock();
    const interval = window.setInterval(syncLock, 1000);
    return () => window.clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isLockedOut = lockSeconds > 0;

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isLockedOut) return;

    // Blocage silencieux si le champ honeypot est rempli par un bot
    if (honeypot.trim().length > 0) {
      recordFailedLoginAttempt();
      setPassword('');
      setAuthError("Identifiants invalides ou accès non autorisé.");
      return;
    }

    const currentLock = getLoginLockState();
    if (currentLock.isLocked) {
      setLockSeconds(currentLock.remainingSeconds);
      return;
    }

    if (!email.trim() || !password) return;

    setIsLoading(true);
    setAuthError(null);

    try {
      const result = await signInAdminWithPassword(email, password);
      if (result.isAdmin && result.user) {
        resetLoginAttempts();
        setAdminAuthenticated(true, result.user.email);
        setPassword('');
        setIsLoading(false);
        onSuccess();
      } else {
        setPassword('');
        const lockAfter = recordFailedLoginAttempt();
        if (lockAfter.isLocked) {
          setLockSeconds(lockAfter.remainingSeconds);
          setAuthError(
            `Trop de tentatives échouées. Accès temporairement verrouillé pendant ${lockAfter.remainingSeconds} s.`
          );
        } else {
          setAuthError(result.error || "Identifiants invalides ou accès non autorisé.");
        }
        setIsLoading(false);
      }
    } catch {
      setPassword('');
      const lockAfter = recordFailedLoginAttempt();
      if (lockAfter.isLocked) {
        setLockSeconds(lockAfter.remainingSeconds);
      }
      setAuthError("Identifiants invalides ou accès non autorisé.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#fafbfc] dark:bg-[#080d1a] text-slate-900 dark:text-white transition-colors">
      {/* Minimal Top Navigation Bar */}
      <header className="w-full h-16 px-4 sm:px-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la boutique</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold tracking-wider uppercase font-['Outfit'] text-slate-900 dark:text-white hidden sm:inline">
            OUMAR IPHONE
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Dedicated Full-Page Login Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-9 transition-colors">
          {/* Header Emblem */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-900/50">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white font-['Outfit']">
              Espace Direction Sécurisé
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Connectez-vous avec votre compte administrateur autorisé pour gérer le catalogue et les médias.
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Service momentanément indisponible :</strong> La connexion sécurisée au serveur est en cours d'initialisation.
              </span>
            </div>
          )}

          {isLockedOut && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5">
              <Clock className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>
                <strong>Protection anti-intrusion active :</strong> Veuillez patienter{' '}
                <strong className="tabular-nums">{lockSeconds} s</strong> avant une nouvelle tentative.
              </span>
            </div>
          )}

          {/* AUTH FORM */}
          <form onSubmit={handleSupabaseSubmit} className="space-y-4" autoComplete="on">
            {/* Champ honeypot anti-bot caché hors écran */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="website_verification">Ne pas remplir</label>
              <input
                id="website_verification"
                name="website_verification"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Identifiant e-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  autoFocus
                  required
                  maxLength={254}
                  autoComplete="username"
                  disabled={isLockedOut || isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full min-h-[46px] text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={128}
                  autoComplete="current-password"
                  disabled={isLockedOut || isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full min-h-[46px] text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-12 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono disabled:opacity-50"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && !isLockedOut && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isSupabaseConfigured || isLockedOut}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Vérification chiffrée...</span>
                </>
              ) : isLockedOut ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Verrouillé ({lockSeconds} s)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Accéder au Tableau de Bord</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center space-y-1.5">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Chiffrement PKCE · URL Masquée · Contrôle RBAC Serveur</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Accès strictement réservé à la direction OUMAR IPHONE SARL.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export const AdminLoginPage = AdminAuthModal;
