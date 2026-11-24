import { Product } from '../types';

import imgTitanium from '../assets/images/hero_iphone_titanium_1792367905192.jpg';
import img16ProMax from '../assets/images/product_iphone16promax_1792367905798.jpg';
import img15Pro from '../assets/images/product_iphone15pro_1792367905765.jpg';
import imgIpadPro from '../assets/images/product_ipad_pro_m4_1792434382801.jpg';
import imgMacBookPro from '../assets/images/product_macbook_pro_m3_1792434368716.jpg';
import imgAirPodsPro from '../assets/images/product_airpods_pro_2_1792434397170.jpg';

import imgTitaniumBlack from '../assets/images/iphone_titanium_black_1793352446100.jpg';
import imgTitaniumWhite from '../assets/images/iphone_titanium_white_1793352458322.jpg';
import imgTitaniumDesert from '../assets/images/iphone_titanium_desert_1793352471968.jpg';
import imgTitaniumBlue from '../assets/images/iphone_titanium_blue_1793352485208.jpg';
import imgColorRed from '../assets/images/iphone_color_red_1793352498682.jpg';
import imgColorGreen from '../assets/images/iphone_color_green_1793352512334.jpg';

import { getWhatsAppPhone, getWhatsAppUrl } from './storeSettings';
import { normalizeColors } from '../utils/colorUtils';

export const APPLE_ASSET_IMAGES = {
  iphone16ProMax: img16ProMax,
  iphone16Pro: imgTitanium,
  iphone15Pro: img15Pro,
  ipadProM4: imgIpadPro,
  macbookProM3: imgMacBookPro,
  airpodsPro2: imgAirPodsPro,
  titaniumNatural: img16ProMax,
  titaniumBlack: imgTitaniumBlack,
  titaniumWhite: imgTitaniumWhite,
  titaniumDesert: imgTitaniumDesert,
  titaniumBlue: imgTitaniumBlue,
  colorRed: imgColorRed,
  colorGreen: imgColorGreen
};

export const WHATSAPP_PHONE = getWhatsAppPhone();
export const WHATSAPP_URL = (message: string) => getWhatsAppUrl(message);

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    model: 'Flagship Apple Titane A18 Pro',
    category: 'iPhone',
    condition: 'Neuf scellé',
    storage: ['256 Go', '512 Go', '1 To'],
    selectedStorage: '256 Go',
    price: 1150000,
    originalPrice: 1220000,
    storagePrices: {
      '256 Go': 1150000,
      '512 Go': 1320000,
      '1 To': 1490000
    },
    colors: [
      { name: 'Titane Naturel', hex: '#BEB8AE', image: img16ProMax, gallery: [img16ProMax, imgTitanium] },
      { name: 'Titane Désert', hex: '#D4C4B5', image: imgTitaniumDesert, gallery: [imgTitaniumDesert] },
      { name: 'Titane Blanc', hex: '#F2F1ED', image: imgTitaniumWhite, gallery: [imgTitaniumWhite] },
      { name: 'Titane Noir', hex: '#3C3B37', image: imgTitaniumBlack, gallery: [imgTitaniumBlack] }
    ],
    selectedColor: 'Titane Naturel',
    image: img16ProMax,
    gallery: [img16ProMax, imgTitanium],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'Boutique Cocody & Plateau',
    featured: true,
    isNew: true,
    description: 'L’iPhone 16 Pro Max incarne le sommet de l’ingénierie Apple. Conçu dans un châssis en titane de grade 5 microbillé à la fois ultra-léger et d’une solidité exceptionnelle, il arbore le plus grand écran jamais intégré sur un iPhone : une dalle Super Retina XDR de 6,9 pouces bord à bord dotée de la technologie ProMotion 120 Hz et de l’écran toujours activé. Propulsé par la nouvelle puce A18 Pro gravée en 3 nanomètres, il offre des performances graphiques et d’intelligence embarquée inégalées pour le jeu AAA, le montage vidéo 4K à 120 i/s en Dolby Vision et le multitâche intensif. La nouvelle touche physique « Commande de l’appareil photo » permet d’ajuster instantanément l’exposition, la profondeur de champ ou le zoom optique 5x d’un simple glissement du doigt. Livré neuf scellé d’origine Apple avec vérification complète du numéro de série et garantie boutique OUMAR IPHONE à Abidjan.',
    specs: {
      screen: 'Super Retina XDR OLED 6,9" (2868 × 1320 px, 460 ppp), ProMotion 1–120 Hz, Always-On, luminosité jusqu’à 2000 nits en extérieur, Ceramic Shield dernière génération',
      chip: 'Puce Apple A18 Pro (CPU 6 cœurs, GPU 6 cœurs avec Ray Tracing matériel, Neural Engine 16 cœurs, gravure 3 nm 2e gén.)',
      camera: 'Triple système Pro : Capteur principal Fusion 48 Mpx (f/1,78, OIS capteur), Ultra grand-angle 48 Mpx macro, Téléobjectif tétraprisme 12 Mpx Zoom optique 5x · Vidéo 4K Dolby Vision jusqu’à 120 i/s & ProRes Log',
      battery: 'Jusqu’à 33 heures de lecture vidéo, recharge rapide USB-C (50 % en 30 min), charge sans fil MagSafe jusqu’à 25 W et Qi2',
      ports: 'Connecteur USB-C (débits USB 3 jusqu’à 10 Gb/s), Double SIM (Nano-SIM + eSIM / Double eSIM), Wi-Fi 7, Bluetooth 5.3, 5G & NFC',
      boxContents: 'iPhone 16 Pro Max neuf scellé sous iOS 18, Câble de charge USB-C vers USB-C tressé (1 m), Documentation officielle Apple'
    },
    published: true
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    model: 'Pro Series Titane 6,3"',
    category: 'iPhone',
    condition: 'Neuf scellé',
    storage: ['128 Go', '256 Go', '512 Go'],
    selectedStorage: '256 Go',
    price: 990000,
    originalPrice: 1050000,
    storagePrices: {
      '128 Go': 895000,
      '256 Go': 990000,
      '512 Go': 1160000
    },
    colors: [
      { name: 'Titane Désert', hex: '#D4C4B5', image: imgTitaniumDesert, gallery: [imgTitaniumDesert] },
      { name: 'Titane Naturel', hex: '#BEB8AE', image: img16ProMax, gallery: [img16ProMax] },
      { name: 'Titane Noir', hex: '#3C3B37', image: imgTitaniumBlack, gallery: [imgTitaniumBlack] },
      { name: 'Titane Blanc', hex: '#F2F1ED', image: imgTitaniumWhite, gallery: [imgTitaniumWhite] }
    ],
    selectedColor: 'Titane Désert',
    image: imgTitaniumDesert,
    gallery: [imgTitaniumDesert, img16ProMax],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'Boutique Cocody',
    featured: true,
    isNew: true,
    description: 'Toute l’architecture Pro d’Apple concentrée dans un format ergonomique et équilibré de 6,3 pouces. L’iPhone 16 Pro adopte désormais le téléobjectif tétraprisme à zoom optique 5x auparavant réservé au Pro Max, ainsi que le capteur ultra grand-angle de 48 Mpx et les 4 microphones de qualité studio avec réduction active du bruit du vent pour des vidéos d’une clarté cinéma. Son châssis en titane de grade 5 assure une excellente dissipation thermique et une prise en main confortable toute la journée. Idéal pour les utilisateurs exigeants qui veulent la pleine puissance de la puce A18 Pro sans compromis sur la compacité.',
    specs: {
      screen: 'Super Retina XDR OLED 6,3" (2622 × 1206 px, 460 ppp), ProMotion 120 Hz adaptatif, Always-On & Dynamic Island',
      chip: 'Puce Apple A18 Pro (CPU 6 cœurs, GPU 6 cœurs, Neural Engine 16 cœurs, bande passante mémoire accrue)',
      camera: 'Triple capteur Pro : Fusion 48 Mpx, Ultra grand-angle 48 Mpx, Téléobjectif 5x 120 mm · Capture vidéo 4K 120 i/s Dolby Vision & Audio spatial 4 micros studio',
      battery: 'Jusqu’à 27 heures de lecture vidéo, recharge rapide filaire et MagSafe 25 W',
      ports: 'USB-C compatible USB 3 (10 Gb/s), Wi-Fi 7, 5G, Bluetooth 5.3, Face ID haute précision, résistance IP68',
      boxContents: 'iPhone 16 Pro sous iOS 18, Câble USB-C tressé (1 m), Notice et documentation Apple'
    },
    published: true
  },
  {
    id: 'iphone-duo-pack-pro',
    name: 'iPhone Duo (Pack 2 iPhones)',
    model: 'Offre Spéciale Duo Abidjan',
    category: 'iPhone Duo',
    condition: 'Neuf scellé',
    storage: ['256 Go + 128 Go', '512 Go + 256 Go'],
    selectedStorage: '256 Go + 128 Go',
    price: 1390000,
    originalPrice: 1480000,
    storagePrices: {
      '256 Go + 128 Go': 1390000,
      '512 Go + 256 Go': 1590000
    },
    colors: [
      { name: 'Titane Naturel & Noir', hex: '#BEB8AE', image: img16ProMax, gallery: [img16ProMax, imgTitaniumBlack] },
      { name: 'Titane Désert & Blanc', hex: '#D4C4B5', image: imgTitaniumDesert, gallery: [imgTitaniumDesert, imgTitaniumWhite] }
    ],
    selectedColor: 'Titane Naturel & Noir',
    image: img16ProMax,
    gallery: [img16ProMax, imgTitanium],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'Boutique Cocody & Plateau',
    featured: true,
    isNew: true,
    description: 'Le Pack Duo exclusif OUMAR IPHONE réunit deux iPhones authentiques dans un tarif préférentiel pensé pour les couples, collaborateurs, dirigeants ou cadeaux d’exception à Abidjan. Chaque appareil est remis avec son propre coffret scellé, son numéro IMEI vérifiable officiellement sur le site Apple et sa facture nominative. Profitez d’une économie immédiate par rapport à l’achat unitaire tout en bénéficiant de l’accompagnement complet en boutique (transfert de données, configuration iCloud et conseils personnalisés).',
    specs: {
      screen: 'Écrans Super Retina XDR OLED ProMotion 120 Hz avec protection Ceramic Shield et True Tone',
      chip: 'Puces Apple Silicon A18 Pro / A17 Pro haute efficacité énergétique et Neural Engine 16 cœurs',
      camera: 'Systèmes photo Pro 48 Mpx avec mode Portrait avancé, mode Nuit et vidéo 4K Dolby Vision stabilisée',
      battery: 'Deux batteries neuves Apple certifiées à 100 % de capacité avec charge rapide USB-C et MagSafe',
      ports: 'Connectique USB-C haute vitesse, 5G multi-bandes, Wi-Fi 6E/7, Face ID et étanchéité IP68',
      boxContents: 'Deux coffrets iPhone neufs scellés individuels + 2 câbles USB-C tressés d’origine + Factures & garanties boutique'
    },
    published: true
  },
  {
    id: 'ipad-pro-13-m4',
    name: 'iPad Pro 13" M4',
    model: 'Ultra Retina Tandem OLED Puce M4',
    category: 'iPad',
    condition: 'Neuf scellé',
    storage: ['256 Go', '512 Go', '1 To'],
    selectedStorage: '256 Go',
    price: 1090000,
    originalPrice: 1150000,
    storagePrices: {
      '256 Go': 1090000,
      '512 Go': 1250000,
      '1 To': 1450000
    },
    colors: [
      { name: 'Noir Sidéral', hex: '#26282A', image: imgIpadPro },
      { name: 'Argent', hex: '#E3E4E5', image: undefined }
    ],
    selectedColor: 'Noir Sidéral',
    image: imgIpadPro,
    gallery: [imgIpadPro],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'Boutique Cocody & Plateau',
    featured: true,
    isNew: true,
    description: 'L’appareil Apple le plus fin jamais conçu (seulement 5,1 mm d’épaisseur) équipé du révolutionnaire écran Ultra Retina XDR à technologie OLED en tandem. Cette double dalle OLED délivre une précision colorimétrique de niveau studio avec un contraste extrême de 2 000 000:1 et une luminosité HDR jusqu’à 1600 nits. Animé par la puce Apple M4, cet iPad Pro surpasse de nombreux ordinateurs portables en rendu 3D, retouche photo RAW, montage Final Cut Pro et prise de notes avancée avec l’Apple Pencil Pro.',
    specs: {
      screen: '13 pouces Ultra Retina XDR Tandem OLED (2752 × 2064 px), ProMotion 10–120 Hz, large gamme P3, revêtement antireflet',
      chip: 'Puce Apple M4 (CPU jusqu’à 10 cœurs, GPU 10 cœurs avec Ray Tracing matériel, Neural Engine 38 TOPS)',
      camera: 'Caméra arrière 12 Mpx grand-angle + Scanner LiDAR + Flash True Tone adaptatif · Caméra avant paysage 12 Mpx Cadre centré & Face ID',
      battery: 'Batterie Li-Po 38,99 Wh offrant jusqu’à 10 heures d’autonomie en Wi-Fi ou vidéo',
      ports: 'Port Thunderbolt / USB 4 (jusqu’à 40 Gb/s), Smart Connector magnétique, Wi-Fi 6E & Bluetooth 5.3',
      boxContents: 'iPad Pro 13" M4 neuf scellé, Câble de charge USB-C tressé (1 m), Adaptateur secteur USB-C 20W, Chiffonette (modèles 1 To+)'
    },
    published: true
  },
  {
    id: 'ipad-air-11-m2',
    name: 'iPad Air 11" M2',
    model: 'Puce Apple M2 Liquid Retina',
    category: 'iPad',
    condition: 'Neuf scellé',
    storage: ['128 Go', '256 Go', '512 Go'],
    selectedStorage: '128 Go',
    price: 590000,
    originalPrice: 630000,
    storagePrices: {
      '128 Go': 590000,
      '256 Go': 690000,
      '512 Go': 850000
    },
    colors: [
      { name: 'Gris Sidéral', hex: '#53555B', image: imgIpadPro },
      { name: 'Lumière Stellaire', hex: '#E2D8CE', image: undefined },
      { name: 'Bleu', hex: '#A3B9C9', image: undefined },
      { name: 'Mauve', hex: '#C2B6D1', image: undefined }
    ],
    selectedColor: 'Gris Sidéral',
    image: imgIpadPro,
    gallery: [imgIpadPro],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'Boutique Cocody',
    featured: false,
    isNew: true,
    description: 'L’iPad Air 11 pouces franchit un cap décisif avec l’intégration de la puce Apple M2, offrant un bond spectaculaire en fluidité pour les études, la bureautique professionnelle, le dessin numérique et le divertissement. Sa caméra frontale ultra grand-angle de 12 Mpx désormais placée sur le bord paysage rend les appels FaceTime, réunions Zoom et cours en ligne parfaitement naturels, avec le suivi automatique Cadre centré. Compatible avec l’Apple Pencil Pro et le Magic Keyboard, il remplace aisément un ordinateur du quotidien dans un format fin et léger.',
    specs: {
      screen: '11 pouces Liquid Retina IPS (2360 × 1640 px, 264 ppp), affichage laminé antireflet, True Tone & gamme P3',
      chip: 'Puce Apple M2 (CPU 8 cœurs, GPU 9 cœurs, Neural Engine 16 cœurs, 8 Go de mémoire unifiée)',
      camera: 'Caméra arrière 12 Mpx (4K 60 i/s) + Caméra avant paysage 12 Mpx ultra grand-angle avec Cadre centré',
      battery: 'Jusqu’à 10 heures de navigation web Wi-Fi ou de lecture vidéo continue',
      ports: 'USB-C rapide (10 Gb/s), Touch ID intégré au bouton supérieur, Wi-Fi 6E, Bluetooth 5.3, haut-parleurs stéréo paysage',
      boxContents: 'iPad Air 11" M2, Câble de charge USB-C tressé (1 m), Adaptateur secteur USB-C 20W, Documentation'
    },
    published: true
  },
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    model: 'Titane Grade A+',
    category: 'iPhone',
    condition: 'Reconditionné',
    storage: ['256 Go', '512 Go'],
    selectedStorage: '256 Go',
    price: 795000,
    originalPrice: 850000,
    storagePrices: {
      '256 Go': 795000,
      '512 Go': 895000
    },
    colors: [
      { name: 'Titane Naturel', hex: '#BEB8AE', image: img15Pro, gallery: [img15Pro] },
      { name: 'Titane Noir', hex: '#3C3B37', image: imgTitaniumBlack, gallery: [imgTitaniumBlack] },
      { name: 'Titane Bleu', hex: '#2B3545', image: imgTitaniumBlue, gallery: [imgTitaniumBlue] }
    ],
    selectedColor: 'Titane Naturel',
    image: img15Pro,
    gallery: [img15Pro, imgTitaniumBlue],
    batteryHealth: '100%',
    warranty: 'Garantie Oumar 6 mois',
    inStock: true,
    stockLocation: 'Boutique Plateau',
    featured: false,
    description: 'Premier iPhone conçu en titane aérospatial brossé, l’iPhone 15 Pro Max demeure une référence incontournable pour son rapport performances/prix à Abidjan. Il intègre le bouton Action personnalisable (appareil photo, lampe, mode silencieux ou raccourcis), un port USB-C ultra rapide pour transférer vos fichiers vidéo ProRes directement sur disque dur externe, et un téléobjectif périscopique 5x particulièrement apprécié pour les portraits et prises de vue à distance. Chaque exemplaire proposé par OUMAR IPHONE subit plus de 35 points de contrôle matériel (Face ID, caméras, écran original True Tone, étanchéité et batterie vérifiée).',
    specs: {
      screen: 'Super Retina XDR OLED 6,7" (2796 × 1290 px), ProMotion 120 Hz, Dynamic Island & Always-On Display',
      chip: 'Puce Apple A17 Pro gravée en 3 nm (GPU 6 cœurs avec Ray Tracing matériel, 8 Go RAM)',
      camera: 'Capteur principal 48 Mpx ProRAW, Ultra grand-angle 12 Mpx macro, Téléobjectif tétraprisme Zoom optique 5x (120 mm)',
      battery: 'Batterie contrôlée et certifiée en boutique avec santé optimale et autonomie jusqu’à 29h vidéo',
      ports: 'USB-C (débit USB 3 jusqu’à 10 Gb/s), Double eSIM / Nano-SIM, Wi-Fi 6E, 5G, NFC & Face ID',
      boxContents: 'iPhone 15 Pro Max contrôlé Grade A+, Câble USB-C rapide inclus, Facture & Garantie OUMAR IPHONE'
    },
    published: true
  },
  {
    id: 'macbook-pro-14-m3',
    name: 'MacBook Pro 14" M3 Pro',
    model: 'Apple Silicon 18 Go RAM / 512 Go SSD',
    category: 'MacBook',
    condition: 'Neuf scellé',
    storage: ['512 Go SSD', '1 To SSD'],
    selectedStorage: '512 Go SSD',
    price: 1650000,
    originalPrice: 1750000,
    storagePrices: {
      '512 Go SSD': 1650000,
      '1 To SSD': 1890000
    },
    colors: [
      { name: 'Noir Sidéral', hex: '#242527', image: imgMacBookPro },
      { name: 'Argent', hex: '#E3E4E6', image: undefined }
    ],
    selectedColor: 'Noir Sidéral',
    image: imgMacBookPro,
    gallery: [imgMacBookPro],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'Boutique Cocody',
    featured: true,
    isNew: false,
    description: 'Une véritable station de travail mobile pensée pour les développeurs, monteurs vidéo, architectes, designers et entrepreneurs exigeants. Son boîtier monocoque en aluminium anodisé Noir Sidéral reçoit un traitement exclusif limitant les traces de doigts. Son écran Liquid Retina XDR 14,2 pouces offre une luminosité soutenue de 1000 nits (1600 nits en pointe HDR) et un taux de rafraîchissement ProMotion 120 Hz. Doté de 18 Go de mémoire unifiée et de la puce M3 Pro, il maintient un silence quasi total tout en délivrant jusqu’à 18 heures d’autonomie réelle sans prise secteur.',
    specs: {
      screen: 'Liquid Retina XDR 14,2" Mini-LED (3024 × 1964 px), ProMotion 120 Hz, 1600 nits pointe HDR, calibrage XDR de référence',
      chip: 'Puce Apple M3 Pro (CPU 11 cœurs, GPU 14 cœurs, 18 Go mémoire unifiée, SSD NVMe haute vitesse)',
      camera: 'Caméra FaceTime HD 1080p, système audio haute fidélité 6 haut-parleurs Spatial Audio & 3 micros qualité studio',
      battery: 'Batterie 70 Wh offrant jusqu’à 18 heures de lecture vidéo et charge rapide 50 % en 30 min',
      ports: '3× Thunderbolt 4 (USB-C), 1× HDMI (jusqu’à 8K/4K 240Hz), Lecteur carte SDXC, Port MagSafe 3, Prise casque haute impédance',
      boxContents: 'MacBook Pro 14" neuf scellé, Adaptateur secteur USB-C 70W, Câble USB-C vers MagSafe 3 tressé (2 m)'
    },
    published: true
  },
  {
    id: 'airpods-pro-2-usbc',
    name: 'AirPods Pro 2 (USB-C)',
    model: 'Boîtier MagSafe avec haut-parleur et dragonne',
    category: 'Accessoires',
    condition: 'Neuf scellé',
    storage: ['Standard'],
    selectedStorage: 'Standard',
    price: 195000,
    originalPrice: 220000,
    storagePrices: {
      'Standard': 195000
    },
    colors: [
      { name: 'Blanc Pur', hex: '#FFFFFF', image: imgAirPodsPro }
    ],
    selectedColor: 'Blanc Pur',
    image: imgAirPodsPro,
    gallery: [imgAirPodsPro],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'En stock dans toutes les boutiques',
    featured: false,
    isNew: false,
    description: 'Les écouteurs sans fil phares d’Apple dans leur version USB-C dotée d’une résistance renforcée IP54 à la poussière, à la transpiration et aux éclaboussures. Grâce à la puce Apple H2, la Réduction active du bruit bloque jusqu’à deux fois plus de nuisances ambiantes que la génération précédente, tandis que le mode Audio adaptatif ajuste automatiquement l’isolation selon votre environnement à Abidjan. Contrôle tactile du volume directement sur la tige, détection des conversations et localisation ultra-précise du boîtier via la puce U1 et son haut-parleur intégré.',
    specs: {
      screen: 'Voyant LED d’état de charge intégré sur le boîtier + indicateur batterie sur iOS',
      chip: 'Puce Apple H2 dans chaque écouteur + Puce Ultra Wideband U1 dans le boîtier MagSafe pour Localiser',
      camera: 'Audio spatial personnalisé avec suivi dynamique de la tête & détection automatique des conversations',
      battery: 'Jusqu’à 6h d’écoute avec Réduction du bruit activée, et jusqu’à 30h au total avec le boîtier',
      ports: 'Port USB-C (rechargeable par câble d’iPhone), charge sans fil MagSafe, Apple Watch et chargeurs Qi, indice IP54',
      boxContents: 'AirPods Pro 2 USB-C neufs scellés, Boîtier MagSafe avec encoche dragonne, 4 paires d’embouts silicone (XS/S/M/L), Câble USB-C'
    },
    published: true
  }
];

export const PRODUCTS: Product[] = DEFAULT_PRODUCTS;

const STORAGE_KEY = 'oumar_products_catalog';

// Safe loader that synchronizes with localStorage and cleans legacy states
export const loadProducts = (): Product[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => {
          let cond = p.condition;
          if (cond === 'Neuf Original Apple' || cond === 'Neuf Scellé' || cond === 'Neuf') cond = 'Neuf scellé';
          else if (cond === 'Quasi Neuf') cond = 'Quasi neuf';
          else if (cond === 'Reconditionné A+' || cond === 'Reconditionné Certifié') cond = 'Reconditionné';
          else if (!cond) cond = 'Neuf scellé';

          let battery = p.batteryHealth;
          if (battery === '100% Neuf' || battery === '100% Certifiée') battery = '100%';

          // Normaliser toutes les couleurs (anciennes chaînes et objets enrichis)
          let colors = normalizeColors(p.colors || []);
          const defaultRef = DEFAULT_PRODUCTS.find((d) => d.id === p.id);
          if (defaultRef && Array.isArray(defaultRef.colors)) {
            colors = colors.map((c) => {
              const matchedDef = defaultRef.colors.find(
                (dc) => dc.name.toLowerCase().trim() === c.name.toLowerCase().trim()
              );
              if (matchedDef && matchedDef.image && !c.image) {
                return { 
                  ...c, 
                  image: matchedDef.image, 
                  gallery: (c.gallery && c.gallery.length > 0) ? c.gallery : matchedDef.gallery 
                };
              }
              return c;
            });
          }

          return {
            ...p,
            condition: cond,
            colors,
            batteryHealth: battery || '100%',
            description:
              defaultRef && (!p.description || p.description.trim().length < 190)
                ? defaultRef.description
                : p.description,
            specs: defaultRef
              ? {
                  ...defaultRef.specs,
                  ...(p.specs || {})
                }
              : p.specs
          };
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load products from localStorage', err);
  }
  return DEFAULT_PRODUCTS;
};

// Save products to localStorage with event broadcast
export const saveProducts = (products: Product[]) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('oumar_products_updated', { detail: products }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.warn('Unable to cache products in localStorage:', err);
  }
};

// Reset the local catalogue to official default catalog.
export const resetProducts = (): Product[] => {
  saveProducts(DEFAULT_PRODUCTS);
  return DEFAULT_PRODUCTS;
};
