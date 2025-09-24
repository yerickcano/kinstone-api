import { PoolClient } from 'pg';
import { query, transaction } from '../database/connection';
import { 
  InventoryWithEntries,
  InventoryEntryWithPiece,
  InventoryEntryProvenance,
  InventoryStats,
  PaginationOptions 
} from '../types/database';

export class InventoryModel {
  /**
   * Get inventory with entries for a user
   */
  static async getByUserId(
    userId: string, 
    options: PaginationOptions = {}
  ): Promise<InventoryWithEntries | null> {
    const { limit = 100, offset = 0 } = options;
    
    const result = await query<any>(
      `SELECT i.*, u.handle as user_handle
       FROM inventories i
       JOIN users u ON i.user_id = u.id
       WHERE i.user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) return null;
    
    const inventory = result.rows[0];
    
    // Get inventory entries with piece details
    const entriesResult = await query<InventoryEntryWithPiece>(
      `SELECT ie.*, p.name, p.shape_family, p.half, p.rarity, p.description, p.tags
       FROM inventory_entries ie
       JOIN pieces p ON ie.piece_id = p.id
       WHERE ie.inventory_id = $1
       ORDER BY ie.created_at DESC
       LIMIT $2 OFFSET $3`,
      [inventory.id, limit, offset]
    );
    
    return {
      ...inventory,
      entries: entriesResult.rows
    };
  }

  /**
   * Add a piece to inventory
   */
  static async addPiece(
    userId: string, 
    pieceId: string, 
    provenance: InventoryEntryProvenance = 'drop'
  ): Promise<InventoryEntryWithPiece> {
    return await transaction(async (client: PoolClient) => {
      // Get inventory and check capacity
      const inventoryResult = await client.query<any>(
        `SELECT * FROM inventories WHERE user_id = $1`,
        [userId]
      );
      
      if (inventoryResult.rows.length === 0) {
        throw new Error('Inventory not found for user');
      }
      
      const inventory = inventoryResult.rows[0];
      
      if (inventory.current_usage >= inventory.capacity) {
        throw new Error('Inventory is full');
      }
      
      // Verify piece exists and is active
      const pieceResult = await client.query(
        `SELECT * FROM pieces WHERE id = $1 AND is_active = true`,
        [pieceId]
      );
      
      if (pieceResult.rows.length === 0) {
        throw new Error('Piece not found or inactive');
      }
      
      // Add piece to inventory
      const entryResult = await client.query(
        `INSERT INTO inventory_entries (inventory_id, piece_id, provenance)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [inventory.id, pieceId, provenance]
      );
      
      // Get the entry with piece details
      const detailedEntryResult = await client.query<InventoryEntryWithPiece>(
        `SELECT ie.*, p.name, p.shape_family, p.half, p.rarity, p.description, p.tags
         FROM inventory_entries ie
         JOIN pieces p ON ie.piece_id = p.id
         WHERE ie.id = $1`,
        [entryResult.rows[0].id]
      );
      
      return detailedEntryResult.rows[0];
    });
  }

  /**
   * Remove a piece from inventory
   */
  static async removePiece(
    userId: string, 
    entryId: string
  ): Promise<InventoryEntryWithPiece> {
    return await transaction(async (client: PoolClient) => {
      // Get entry details before deletion
      const entryResult = await client.query<any>(
        `SELECT ie.*, p.name, p.shape_family, p.half, p.rarity
         FROM inventory_entries ie
         JOIN pieces p ON ie.piece_id = p.id
         JOIN inventories i ON ie.inventory_id = i.id
         WHERE ie.id = $1 AND i.user_id = $2 AND ie.is_locked = false`,
        [entryId, userId]
      );
      
      if (entryResult.rows.length === 0) {
        throw new Error('Inventory entry not found, not owned by user, or is locked');
      }
      
      const entry = entryResult.rows[0];
      
      // Delete the entry (trigger will update inventory usage)
      await client.query(
        `DELETE FROM inventory_entries WHERE id = $1`,
        [entryId]
      );
      
      return entry;
    });
  }

  /**
   * Lock/unlock inventory entries (for cooldowns or special states)
   */
  static async setLockStatus(entryIds: string[], isLocked: boolean): Promise<number> {
    if (entryIds.length === 0) return 0;
    
    const placeholders = entryIds.map((_, index) => `$${index + 1}`).join(',');
    const result = await query(
      `UPDATE inventory_entries SET is_locked = $${entryIds.length + 1} 
       WHERE id IN (${placeholders})`,
      [...entryIds, isLocked]
    );
    
    return result.rowCount;
  }

  /**
   * Get inventory entry by ID with ownership check
   */
  static async getEntryById(
    entryId: string, 
    userId: string
  ): Promise<InventoryEntryWithPiece | null> {
    const result = await query<InventoryEntryWithPiece>(
      `SELECT ie.*, p.name, p.shape_family, p.half, p.rarity, p.description, p.tags
       FROM inventory_entries ie
       JOIN pieces p ON ie.piece_id = p.id
       JOIN inventories i ON ie.inventory_id = i.id
       WHERE ie.id = $1 AND i.user_id = $2`,
      [entryId, userId]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get inventory statistics
   */
  static async getStats(userId: string): Promise<InventoryStats | null> {
    const result = await query<any>(
      `SELECT 
         i.capacity,
         i.current_usage,
         COUNT(ie.id) as total_pieces,
         COUNT(CASE WHEN p.rarity = 'common' THEN 1 END) as common_count,
         COUNT(CASE WHEN p.rarity = 'uncommon' THEN 1 END) as uncommon_count,
         COUNT(CASE WHEN p.rarity = 'rare' THEN 1 END) as rare_count,
         COUNT(CASE WHEN p.rarity = 'epic' THEN 1 END) as epic_count,
         COUNT(CASE WHEN p.rarity = 'legendary' THEN 1 END) as legendary_count,
         COUNT(DISTINCT p.shape_family) as unique_shapes,
         COUNT(CASE WHEN ie.is_locked = true THEN 1 END) as locked_pieces
       FROM inventories i
       LEFT JOIN inventory_entries ie ON i.id = ie.inventory_id
       LEFT JOIN pieces p ON ie.piece_id = p.id
       WHERE i.user_id = $1
       GROUP BY i.id, i.capacity, i.current_usage`,
      [userId]
    );
    
    if (result.rows.length === 0) return null;
    
    const stats = result.rows[0];
    return {
      capacity: parseInt(stats.capacity),
      current_usage: parseInt(stats.current_usage),
      total_pieces: parseInt(stats.total_pieces),
      common_count: parseInt(stats.common_count),
      uncommon_count: parseInt(stats.uncommon_count),
      rare_count: parseInt(stats.rare_count),
      epic_count: parseInt(stats.epic_count),
      legendary_count: parseInt(stats.legendary_count),
      unique_shapes: parseInt(stats.unique_shapes),
      locked_pieces: parseInt(stats.locked_pieces)
    };
  }

  /**
   * Update inventory capacity
   */
  static async updateCapacity(userId: string, newCapacity: number): Promise<any> {
    if (newCapacity < 1) {
      throw new Error('Capacity must be at least 1');
    }
    
    const result = await query(
      `UPDATE inventories 
       SET capacity = $2 
       WHERE user_id = $1 AND current_usage <= $2
       RETURNING *`,
      [userId, newCapacity]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Cannot reduce capacity below current usage');
    }
    
    return result.rows[0];
  }

  /**
   * Get entries by shape family
   */
  static async getEntriesByShapeFamily(
    userId: string, 
    shapeFamily: string
  ): Promise<InventoryEntryWithPiece[]> {
    const result = await query<InventoryEntryWithPiece>(
      `SELECT ie.*, p.name, p.shape_family, p.half, p.rarity, p.description, p.tags
       FROM inventory_entries ie
       JOIN pieces p ON ie.piece_id = p.id
       JOIN inventories i ON ie.inventory_id = i.id
       WHERE i.user_id = $1 AND p.shape_family = $2 AND ie.is_locked = false
       ORDER BY p.half, p.rarity`,
      [userId, shapeFamily]
    );
    
    return result.rows;
  }

  /**
   * Get available fusion pairs for a user
   */
  static async getAvailableFusionPairs(userId: string): Promise<Array<{
    piece1: InventoryEntryWithPiece;
    piece2: InventoryEntryWithPiece;
    shape_family: string;
  }>> {
    const result = await query<any>(
      `SELECT 
         ie1.id as piece1_id, ie1.piece_id as piece1_catalog_id, ie1.serial_number as piece1_serial,
         p1.name as piece1_name, p1.shape_family, p1.half as piece1_half, p1.rarity as piece1_rarity,
         ie2.id as piece2_id, ie2.piece_id as piece2_catalog_id, ie2.serial_number as piece2_serial,
         p2.name as piece2_name, p2.half as piece2_half, p2.rarity as piece2_rarity
       FROM inventory_entries ie1
       JOIN pieces p1 ON ie1.piece_id = p1.id
       JOIN inventory_entries ie2 ON ie1.inventory_id = ie2.inventory_id
       JOIN pieces p2 ON ie2.piece_id = p2.id
       JOIN inventories i ON ie1.inventory_id = i.id
       WHERE i.user_id = $1 
         AND ie1.id < ie2.id
         AND ie1.is_locked = false 
         AND ie2.is_locked = false
         AND p1.shape_family = p2.shape_family 
         AND p1.half != p2.half
       ORDER BY p1.shape_family, p1.rarity DESC`,
      [userId]
    );
    
    return result.rows.map(row => ({
      piece1: {
        id: row.piece1_id,
        inventory_id: '',
        piece_id: row.piece1_catalog_id,
        provenance: 'drop' as InventoryEntryProvenance,
        is_locked: false,
        serial_number: row.piece1_serial,
        created_at: new Date(),
        name: row.piece1_name,
        shape_family: row.shape_family,
        half: row.piece1_half,
        rarity: row.piece1_rarity,
        description: '',
        tags: []
      },
      piece2: {
        id: row.piece2_id,
        inventory_id: '',
        piece_id: row.piece2_catalog_id,
        provenance: 'drop' as InventoryEntryProvenance,
        is_locked: false,
        serial_number: row.piece2_serial,
        created_at: new Date(),
        name: row.piece2_name,
        shape_family: row.shape_family,
        half: row.piece2_half,
        rarity: row.piece2_rarity,
        description: '',
        tags: []
      },
      shape_family: row.shape_family
    }));
  }
}
