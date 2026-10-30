import { useState, useEffect } from 'react';

export type PerformanceTier = 'low' | 'medium' | 'high';

export interface DevicePerformanceProfile {
  tier: PerformanceTier;
  enableGlassmorphism: boolean;
  enableHeavyShadows: boolean;
  enableParallax: boolean;
  maxConcurrentPreloads: number;
  isSlowConnection: boolean;
  prefersReducedMotion: boolean;
  isMobile: boolean;
  cores: number;
  ramGB: number;
}

/**
 * Détecte intelligemment les capacités réelles de l'appareil (CPU, RAM, Connexion, Mouvement)
 * afin d'adapter l'expérience visuelle sans jamais restreindre les fonctionnalités.
 */
export function detectDevicePerformance(): DevicePerformanceProfile {
  if (typeof window === 'undefined') {
    return {
      tier: 'medium',
      enableGlassmorphism: true,
      enableHeavyShadows: true,
      enableParallax: false,
      maxConcurrentPreloads: 3,
      isSlowConnection: false,
      prefersReducedMotion: false,
      isMobile: false,
      cores: 4,
      ramGB: 4,
    };
  }

  const navigatorAny = navigator as any;

  // 1. Détection CPU & RAM
  const cores = navigatorAny.hardwareConcurrency || 4;
  const ramGB = navigatorAny.deviceMemory || 4;

  // 2. Détection Connexion Réseau
  const connection = navigatorAny.connection || navigatorAny.mozConnection || navigatorAny.webkitConnection;
  const effectiveType = connection?.effectiveType || '4g';
  const saveData = Boolean(connection?.saveData);
  const isSlowConnection = saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';

  // 3. Détection Mouvement Réduit
  const prefersReducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 4. Détection Mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

  // 5. Calcul de la catégorie de performance
  let tier: PerformanceTier = 'high';

  if (prefersReducedMotion || isSlowConnection || cores <= 2 || ramGB <= 2) {
    tier = 'low';
  } else if (cores <= 4 || ramGB <= 4 || isMobile) {
    tier = 'medium';
  } else {
    tier = 'high';
  }

  return {
    tier,
    enableGlassmorphism: tier !== 'low',
    enableHeavyShadows: tier === 'high',
    enableParallax: tier === 'high' && !isMobile,
    maxConcurrentPreloads: tier === 'low' ? 1 : tier === 'medium' ? 3 : 6,
    isSlowConnection,
    prefersReducedMotion,
    isMobile,
    cores,
    ramGB,
  };
}

/**
 * Hook React réactif pour s'adapter aux changements de réseau et de préférences système.
 */
export function useDevicePerformance(): DevicePerformanceProfile {
  const [profile, setProfile] = useState<DevicePerformanceProfile>(detectDevicePerformance);

  useEffect(() => {
    const handleUpdate = () => {
      setProfile(detectDevicePerformance());
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('online', handleUpdate);
    window.addEventListener('offline', handleUpdate);

    const navigatorAny = navigator as any;
    const connection = navigatorAny.connection || navigatorAny.mozConnection || navigatorAny.webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleUpdate);
    }

    const motionQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (motionQuery && motionQuery.addEventListener) {
      motionQuery.addEventListener('change', handleUpdate);
    }

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('online', handleUpdate);
      window.removeEventListener('offline', handleUpdate);
      if (connection) {
        connection.removeEventListener('change', handleUpdate);
      }
      if (motionQuery && motionQuery.removeEventListener) {
        motionQuery.removeEventListener('change', handleUpdate);
      }
    };
  }, []);

  return profile;
}
