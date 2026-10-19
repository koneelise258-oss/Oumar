import React from 'react';
import { ShoppingBag, MessageCircle, Sun, Moon } from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({ cartCount, onOpenCart }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-[#fafbfc]/85 dark:bg-[#0b0f17]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2 group"
        >
          <span className="font-extrabold tracking-wider uppercase text-slate-950 dark:text-white font-['Outfit']">
            OUMAR IPHONE
          </span>
          <span className="text-[11px] font-medium tracking-widest text-slate-400 dark:text-slate-500 uppercase hidden sm:inline">
            · Abidjan
          </span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#catalogue"
            className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Catalogue
          </a>
          <a
            href="#garantie"
            className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Garantie & SAV
          </a>
          <a
            href="#boutique"
            className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Boutique Abidjan
          </a>
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            TikTok @oumariphone
          </a>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* WhatsApp Direct */}
          <a
            href={WHATSAPP_URL("Bonjour OUMAR IPHONE, je souhaite des renseignements sur vos disponibilités.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/50 rounded-full transition-colors whitespace-nowrap shrink-0"
            aria-label="Contacter Oumar iPhone sur WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp Direct</span>
          </a>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-full transition-colors shrink-0"
            aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            title={isDark ? 'Mode clair' : 'Mode sombre'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative p-2 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-full transition-colors shrink-0"
            aria-label="Voir le panier"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-[10px] font-bold text-white dark:text-slate-950 tabular-nums">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
