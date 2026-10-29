import React, { useState } from 'react';
import { 
  ShoppingBag, 
  MessageCircle, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Video, 
  Home, 
  Package, 
  ShieldCheck, 
  Search
} from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  activeSection?: string;
  onNavigateSection?: (sectionId: string) => void;
  onOpenSearch: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  cartCount, 
  onOpenCart,
  activeSection = 'home',
  onNavigateSection,
  onOpenSearch
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      if (sectionId === 'home') {
        window.history.pushState(null, '', '/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.history.pushState(null, '', `#${sectionId}`);
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#fafbfc]/90 dark:bg-[#0b0f17]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Zone 1: Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => handleNavClick(e, 'home')}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2 group cursor-pointer"
        >
          <span className="font-extrabold tracking-wider uppercase text-slate-950 dark:text-white font-['Outfit'] transition-transform group-hover:scale-105 duration-200">
            OUMAR IPHONE
          </span>
          <span className="text-[11px] font-medium tracking-widest text-slate-400 dark:text-slate-500 uppercase hidden sm:inline">
            · Abidjan
          </span>
        </a>

        {/* Zone 2: Desktop Navigation Links (Strict order: Accueil, Vidéos, Catalogue, Garantie, TikTok) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium">
          {/* 1. Accueil */}
          <a
            href="/"
            onClick={(e) => handleNavClick(e, 'home')}
            className={`px-3.5 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap ${
              activeSection === 'home'
                ? 'font-bold text-slate-950 dark:text-white bg-slate-200/70 dark:bg-slate-800 shadow-xs scale-105'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            Accueil
          </a>

          {/* 2. Vidéos */}
          <a
            href="#videos"
            onClick={(e) => handleNavClick(e, 'videos')}
            className={`px-3.5 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'videos'
                ? 'font-bold text-slate-950 dark:text-white bg-slate-200/70 dark:bg-slate-800 shadow-xs scale-105'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <span>Vidéos</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </a>

          {/* 3. Catalogue */}
          <a
            href="#catalogue"
            onClick={(e) => handleNavClick(e, 'catalogue')}
            className={`px-3.5 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap ${
              activeSection === 'catalogue'
                ? 'font-bold text-slate-950 dark:text-white bg-slate-200/70 dark:bg-slate-800 shadow-xs scale-105'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            Catalogue
          </a>

          {/* 4. Garantie & SAV */}
          <a
            href="#garantie"
            onClick={(e) => handleNavClick(e, 'garantie')}
            className={`px-3.5 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap ${
              activeSection === 'garantie'
                ? 'font-bold text-slate-950 dark:text-white bg-slate-200/70 dark:bg-slate-800 shadow-xs scale-105'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            Garantie & SAV
          </a>

          {/* 5. TikTok @oumar_iphone.0 */}
          <a
            href="https://www.tiktok.com/@oumar_iphone.0"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 whitespace-nowrap"
          >
            TikTok @oumar_iphone.0
          </a>
        </nav>

        {/* Zone 3: Interactive Controls */}
        {/* Desktop Controls */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* Global Search Button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs font-medium transition-all duration-200 cursor-pointer border border-slate-200/60 dark:border-slate-700/60 shadow-xs hover:scale-105"
            title="Rechercher sur tout le site (Ctrl+K)"
            aria-label="Rechercher sur tout le site"
          >
            <Search className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span className="text-slate-400 dark:text-slate-400">Rechercher...</span>
            <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md">
              ⌘K
            </kbd>
          </button>

          {/* WhatsApp Direct Contact Button */}
          <a
            href={WHATSAPP_URL("Bonjour OUMAR IPHONE, je souhaite des renseignements sur vos disponibilités à Abidjan.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 transition-all duration-200 hover:scale-105"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="xl:inline">WhatsApp Direct</span>
          </a>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-full transition-all duration-200 shrink-0 cursor-pointer hover:scale-110"
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
            className="relative p-2 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-full transition-all duration-200 shrink-0 cursor-pointer hover:scale-110"
            aria-label="Voir le panier"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-[10px] font-bold text-white dark:text-slate-950 tabular-nums animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Header Controls: ONLY Search Loupe & Hamburger Menu (as requested) */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0">
          {/* Cart badge on mobile header for convenience */}
          <button
            onClick={onOpenCart}
            className="relative p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-full transition-colors cursor-pointer"
            aria-label="Panier"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-[10px] font-bold text-white dark:text-slate-950 tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          {/* Search Loupe Button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-full transition-colors cursor-pointer"
            aria-label="Rechercher"
            title="Rechercher"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Hamburger Menu (Les trois barres) containing EVERYTHING from navbar */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-full transition-colors cursor-pointer"
            aria-label="Menu de navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 animate-spin" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer (Contains EVERYTHING from navbar as requested) */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-3 pb-6 border-b border-slate-200 dark:border-slate-800 bg-[#fafbfc]/98 dark:bg-[#0b0f17]/98 backdrop-blur-md space-y-4 animate-in slide-in-from-top-3 duration-200 shadow-xl">
          
          {/* Search Input Quick Trigger inside Mobile Menu */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenSearch();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-medium border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
          >
            <Search className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Rechercher un iPhone, Mac, capacité...</span>
          </button>

          {/* Navigation Links inside Mobile Menu */}
          <div className="space-y-1">
            {/* 1. Accueil */}
            <a
              href="/"
              onClick={(e) => handleNavClick(e, 'home')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                activeSection === 'home'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Accueil</span>
            </a>

            {/* 2. Vidéos */}
            <a
              href="#videos"
              onClick={(e) => handleNavClick(e, 'videos')}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                activeSection === 'videos'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Video className="w-4 h-4" />
                <span>Vidéos de présentation</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </a>

            {/* 3. Catalogue */}
            <a
              href="#catalogue"
              onClick={(e) => handleNavClick(e, 'catalogue')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                activeSection === 'catalogue'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Catalogue officiel</span>
            </a>

            {/* 4. Garantie & SAV */}
            <a
              href="#garantie"
              onClick={(e) => handleNavClick(e, 'garantie')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                activeSection === 'garantie'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Garantie Apple & SAV</span>
            </a>

            {/* 5. TikTok */}
            <a
              href="https://www.tiktok.com/@oumar_iphone.0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span>TikTok @oumar_iphone.0</span>
              <span className="text-xs text-slate-400">↗</span>
            </a>
          </div>

          {/* Theme & WhatsApp Actions in Mobile Menu */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Mode Clair</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span>Mode Sombre</span>
                </>
              )}
            </button>

            <a
              href={WHATSAPP_URL("Bonjour OUMAR IPHONE, je souhaite des renseignements sur vos disponibilités.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp Direct</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
