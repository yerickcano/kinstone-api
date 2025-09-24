// Database entity types for Kinstone Fusion API

export type PieceHalf = 'A' | 'B';
export type PieceRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type InventoryEntryProvenance = 'drop' | 'reward' | 'grant' | 'admin';
export type RewardType = 'points' | 'coins' | 'cosmetic' | 'lootbox' | 'event_trigger';
export type RewardStatus = 'pending' | 'claimed' | 'consumed';

// Base entity interface
export interface BaseEntity {
  id: string;
  created_at: Date;
}

// User entity
export interface User extends BaseEntity {
  handle?: string;
  display_name?: string;
  updated_at: Date;
  is_active: boolean;
}

// User with inventory (joined data)
export interface UserWithInventory extends User {
  inventory: {
    id: string;
    capacity: number;
    current_usage: number;
  };
}

// Inventory entity
export interface Inventory extends BaseEntity {
  user_id: string;
  capacity: number;
  current_usage: number;
  updated_at: Date;
}

// Inventory with entries (joined data)
export interface InventoryWithEntries extends Inventory {
  entries: InventoryEntryWithPiece[];
  user_handle?: string;
}

// Piece entity (catalog)
export interface Piece extends BaseEntity {
  shape_family: string;
  half: PieceHalf;
  rarity: PieceRarity;
  name: string;
  description?: string;
  tags: string[];
  is_active: boolean;
}

// Inventory entry entity
export interface InventoryEntry extends BaseEntity {
  inventory_id: string;
  piece_id: string;
  provenance: InventoryEntryProvenance;
  is_locked: boolean;
  serial_number: number;
}

// Inventory entry with piece details (joined data)
export interface InventoryEntryWithPiece extends InventoryEntry {
  name: string;
  shape_family: string;
  half: PieceHalf;
  rarity: PieceRarity;
  description?: string;
  tags: string[];
}

// Fusion entity
export interface Fusion extends BaseEntity {
  user_id: string;
  input_piece_1_id: string;
  input_piece_2_id: string;
  input_piece_1_catalog_id: string;
  input_piece_2_catalog_id: string;
  shape_family: string;
  is_success: boolean;
  score_value: number;
}

// Fusion with piece details (joined data)
export interface FusionWithPieces extends Fusion {
  input_piece_1_name: string;
  input_piece_1_shape: string;
  input_piece_1_half: PieceHalf;
  input_piece_1_rarity: PieceRarity;
  input_piece_2_name: string;
  input_piece_2_shape: string;
  input_piece_2_half: PieceHalf;
  input_piece_2_rarity: PieceRarity;
}

// Reward entity
export interface Reward extends BaseEntity {
  fusion_id: string;
  user_id: string;
  reward_type: RewardType;
  reward_value: Record<string, any>;
  status: RewardStatus;
  claimed_at?: Date;
}

// Reward with fusion details (joined data)
export interface RewardWithFusion extends Reward {
  shape_family: string;
  score_value: number;
  fusion_created_at: Date;
}

// Drop ruleset entity
export interface DropRuleset extends BaseEntity {
  name: string;
  description?: string;
  probability_weights: Record<string, number>;
  cooldown_seconds: number;
  is_active: boolean;
  starts_at?: Date;
  ends_at?: Date;
}

// Fusion compatibility check result
export interface FusionCompatibility {
  piece1_id: string;
  piece1_shape: string;
  piece1_half: PieceHalf;
  piece1_name: string;
  piece2_id: string;
  piece2_shape: string;
  piece2_half: PieceHalf;
  piece2_name: string;
  is_compatible: boolean;
  error?: string;
}

// Fusion attempt result
export interface FusionResult {
  fusion: Fusion & {
    input_piece_1: {
      id: string;
      name: string;
      shape_family: string;
      half: PieceHalf;
      rarity: PieceRarity;
    };
    input_piece_2: {
      id: string;
      name: string;
      shape_family: string;
      half: PieceHalf;
      rarity: PieceRarity;
    };
  };
  reward?: {
    type: string;
    value: number;
    description: string;
  };
  consumed_pieces: string[];
}

// Statistics interfaces
export interface InventoryStats {
  capacity: number;
  current_usage: number;
  total_pieces: number;
  common_count: number;
  uncommon_count: number;
  rare_count: number;
  epic_count: number;
  legendary_count: number;
  unique_shapes: number;
  locked_pieces: number;
}

export interface FusionStats {
  total_attempts: number;
  successful_fusions: number;
  failed_fusions: number;
  total_score: number;
  average_score: number;
  unique_shapes_fused: number;
  highest_score: number;
  first_fusion?: Date;
  latest_fusion?: Date;
  success_rate: number;
  shape_family_stats: Array<{
    shape_family: string;
    attempts: number;
    successes: number;
    total_score: number;
  }>;
}

export interface RewardStats {
  total_rewards: number;
  pending_rewards: number;
  claimed_rewards: number;
  consumed_rewards: number;
  points_rewards: number;
  coins_rewards: number;
  cosmetic_rewards: number;
  lootbox_rewards: number;
  event_rewards: number;
  total_points?: number;
  total_coins?: number;
}

export interface GlobalStats {
  top_scorers: Array<{
    handle?: string;
    display_name?: string;
    total_score: number;
    total_fusions: number;
    successful_fusions: number;
  }>;
  most_active: Array<{
    handle?: string;
    display_name?: string;
    total_attempts: number;
    successful_fusions: number;
    total_score: number;
  }>;
  overall: {
    total_fusion_attempts: number;
    total_successful_fusions: number;
    active_users: number;
    total_score_awarded: number;
    unique_shapes_fused: number;
  };
}

// Query options interfaces
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PieceFilters {
  rarity?: PieceRarity;
  shape_family?: string;
  tags?: string[];
}

export interface FusionHistoryOptions extends PaginationOptions {
  success_only?: boolean;
  shape_family?: string;
}

export interface RewardQueryOptions extends PaginationOptions {
  status?: RewardStatus;
  reward_type?: RewardType;
}

// Database query result types
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

// Database client interface
export interface DatabaseClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  release(): void;
}
