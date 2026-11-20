import { useState, useEffect } from 'react';

export interface AbidjanStoreStatus {
  isOpen: boolean;
  statusLabel: string;
  detailLabel: string;
  abidjanTime: string;
}

const OPEN_MINUTES = 8 * 60 + 30;  // 08h30
const CLOSE_MINUTES = 19 * 60 + 30; // 19h30

/**
 * Calcule automatiquement si la boutique OUMAR IPHONE à Abidjan (GMT+0 / Africa/Abidjan)
 * est actuellement ouverte ou fermée selon l'horaire réel en Côte d'Ivoire (Lun - Sam : 08h30 - 19h30).
 */
export function getAbidjanStoreStatus(now: Date = new Date()): AbidjanStoreStatus {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Abidjan',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(now);

    const weekday = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 12);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    const totalMinutes = hour * 60 + minute;

    const paddedHour = String(hour).padStart(2, '0');
    const paddedMin = String(minute).padStart(2, '0');
    const abidjanTime = `${paddedHour}h${paddedMin}`;

    const isSunday = weekday.toLowerCase().startsWith('sun');
    const isSaturday = weekday.toLowerCase().startsWith('sat');

    if (!isSunday && totalMinutes >= OPEN_MINUTES && totalMinutes < CLOSE_MINUTES) {
      const remaining = CLOSE_MINUTES - totalMinutes;
      const detailLabel =
        remaining <= 60
          ? `Ferme dans ${remaining} min (19h30 Abidjan)`
          : `Ouvert jusqu'à 19h30 · ${abidjanTime} Abidjan`;

      return {
        isOpen: true,
        statusLabel: 'Ouvert maintenant',
        detailLabel,
        abidjanTime
      };
    }

    if (isSunday) {
      return {
        isOpen: false,
        statusLabel: 'Fermé (Dimanche)',
        detailLabel: 'Réouverture lundi à 08h30 (Abidjan)',
        abidjanTime
      };
    }

    if (totalMinutes < OPEN_MINUTES) {
      return {
        isOpen: false,
        statusLabel: 'Bientôt ouvert',
        detailLabel: `Ouverture aujourd'hui à 08h30 · ${abidjanTime} Abidjan`,
        abidjanTime
      };
    }

    return {
      isOpen: false,
      statusLabel: 'Fermé actuellement',
      detailLabel: isSaturday
        ? 'Réouverture lundi à 08h30 (Abidjan)'
        : 'Réouverture demain à 08h30 (Abidjan)',
      abidjanTime
    };
  } catch {
    return {
      isOpen: true,
      statusLabel: 'Lun - Sam : 08h30 - 19h30',
      detailLabel: 'Heure d’Abidjan (GMT)',
      abidjanTime: ''
    };
  }
}

/**
 * Hook temps réel : actualise automatiquement le statut d'ouverture d'Abidjan chaque minute.
 */
export function useAbidjanStoreStatus(): AbidjanStoreStatus {
  const [status, setStatus] = useState<AbidjanStoreStatus>(() => getAbidjanStoreStatus());

  useEffect(() => {
    const update = () => setStatus(getAbidjanStoreStatus());
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return status;
}
