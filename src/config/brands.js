// Huisstijl per bedrijf. De kleuren zijn een schatting — vervang ze door de
// officiële hex-codes. `color` gebruik je in Phaser (0xRRGGBB), `css` in tekst.
// `logo` wordt geladen uit public/assets/logos/. Ontbreekt een logo, dan tekent
// het spel automatisch een badge met `initials` in de huisstijlkleur.

const hex = (s) => ({ color: parseInt(s.slice(1), 16), css: s });

export const BRANDS = {
  bhc: {
    id: 'bhc', name: 'Brainport Human Campus', short: 'BHC', initials: 'BHC',
    ...hex('#F39200'), dark: '#B86A00', logo: 'bhc.svg', scene: 'BhcMission',
  },
  driessen: {
    id: 'driessen', name: 'Driessen', short: 'Driessen', initials: 'D',
    ...hex('#E2001A'), dark: '#9E0012', logo: 'driessen.png', scene: 'DriessenMission',
  },
  bloeij: {
    id: 'bloeij', name: 'Bloeij', short: 'Bloeij', initials: 'B',
    ...hex('#7AB800'), dark: '#4E7A00', logo: 'bloeij.svg', scene: 'BloeijMission',
  },
  ijk: {
    id: 'ijk', name: 'IJk', short: 'IJk', initials: 'IJk',
    ...hex('#0096D6'), dark: '#006694', logo: 'ijk.svg', scene: 'IjkMission',
  },
  haert: {
    id: 'haert', name: 'Haert', short: 'Haert', initials: 'H',
    ...hex('#7B2D8E'), dark: '#511C5E', logo: 'haert.svg', scene: 'HaertMission',
  },
  reijn: {
    id: 'reijn', name: 'Reijn', short: 'Reijn', initials: 'R',
    ...hex('#00A19B'), dark: '#00706B', logo: 'reijn.svg', scene: 'ReijnMission',
  },
};

export const MISSION_IDS = ['bhc', 'driessen', 'bloeij', 'ijk', 'haert', 'reijn'];
