import React, { useId, useRef, useState, useCallback, PointerEvent } from 'react';
import { useTheme } from '../context/ThemeContext';

export interface LiquidGlassSurfaceProps {
  as?: 'div' | 'button' | 'a';
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (e: React.MouseEvent) => void;
  refractionIntensity?: number; // scale for feDisplacementMap
  chromaticDispersion?: boolean; // subtle rainbow prism along curved rim
  dispersionIntensity?: number; // 0 to 1
  blurIntensity?: number; // in px
  transparency?: number; // 0 to 1
  borderRadius?: string; // e.g. "20px" or "9999px"
  tint?: string;
  darkTint?: string;
  elastic?: boolean; // tactile rubber-band elasticity
  maxStretch?: number; // maximum stretch distance in px
  specularTracking?: boolean; // interactive light reflection tracking
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  'aria-label'?: string;
}

export const LiquidGlassSurface: React.FC<LiquidGlassSurfaceProps> = ({
  as: Component = 'div',
  href,
  target,
  rel,
  onClick,
  refractionIntensity = 12,
  chromaticDispersion = true,
  dispersionIntensity = 0.65,
  blurIntensity = 20,
  transparency = 0.82,
  borderRadius = '24px',
  tint,
  darkTint,
  elastic = false,
  maxStretch = 12,
  specularTracking = true,
  className = '',
  style,
  children,
  'aria-label': ariaLabel,
  ...restProps
}) => {
  const { isDark } = useTheme();

  // Unique SVG Filter ID for this glass surface instance to prevent collisions
  const uniqueId = useId().replace(/:/g, '_');
  const filterId = `liquid-refract-${uniqueId}`;

  const containerRef = useRef<HTMLElement>(null);
  const [lightCoords, setLightCoords] = useState({ x: 50, y: 35 });
  const isPointerDownRef = useRef(false);
  const startPointerRef = useRef({ x: 0, y: 0 });

  // Specular light position calculation on pointer hover/move
  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      if (specularTracking) {
        setLightCoords({ x: Math.round(x), y: Math.round(y) });
      }

      // Elastic rubber-band stretching when held and dragged
      if (elastic && isPointerDownRef.current) {
        const deltaX = e.clientX - startPointerRef.current.x;
        const deltaY = e.clientY - startPointerRef.current.y;

        const stretchX = deltaX / (1 + Math.abs(deltaX) / maxStretch);
        const stretchY = deltaY / (1 + Math.abs(deltaY) / maxStretch);

        const skewX = Math.max(-5, Math.min(5, stretchX * -0.3));
        const skewY = Math.max(-5, Math.min(5, stretchY * 0.3));

        containerRef.current.style.transition = 'none';
        containerRef.current.style.transform = `translate3d(${stretchX}px, ${stretchY}px, 0) scale(0.975) skew(${skewX}deg, ${skewY}deg)`;
      }
    },
    [elastic, maxStretch, specularTracking]
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!elastic) return;
      isPointerDownRef.current = true;
      startPointerRef.current = { x: e.clientX, y: e.clientY };

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Fallback
      }

      if (containerRef.current) {
        containerRef.current.style.transition = 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)';
        containerRef.current.style.transform = 'scale(0.975)';
      }
    },
    [elastic]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!elastic) return;
      isPointerDownRef.current = false;

      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Fallback
      }

      if (containerRef.current) {
        containerRef.current.style.transition =
          'transform 0.48s cubic-bezier(0.34, 1.56, 0.64, 1)';
        containerRef.current.style.transform = 'translate3d(0, 0, 0) scale(1) skew(0deg, 0deg)';
      }
    },
    [elastic]
  );

  const handlePointerCancel = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!elastic) return;
      isPointerDownRef.current = false;
      if (containerRef.current) {
        containerRef.current.style.transition =
          'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        containerRef.current.style.transform = 'translate3d(0, 0, 0) scale(1) skew(0deg, 0deg)';
      }
    },
    [elastic]
  );

  // Compute adaptive theme colors
  const activeTint = isDark
    ? darkTint || 'rgba(30, 41, 59, 0.72)'
    : tint || 'rgba(255, 255, 255, 0.84)';

  const activeBackground = isDark
    ? `
      radial-gradient(
        circle 220px at ${lightCoords.x}% ${lightCoords.y}%,
        rgba(255, 255, 255, 0.14) 0%,
        transparent 70%
      ),
      linear-gradient(
        135deg,
        ${activeTint} 0%,
        rgba(15, 23, 42, ${transparency * 0.85}) 50%,
        ${activeTint} 100%
      )
    `
    : `
      radial-gradient(
        circle 220px at ${lightCoords.x}% ${lightCoords.y}%,
        rgba(255, 255, 255, 0.45) 0%,
        transparent 70%
      ),
      linear-gradient(
        135deg,
        ${activeTint} 0%,
        rgba(248, 250, 252, ${transparency * 0.75}) 50%,
        ${activeTint} 100%
      )
    `;

  const activeBoxShadow = isDark
    ? `
      0 24px 48px -12px rgba(0, 0, 0, 0.5),
      0 8px 16px -6px rgba(0, 0, 0, 0.3),
      inset 0 1.2px 0.5px rgba(255, 255, 255, 0.25),
      inset 0 -1.2px 1.5px rgba(0, 0, 0, 0.45)
    `
    : `
      0 24px 48px -12px rgba(15, 23, 42, 0.08),
      0 8px 16px -6px rgba(15, 23, 42, 0.04),
      inset 0 1.5px 0.5px rgba(255, 255, 255, 0.98),
      inset 0 -1.5px 1.5px rgba(180, 195, 215, 0.28)
    `;

  const borderGradient = isDark
    ? `linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.4) 0%,
        rgba(147, 197, 253, ${dispersionIntensity * 0.4}) 22%,
        rgba(216, 180, 254, ${dispersionIntensity * 0.4}) 45%,
        rgba(253, 230, 138, ${dispersionIntensity * 0.3}) 68%,
        rgba(255, 255, 255, 0.2) 100%
      )`
    : `linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(147, 197, 253, ${dispersionIntensity * 0.45}) 22%,
        rgba(216, 180, 254, ${dispersionIntensity * 0.45}) 45%,
        rgba(253, 230, 138, ${dispersionIntensity * 0.35}) 68%,
        rgba(255, 255, 255, 0.75) 100%
      )`;

  return (
    <>
      {/* Bespoke SVG Optical Refraction Filter for this glass surface */}
      <svg
        className="absolute w-0 h-0 pointer-events-none overflow-hidden"
        style={{ position: 'absolute', width: 0, height: 0 }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id={filterId}
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.038"
              numOctaves="2"
              result="turbulence"
            />
            <feGaussianBlur in="turbulence" stdDeviation="1.8" result="smoothNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="smoothNoise"
              scale={refractionIntensity}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
          </filter>
        </defs>
      </svg>

      {/* The Polymorphic Glass Element */}
      <Component
        ref={containerRef as any}
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        aria-label={ariaLabel}
        className={`relative isolate select-none overflow-hidden transition-all duration-300 ${
          elastic ? 'touch-pan-y cursor-pointer' : ''
        } ${className}`}
        style={{
          borderRadius,
          backdropFilter: `blur(${blurIntensity}px) saturate(${isDark ? '170%' : '155%'})`,
          WebkitBackdropFilter: `blur(${blurIntensity}px) saturate(${isDark ? '170%' : '155%'})`,
          background: activeBackground,
          boxShadow: activeBoxShadow,
          willChange: elastic ? 'transform' : 'auto',
          ...style
        }}
        {...restProps}
      >
        {/* Optical Prismatic / Rainbow Dispersion Rim Highlight */}
        {chromaticDispersion && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius,
              padding: '1.2px',
              background: borderGradient,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude'
            }}
            aria-hidden="true"
          />
        )}

        {/* Controlled Specular Glint along Top Edge */}
        <div
          className={`absolute inset-x-0 top-0 h-[1px] pointer-events-none ${
            isDark
              ? 'bg-gradient-to-r from-transparent via-white/40 to-transparent'
              : 'bg-gradient-to-r from-transparent via-white/95 to-transparent'
          }`}
          aria-hidden="true"
        />

        {/* Content Container */}
        <div className="relative z-10 w-full h-full">{children}</div>
      </Component>
    </>
  );
};
