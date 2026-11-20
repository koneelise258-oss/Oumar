import React from 'react';
import { siApple, siWhatsapp, siTiktok } from 'simple-icons';
import { IoPhonePortraitOutline, IoPhonePortrait } from 'react-icons/io5';

interface BrandIconProps {
  className?: string;
  'aria-hidden'?: boolean;
  title?: string;
}

/**
 * Logo officiel Apple (importé directement depuis simple-icons, aucun tracé manuel).
 */
export const AppleLogo: React.FC<BrandIconProps> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true,
  title
}) => (
  <svg
    role={ariaHidden ? undefined : 'img'}
    aria-hidden={ariaHidden}
    aria-label={ariaHidden ? undefined : title || 'Apple'}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    {title && <title>{title}</title>}
    <path d={siApple.path} />
  </svg>
);

/**
 * Logo officiel WhatsApp (importé directement depuis simple-icons, aucun tracé manuel).
 */
export const WhatsAppLogo: React.FC<BrandIconProps> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true,
  title
}) => (
  <svg
    role={ariaHidden ? undefined : 'img'}
    aria-hidden={ariaHidden}
    aria-label={ariaHidden ? undefined : title || 'WhatsApp'}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    {title && <title>{title}</title>}
    <path d={siWhatsapp.path} />
  </svg>
);

/**
 * Logo officiel TikTok (importé directement depuis simple-icons, aucun tracé manuel).
 */
export const TikTokLogo: React.FC<BrandIconProps> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true,
  title
}) => (
  <svg
    role={ariaHidden ? undefined : 'img'}
    aria-hidden={ariaHidden}
    aria-label={ariaHidden ? undefined : title || 'TikTok'}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    {title && <title>{title}</title>}
    <path d={siTiktok.path} />
  </svg>
);

/**
 * Icône SVG officielle iPhone style iOS (importée depuis react-icons/io5 Ionicons).
 */
export const IPhoneIcon: React.FC<{ className?: string; 'aria-hidden'?: boolean }> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true
}) => <IoPhonePortraitOutline className={className} aria-hidden={ariaHidden} />;

/**
 * Icône SVG officielle iPhone pleine style iOS (importée depuis react-icons/io5 Ionicons).
 */
export const IPhoneSolidIcon: React.FC<{ className?: string; 'aria-hidden'?: boolean }> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true
}) => <IoPhonePortrait className={className} aria-hidden={ariaHidden} />;
