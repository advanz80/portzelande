// Uiterlijk van de vaste personages.
import { P } from '../gfx/palette.js';
import { BRANDS } from './brands.js';

export const NPC_LOOKS = {
  petra: { skin: '#f2c29b', hair: '#e8c25a', hairStyle: 'long', shirt: P.teal, pants: '#2d3a4a', hat: 'headset', badge: P.gold },
  bhc: { skin: '#d9a066', hair: '#5a3825', hairStyle: 'bun', shirt: BRANDS.bhc.css, pants: '#3a4a6b', glasses: true },
  driessen: { skin: '#ffdcb8', hair: '#2d1e14', hairStyle: 'short', shirt: BRANDS.driessen.css, pants: '#2d3a4a', tie: '#2d1e2f' },
  bloeij: { skin: '#b07443', hair: '#2d1e14', hairStyle: 'curly', shirt: BRANDS.bloeij.css, pants: '#3d6b8a', hat: 'cap', capColor: '#ffffff' },
  ijk: { skin: '#f2c29b', hair: '#a8642b', hairStyle: 'short', shirt: BRANDS.ijk.css, pants: '#3a4a6b', glasses: true },
  haert: { skin: '#ffdcb8', hair: '#d9532b', hairStyle: 'long', shirt: BRANDS.haert.css, pants: '#2d3a4a', hat: 'sunglasses' },
  reijn: { skin: '#d9a066', hair: '#2d1e14', hairStyle: 'long', shirt: '#f4efe4', stripes: BRANDS.reijn.css, pants: '#3b2f3f', hat: 'bandana', bandana: BRANDS.reijn.css },
  jan: { skin: '#f2c29b', hair: '#8a8a8a', hairStyle: 'short', shirt: '#ffffff', coat: '#2d3a5a', tie: BRANDS.driessen.css, pants: '#2d3a5a', glasses: true },
  captain: { skin: '#f2c29b', hair: '#5a3825', hairStyle: 'short', shirt: '#f4efe4', coat: P.pirateRed, pants: '#3b2f3f', hat: 'captain', beard: '#8a4a22', eyepatch: true, hook: true, angry: true },
  guard: { skin: '#b07443', hair: '#2d1e14', hairStyle: 'bald', shirt: '#f4efe4', stripes: P.pirateRed, pants: '#3b2f3f', hat: 'bandana', bandana: P.ink, beard: '#2d1e14', eyepatch: true },
};
