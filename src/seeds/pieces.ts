// Seed data for Kinstone pieces
// This creates a variety of shape families with both halves and different rarities

import { PieceHalf, PieceRarity } from '../types/database';

interface PieceSeedData {
  shape_family: string;
  half: PieceHalf;
  rarity: PieceRarity;
  name: string;
  description: string;
  tags: string[];
}

export const pieces: PieceSeedData[] = [
  // Star family
  {
    shape_family: 'star',
    half: 'A',
    rarity: 'common',
    name: 'Star Fragment A',
    description: 'A shimmering half of a celestial star',
    tags: ['celestial', 'light']
  },
  {
    shape_family: 'star',
    half: 'B',
    rarity: 'common',
    name: 'Star Fragment B',
    description: 'The complementary half of a celestial star',
    tags: ['celestial', 'light']
  },
  {
    shape_family: 'star',
    half: 'A',
    rarity: 'rare',
    name: 'Golden Star Fragment A',
    description: 'A radiant golden half of a divine star',
    tags: ['celestial', 'light', 'divine']
  },
  {
    shape_family: 'star',
    half: 'B',
    rarity: 'rare',
    name: 'Golden Star Fragment B',
    description: 'The complementary golden half of a divine star',
    tags: ['celestial', 'light', 'divine']
  },

  // Heart family
  {
    shape_family: 'heart',
    half: 'A',
    rarity: 'uncommon',
    name: 'Heart Shard A',
    description: 'A warm, pulsing half of a loving heart',
    tags: ['emotion', 'warmth']
  },
  {
    shape_family: 'heart',
    half: 'B',
    rarity: 'uncommon',
    name: 'Heart Shard B',
    description: 'The complementary half of a loving heart',
    tags: ['emotion', 'warmth']
  },
  {
    shape_family: 'heart',
    half: 'A',
    rarity: 'epic',
    name: 'Crystal Heart Shard A',
    description: 'A crystalline half of an eternal heart',
    tags: ['emotion', 'crystal', 'eternal']
  },
  {
    shape_family: 'heart',
    half: 'B',
    rarity: 'epic',
    name: 'Crystal Heart Shard B',
    description: 'The complementary crystalline half of an eternal heart',
    tags: ['emotion', 'crystal', 'eternal']
  },

  // Moon family
  {
    shape_family: 'moon',
    half: 'A',
    rarity: 'common',
    name: 'Lunar Crescent A',
    description: 'A silvery half of a mystical moon',
    tags: ['lunar', 'mystical', 'night']
  },
  {
    shape_family: 'moon',
    half: 'B',
    rarity: 'common',
    name: 'Lunar Crescent B',
    description: 'The complementary half of a mystical moon',
    tags: ['lunar', 'mystical', 'night']
  },
  {
    shape_family: 'moon',
    half: 'A',
    rarity: 'legendary',
    name: 'Eclipse Moon Fragment A',
    description: 'A rare fragment from a lunar eclipse',
    tags: ['lunar', 'eclipse', 'rare', 'power']
  },
  {
    shape_family: 'moon',
    half: 'B',
    rarity: 'legendary',
    name: 'Eclipse Moon Fragment B',
    description: 'The complementary fragment from a lunar eclipse',
    tags: ['lunar', 'eclipse', 'rare', 'power']
  },

  // Diamond family
  {
    shape_family: 'diamond',
    half: 'A',
    rarity: 'rare',
    name: 'Diamond Facet A',
    description: 'A brilliant half of a precious diamond',
    tags: ['precious', 'brilliant', 'earth']
  },
  {
    shape_family: 'diamond',
    half: 'B',
    rarity: 'rare',
    name: 'Diamond Facet B',
    description: 'The complementary half of a precious diamond',
    tags: ['precious', 'brilliant', 'earth']
  },

  // Flame family
  {
    shape_family: 'flame',
    half: 'A',
    rarity: 'uncommon',
    name: 'Flame Ember A',
    description: 'A flickering half of an eternal flame',
    tags: ['fire', 'energy', 'passion']
  },
  {
    shape_family: 'flame',
    half: 'B',
    rarity: 'uncommon',
    name: 'Flame Ember B',
    description: 'The complementary half of an eternal flame',
    tags: ['fire', 'energy', 'passion']
  },
  {
    shape_family: 'flame',
    half: 'A',
    rarity: 'epic',
    name: 'Phoenix Flame A',
    description: 'A legendary half of a phoenix\'s flame',
    tags: ['fire', 'phoenix', 'rebirth', 'legendary']
  },
  {
    shape_family: 'flame',
    half: 'B',
    rarity: 'epic',
    name: 'Phoenix Flame B',
    description: 'The complementary half of a phoenix\'s flame',
    tags: ['fire', 'phoenix', 'rebirth', 'legendary']
  },

  // Leaf family
  {
    shape_family: 'leaf',
    half: 'A',
    rarity: 'common',
    name: 'Forest Leaf A',
    description: 'A verdant half of a nature\'s leaf',
    tags: ['nature', 'growth', 'earth']
  },
  {
    shape_family: 'leaf',
    half: 'B',
    rarity: 'common',
    name: 'Forest Leaf B',
    description: 'The complementary half of a nature\'s leaf',
    tags: ['nature', 'growth', 'earth']
  },

  // Wave family
  {
    shape_family: 'wave',
    half: 'A',
    rarity: 'uncommon',
    name: 'Ocean Wave A',
    description: 'A flowing half of an ocean wave',
    tags: ['water', 'flow', 'ocean']
  },
  {
    shape_family: 'wave',
    half: 'B',
    rarity: 'uncommon',
    name: 'Ocean Wave B',
    description: 'The complementary half of an ocean wave',
    tags: ['water', 'flow', 'ocean']
  },

  // Lightning family
  {
    shape_family: 'lightning',
    half: 'A',
    rarity: 'rare',
    name: 'Lightning Bolt A',
    description: 'An electrifying half of a lightning strike',
    tags: ['electric', 'storm', 'power']
  },
  {
    shape_family: 'lightning',
    half: 'B',
    rarity: 'rare',
    name: 'Lightning Bolt B',
    description: 'The complementary half of a lightning strike',
    tags: ['electric', 'storm', 'power']
  }
];
