import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface LiquidGlassIconProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const LiquidGlassIcon: React.FC<LiquidGlassIconProps> = ({
  children,
  size = 'md',
  className = '',
  onClick,
  title
}) => {
  const { isDark } = useTheme();

  const sizeClasses = {
    sm: 'w-7 h-7 p-1.5',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5'
  };

  const bgStyle = isDark
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.7) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(241, 245, 249, 0.65) 100%)';

  const shadowStyle = isDark
    ? `
      0 6px 16px -4px rgba(0, 0, 0, 0.35),
      inset 0 1px 0.5px rgba(255, 255, 255, 0.22),
      inset 0 -1px 0.5px rgba(0, 0, 0, 0.45)
    `
    : `
      0 6px 16px -4px rgba(15, 23, 42, 0.08),
      inset 0 1px 0.5px rgba(255, 255, 255, 1),
      inset 0 -1px 0.5px rgba(180, 195, 215, 0.3)
    `;

  const borderStyle = isDark
    ? '1px solid rgba(255, 255, 255, 0.12)'
    : '1px solid rgba(255, 255, 255, 0.88)';

  return (
    <div
      onClick={onClick}
      title={title}
      className={`relative inline-flex items-center justify-center rounded-xl isolate select-none transition-all duration-300 active:scale-95 group ${
        sizeClasses[size]
      } ${className}`}
      style={{
        background: bgStyle,
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        boxShadow: shadowStyle,
        border: borderStyle
      }}
    >
      {/* Subtle Prismatic Rim Highlight */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity"
        style={{
          padding: '1px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(147,197,253,0.25) 35%, rgba(216,180,254,0.25) 65%, rgba(255,255,255,0.2) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(147,197,253,0.3) 35%, rgba(216,180,254,0.3) 65%, rgba(255,255,255,0.7) 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude'
        }}
        aria-hidden="true"
      />

      {/* Internal Glint */}
      <div
        className={`absolute top-0.5 left-1 right-1 h-[1px] pointer-events-none ${
          isDark
            ? 'bg-gradient-to-r from-transparent via-white/30 to-transparent'
            : 'bg-gradient-to-r from-transparent via-white to-transparent'
        }`}
        aria-hidden="true"
      />

      {/* Crisp Icon Glyph */}
      <div className="relative z-10 text-slate-800 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
        {children}
      </div>
    </div>
  );
};
