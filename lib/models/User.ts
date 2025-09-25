import { query, transaction } from '../database/connection';
import { 
  User, 
  UserWithInventory, 
  FusionWithPieces,
  PaginationOptions 
} from '../types/database';

interface CreateUserData {
  handle?: string;
  display_name?: string;
  inventory_capacity?: number;
}

interface UpdateUserData {
  handle?: string;
  display_name?: string;
}

export class UserModel {
  /**
   * Create a new user with inventory
   */
  static async create({ 
    handle, 
    display_name, 
    inventory_capacity = 50 
  }: CreateUserData): Promise<UserWithInventory> {
    return await transaction(async (client) => {
      // Create user
      const userResult = await client.query<User>(
        `INSERT INTO users (handle, display_name) 
         VALUES ($1, $2) 
         RETURNING *`,
        [handle, display_name]
      );
      
      const user = userResult.rows[0];
      
      // Create inventory for user
      const inventoryResult = await client.query(
        `INSERT INTO inventories (user_id, capacity) 
         VALUES ($1, $2) 
         RETURNING *`,
        [user.id, inventory_capacity]
      );
      
      return {
        ...user,
        inventory: inventoryResult.rows[0]
      };
    });
  }

  /**
   * Find user by ID with inventory
   */
  static async findById(id: string): Promise<UserWithInventory | null> {
    const result = await query<any>(
      `SELECT u.*, i.id as inventory_id, i.capacity, i.current_usage
       FROM users u
       LEFT JOIN inventories i ON u.id = i.user_id
       WHERE u.id = $1 AND u.is_active = true`,
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id,
      handle: row.handle,
      display_name: row.display_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_active: row.is_active,
      inventory: {
        id: row.inventory_id,
        capacity: row.capacity,
        current_usage: row.current_usage
      }
    };
  }

  /**
   * Find user by handle
   */
  static async findByHandle(handle: string): Promise<UserWithInventory | null> {
    const result = await query<any>(
      `SELECT u.*, i.id as inventory_id, i.capacity, i.current_usage
       FROM users u
       LEFT JOIN inventories i ON u.id = i.user_id
       WHERE u.handle = $1 AND u.is_active = true`,
      [handle]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id,
      handle: row.handle,
      display_name: row.display_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_active: row.is_active,
      inventory: {
        id: row.inventory_id,
        capacity: row.capacity,
        current_usage: row.current_usage
      }
    };
  }

  /**
   * Update user information
   */
  static async update(id: string, updates: UpdateUserData): Promise<User | null> {
    const allowedFields = ['handle', 'display_name'] as const;
    const fields = Object.keys(updates).filter(field => 
      allowedFields.includes(field as keyof UpdateUserData)
    );
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(field => updates[field as keyof UpdateUserData])];
    
    const result = await query<User>(
      `UPDATE users SET ${setClause} WHERE id = $1 AND is_active = true RETURNING *`,
      values
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Soft delete user (set is_active to false)
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      `UPDATE users SET is_active = false WHERE id = $1`,
      [id]
    );
    
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get user's fusion history
   */
  static async getFusionHistory(
    userId: string, 
    limit = 50, 
    offset = 0
  ): Promise<FusionWithPieces[]> {
    const result = await query<FusionWithPieces>(
      `SELECT f.*, 
              p1.name as input_piece_1_name, p1.shape_family as input_piece_1_shape, p1.half as input_piece_1_half,
              p2.name as input_piece_2_name, p2.shape_family as input_piece_2_shape, p2.half as input_piece_2_half
       FROM fusions f
       JOIN pieces p1 ON f.input_piece_1_catalog_id = p1.id
       JOIN pieces p2 ON f.input_piece_2_catalog_id = p2.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return result.rows;
  }

  /**
   * Get all users with pagination
   */
  static async findAll(options: PaginationOptions = {}): Promise<UserWithInventory[]> {
    const { limit = 50, offset = 0 } = options;
    
    const result = await query<any>(
      `SELECT u.*, i.id as inventory_id, i.capacity, i.current_usage
       FROM users u
       LEFT JOIN inventories i ON u.id = i.user_id
       WHERE u.is_active = true
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      handle: row.handle,
      display_name: row.display_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_active: row.is_active,
      inventory: {
        id: row.inventory_id,
        capacity: row.capacity,
        current_usage: row.current_usage
      }
    }));
  }

  /**
   * Check if handle is available
   */
  static async isHandleAvailable(handle: string, excludeUserId?: string): Promise<boolean> {
    let queryText = 'SELECT id FROM users WHERE handle = $1 AND is_active = true';
    const params: any[] = [handle];
    
    if (excludeUserId) {
      queryText += ' AND id != $2';
      params.push(excludeUserId);
    }
    
    const result = await query(queryText, params);
    return result.rows.length === 0;
  }
}
