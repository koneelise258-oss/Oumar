import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, MessageCircle, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';
import { getHeroCustomPhoto } from '../data/storeSettings';
import { Product } from '../types';
import { LiquidGlassSurface } from './LiquidGlassSurface';
import { LiquidGlassIcon } from './LiquidGlassIcon';
import heroTitaniumSample from '../assets/images/hero_iphone_titanium_1792367905192.jpg';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface HeroProps {
  featuredProduct?: Product;
  onAddToCart?: (product: Product) => void;
  onExploreCatalog?: () => void;
}

const DEFAULT_OUMAR_PHOTO_PATH = heroTitaniumSample;

export const Hero: React.FC<HeroProps> = () => {
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  // Synchronize visual height strictly from text top to action buttons bottom on desktop
  useEffect(() => {
    if (!contentRef.current || !actionsRef.current) return;
    const updateHeight = () => {
      if (window.innerWidth >= 1024 && contentRef.current && actionsRef.current) {
        const contentTop = contentRef.current.getBoundingClientRect().top;
        const actionsBottom = actionsRef.current.getBoundingClientRect().bottom;
        const targetHeight = Math.round(actionsBottom - contentTop);
        setContentHeight(targetHeight > 0 ? targetHeight : null);
      } else {
        setContentHeight(null);
      }
    };

    updateHeight();
    const ro = new ResizeObserver(() => updateHeight());
    ro.observe(contentRef.current);
    ro.observe(actionsRef.current);
    window.addEventListener('resize', updateHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Image source for Oumar's portrait (configured in Admin Dashboard)
  const [oumarPhotoSrc, setOumarPhotoSrc] = useState<string>(() => {
    return getHeroCustomPhoto() || DEFAULT_OUMAR_PHOTO_PATH;
  });
  const [imageError, setImageError] = useState(false);

  // Real-time synchronization when admin updates the Hero photo
  useEffect(() => {
    const handlePhotoUpdated = (e: any) => {
      const updatedUrl = e.detail;
      if (updatedUrl && typeof updatedUrl === 'string') {
        setOumarPhotoSrc(updatedUrl);
        setImageError(false);
      } else {
        setOumarPhotoSrc(DEFAULT_OUMAR_PHOTO_PATH);
        setImageError(false);
      }
    };

    window.addEventListener('oumar_hero_photo_updated', handlePhotoUpdated);
    return () => window.removeEventListener('oumar_hero_photo_updated', handlePhotoUpdated);
  }, []);

  // Dynamic photo tone detection for adaptive ambient lighting
  const [photoTone, setPhotoTone] = useState<{
    dominantRgb: string;
    brightness: number;
    isDark: boolean;
    isBright: boolean;
  }>({
    dominantRgb: '226, 232, 240',
    brightness: 200,
    isDark: false,
    isBright: true,
  });

  // Sample photo colors and brightness to tune the Hero's ambient extension
  useEffect(() => {
    if (!oumarPhotoSrc || imageError) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = oumarPhotoSrc;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 24, 24);
        const data = ctx.getImageData(0, 0, 24, 24).data;

        let totalR = 0, totalG = 0, totalB = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          totalR += data[i];
          totalG += data[i + 1];
          totalB += data[i + 2];
          count++;
        }

        const avgR = Math.round(totalR / count);
        const avgG = Math.round(totalG / count);
        const avgB = Math.round(totalB / count);
        const brightness = Math.round((avgR * 299 + avgG * 587 + avgB * 114) / 1000);

        setPhotoTone({
          dominantRgb: `${avgR}, ${avgG}, ${avgB}`,
          brightness,
          isDark: brightness < 95,
          isBright: brightness > 215,
        });
      } catch {
        // Fallback silently if canvas access is restricted
      }
    };
  }, [oumarPhotoSrc, imageError]);

  // Master GSAP Coordinated Timeline & ScrollTrigger
  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !heroRef.current) return;

    const ctx = gsap.context(() => {
      // Phase A -> Phase E: Master Coordinated Entrance Timeline
      const tl = gsap.timeline({
        defaults: {
          ease: 'power3.out'
        }
      });

      // Photo-driven background and ambient veil reveal
      tl.fromTo(
        '.hero__photo-background',
        { opacity: 0, scale: 1.18 },
        { opacity: photoTone.isDark ? 0.38 : 0.48, scale: 1.12, duration: 1.2, ease: 'power2.out' },
        0
      )
      .fromTo(
        '.hero__ambient-glow',
        { opacity: 0 },
        { opacity: 1, duration: 1.4, ease: 'power2.out' },
        0
      )
      .fromTo(
        '.hero__background-overlay',
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.out' },
        0.1
      );

      // Phase B: Typography with Masked Line Reveals (zero accent clipping)
      tl.fromTo(
        '.hero-kicker',
        { x: -24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.6'
      )
      .fromTo(
        '.hero-masked-line',
        { yPercent: 125, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.95, stagger: 0.14, ease: 'power4.out' },
        '-=0.45'
      )
      .fromTo(
        '.hero-desc',
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
        '-=0.6'
      );

      // Phase C: Coordinated Portrait Stage Revelation from Right
      tl.fromTo(
        '.hero-portrait-stage',
        { x: 30, opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, duration: 0.95, ease: 'power3.out' },
        '-=0.7'
      )
      .fromTo(
        '.hero-portrait-img',
        { scale: 1.04 },
        { scale: 1, duration: 1.05, ease: 'power3.out' },
        '<'
      );

      // Phase E: Stabilization — Action Buttons & Trust Indicators
      tl.fromTo(
        '.hero-actions',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' },
        '-=0.45'
      )
      .fromTo(
        '.hero-proof-item',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power2.out' },
        '-=0.3'
      );

      // Scroll-Driven Motion via ScrollTrigger (scrubbed, non-blocking parallax)
      gsap.to('.hero-portrait-stage', {
        y: -24,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5
        }
      });

      gsap.to('.hero__photo-background', {
        y: 35,
        scale: 1.16,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5
        }
      });

      gsap.to('.hero-copy-column', {
        y: -24,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5
        }
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleImageError = () => {
    if (oumarPhotoSrc !== DEFAULT_OUMAR_PHOTO_PATH) {
      setOumarPhotoSrc(DEFAULT_OUMAR_PHOTO_PATH);
      setImageError(false);
    } else {
      setImageError(true);
    }
  };

  return (
    <section 
      ref={heroRef}
      className="hero relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden pt-8 pb-16 lg:py-16 transition-colors duration-300"
    >
      {/* ========================================================
          1. COUCHE D'ARRIÈRE-PLAN : Photo importée agrandie et floutée
         ======================================================== */}
      {oumarPhotoSrc && !imageError && (
        <div
          className="hero__photo-background"
          style={{
            backgroundImage: `url("${oumarPhotoSrc}")`
          }}
          aria-hidden="true"
        />
      )}

      {/* ========================================================
          1b. HALO CHROMATIQUE AMBIANT : Diffusion des teintes de la photo
         ======================================================== */}
      {oumarPhotoSrc && !imageError && (
        <div
          className="hero__ambient-glow absolute inset-0 z-[1] pointer-events-none transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at 74% 44%, rgba(${photoTone.dominantRgb}, ${photoTone.isDark ? 0.35 : 0.40}) 0%, transparent 68%)`
          }}
          aria-hidden="true"
        />
      )}

      {/* ========================================================
          2. VOILE DÉGRADÉ ADAPTATIF : Harmonie et lisibilité du texte
         ======================================================== */}
      <div className="hero__background-overlay" aria-hidden="true" />

      {/* ========================================================
          3. FONDU INFÉRIEUR : Transition douce vers le catalogue
         ======================================================== */}
      <div className="hero__bottom-overlay" aria-hidden="true" />

      {/* ========================================================
          4. CONTENU PRINCIPAL : Grille 2 colonnes alignée verticalement
         ======================================================== */}
      <div className="hero__inner px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================
            COLONNE GAUCHE : Typographie & Actions
           ======================================================== */}
        <div 
          ref={contentRef}
          className="hero__content hero-copy-column w-full flex flex-col justify-start text-left min-w-0"
        >
          
          {/* Identity Kicker */}
          <div className="hero-kicker flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-5">
            <span className="font-['Outfit'] tracking-[0.2em] text-slate-900 dark:text-white font-bold">OUMAR IPHONE</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">/</span>
            <span>BOUTIQUE OFFICIELLE · ABIDJAN</span>
          </div>

          {/* Phase B: Main Headline with Clean Masked Line Reveals (No accent clipping) */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight text-slate-950 dark:text-white font-['Outfit'] leading-[1.08] mb-6 [text-wrap:balance]">
            <div className="overflow-hidden pb-1 pt-0.5">
              <span className="hero-masked-line block">
                L'art du titane.
              </span>
            </div>
            <div className="overflow-hidden pb-2.5 pt-0.5">
              <span className="hero-masked-line block text-slate-500 dark:text-slate-400 font-light">
                La pureté du verre.
              </span>
            </div>
          </h1>

          {/* Phase B bis: Concise Supporting Description */}
          <p className="hero-desc text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-9">
            La référence des iPhone neufs scellés et reconditionnés certifiés en Côte d'Ivoire. Sous la direction d'Oumar, profitez d'une sélection rigoureusement inspectée, garantie 12 mois et livrée en 2 heures à Abidjan.
          </p>

          {/* Phase E: Action Buttons avec Interactions Élastiques */}
          <div 
            ref={actionsRef}
            className="hero-actions flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-11"
          >
            {/* Primary CTA: EXPLORER LE CATALOGUE */}
            <LiquidGlassSurface
              as="a"
              href="#catalogue"
              elastic={true}
              maxStretch={8}
              chromaticDispersion={true}
              dispersionIntensity={0.5}
              blurIntensity={14}
              tint="rgba(15, 23, 42, 0.94)"
              darkTint="rgba(248, 250, 252, 0.95)"
              borderRadius="14px"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white dark:text-slate-950 shadow-md transition-all whitespace-nowrap shrink-0 group focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.4)'
              }}
            >
              <span>EXPLORER LE CATALOGUE</span>
              <ArrowDown className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:translate-y-0.5 transition-transform" />
            </LiquidGlassSurface>

            {/* Secondary CTA: CONTACTER SUR WHATSAPP */}
            <LiquidGlassSurface
              as="a"
              href={WHATSAPP_URL("Bonjour Oumar, je vous contacte depuis votre site officiel pour échanger sur vos disponibilités d'iPhone.")}
              target="_blank"
              rel="noopener noreferrer"
              elastic={true}
              maxStretch={12}
              refractionIntensity={14}
              chromaticDispersion={true}
              dispersionIntensity={0.8}
              blurIntensity={18}
              borderRadius="14px"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-emerald-950 dark:hover:text-emerald-400 transition-all whitespace-nowrap shrink-0 group focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>CONTACTER SUR WHATSAPP</span>
            </LiquidGlassSurface>
          </div>

          {/* Phase E bis: Unboxed Proof Indicators with Glass Icon Lenses */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-slate-600 dark:text-slate-400">
            <div className="hero-proof-item flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <LiquidGlassIcon size="sm">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-900 dark:text-slate-100" />
              </LiquidGlassIcon>
              <span>Garantie 12 Mois Oumar</span>
            </div>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <div className="hero-proof-item flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <LiquidGlassIcon size="sm">
                <Zap className="w-3.5 h-3.5 text-slate-900 dark:text-slate-100" />
              </LiquidGlassIcon>
              <span>Livraison 2h à Abidjan</span>
            </div>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <div className="hero-proof-item flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <LiquidGlassIcon size="sm">
                <Sparkles className="w-3.5 h-3.5 text-slate-900 dark:text-slate-100" />
              </LiquidGlassIcon>
              <span>Paiement à la Réception</span>
            </div>
          </div>

        </div>

        {/* ========================================================
            COLONNE DROITE : Photographie principale visible en entier
           ======================================================== */}
        <div 
          className="hero__visual w-full self-start"
          style={{
            height: contentHeight ? `${contentHeight}px` : undefined,
            maxHeight: contentHeight ? `${contentHeight}px` : undefined
          }}
        >
          <div className="hero-portrait-stage relative w-full h-full flex items-center justify-center">
            {!imageError ? (
              <div className="relative flex items-center justify-center w-full h-full max-h-full">
                <img
                  src={oumarPhotoSrc}
                  alt="Oumar — Fondateur OUMAR IPHONE Abidjan"
                  onError={handleImageError}
                  className="hero__photo hero-portrait-img select-none transition-transform duration-700 ease-out"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            ) : (
              <div className="relative flex items-center justify-center w-full h-full max-h-full">
                <img
                  src={DEFAULT_OUMAR_PHOTO_PATH}
                  alt="Oumar — Fondateur OUMAR IPHONE Abidjan"
                  className="hero__photo hero-portrait-img select-none transition-transform duration-700 ease-out"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
