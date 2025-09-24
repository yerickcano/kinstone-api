import { query } from '../database/connection';
import { 
  Piece, 
  PieceHalf, 
  PieceRarity, 
  FusionCompatibility,
  PieceFilters,
  PaginationOptions 
} from '../types/database';

interface CreatePieceData {
  shape_family: string;
  half: PieceHalf;
  rarity?: PieceRarity;
  name: string;
  description?: string;
  tags?: string[];
}

interface UpdatePieceData {
  name?: string;
  description?: string;
  tags?: string[];
  is_active?: boolean;
}

export class PieceModel {
  /**
   * Create a new piece in the catalog
   */
  static async create({ 
    shape_family, 
    half, 
    rarity = 'common', 
    name, 
    description, 
    tags = [] 
  }: CreatePieceData): Promise<Piece> {
    const result = await query<Piece>(
      `INSERT INTO pieces (shape_family, half, rarity, name, description, tags) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [shape_family, half, rarity, name, description, tags]
    );
    
    return result.rows[0];
  }

  /**
   * Find piece by ID
   */
  static async findById(id: string): Promise<Piece | null> {
    const result = await query<Piece>(
      `SELECT * FROM pieces WHERE id = $1 AND is_active = true`,
      [id]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Find all pieces by shape family
   */
  static async findByShapeFamily(shapeFamily: string): Promise<Piece[]> {
    const result = await query<Piece>(
      `SELECT * FROM pieces WHERE shape_family = $1 AND is_active = true ORDER BY half, rarity`,
      [shapeFamily]
    );
    
    return result.rows;
  }

  /**
   * Find complementary piece for fusion
   */
  static async findComplementaryPiece(pieceId: string): Promise<Piece | null> {
    const result = await query<Piece>(
      `SELECT p2.* FROM pieces p1
       JOIN pieces p2 ON p1.shape_family = p2.shape_family 
                     AND p1.half != p2.half
       WHERE p1.id = $1 AND p1.is_active = true AND p2.is_active = true`,
      [pieceId]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Check if two pieces can be fused
   */
  static async checkFusionCompatibility(
    piece1Id: string, 
    piece2Id: string
  ): Promise<FusionCompatibility> {
    const result = await query<any>(
      `SELECT p1.id as piece1_id, p1.shape_family as piece1_shape, p1.half as piece1_half, p1.name as piece1_name,
              p2.id as piece2_id, p2.shape_family as piece2_shape, p2.half as piece2_half, p2.name as piece2_name,
              (p1.shape_family = p2.shape_family AND p1.half != p2.half) as is_compatible
       FROM pieces p1, pieces p2
       WHERE p1.id = $1 AND p2.id = $2 AND p1.is_active = true AND p2.is_active = true`,
      [piece1Id, piece2Id]
    );
    
    if (result.rows.length === 0) {
      return { 
        piece1_id: piece1Id,
        piece1_shape: '',
        piece1_half: 'A',
        piece1_name: '',
        piece2_id: piece2Id,
        piece2_shape: '',
        piece2_half: 'A',
        piece2_name: '',
        is_compatible: false, 
        error: 'One or both pieces not found' 
      };
    }
    
    return result.rows[0];
  }

  /**
   * Get all active pieces with optional filtering
   */
  static async findAll(
    filters: PieceFilters = {}, 
    options: PaginationOptions = {}
  ): Promise<Piece[]> {
    const { limit = 100, offset = 0 } = options;
    let whereClause = 'WHERE is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.rarity) {
      whereClause += ` AND rarity = $${paramIndex}`;
      params.push(filters.rarity);
      paramIndex++;
    }

    if (filters.shape_family) {
      whereClause += ` AND shape_family = $${paramIndex}`;
      params.push(filters.shape_family);
      paramIndex++;
    }

    if (filters.tags && filters.tags.length > 0) {
      whereClause += ` AND tags && $${paramIndex}`;
      params.push(filters.tags);
      paramIndex++;
    }

    params.push(limit, offset);

    const result = await query<Piece>(
      `SELECT * FROM pieces ${whereClause} 
       ORDER BY shape_family, half, rarity 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    return result.rows;
  }

  /**
   * Get unique shape families
   */
  static async getShapeFamilies(): Promise<string[]> {
    const result = await query<{ shape_family: string }>(
      `SELECT DISTINCT shape_family FROM pieces WHERE is_active = true ORDER BY shape_family`
    );
    
    return result.rows.map(row => row.shape_family);
  }

  /**
   * Update piece information
   */
  static async update(id: string, updates: UpdatePieceData): Promise<Piece | null> {
    const allowedFields = ['name', 'description', 'tags', 'is_active'] as const;
    const fields = Object.keys(updates).filter(field => 
      allowedFields.includes(field as keyof UpdatePieceData)
    );
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(field => updates[field as keyof UpdatePieceData])];
    
    const result = await query<Piece>(
      `UPDATE pieces SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Retire a piece (set is_active to false)
   */
  static async retire(id: string): Promise<boolean> {
    const result = await query(
      `UPDATE pieces SET is_active = false WHERE id = $1`,
      [id]
    );
    
    return result.rowCount > 0;
  }

  /**
   * Get pieces by rarity
   */
  static async findByRarity(rarity: PieceRarity): Promise<Piece[]> {
    const result = await query<Piece>(
      `SELECT * FROM pieces WHERE rarity = $1 AND is_active = true ORDER BY shape_family, half`,
      [rarity]
    );
    
    return result.rows;
  }

  /**
   * Get piece statistics
   */
  static async getStats(): Promise<{
    total_pieces: number;
    active_pieces: number;
    shape_families: number;
    by_rarity: Record<PieceRarity, number>;
  }> {
    const result = await query<any>(
      `SELECT 
         COUNT(*) as total_pieces,
         COUNT(CASE WHEN is_active = true THEN 1 END) as active_pieces,
         COUNT(DISTINCT shape_family) as shape_families,
         COUNT(CASE WHEN rarity = 'common' AND is_active = true THEN 1 END) as common_count,
         COUNT(CASE WHEN rarity = 'uncommon' AND is_active = true THEN 1 END) as uncommon_count,
         COUNT(CASE WHEN rarity = 'rare' AND is_active = true THEN 1 END) as rare_count,
         COUNT(CASE WHEN rarity = 'epic' AND is_active = true THEN 1 END) as epic_count,
         COUNT(CASE WHEN rarity = 'legendary' AND is_active = true THEN 1 END) as legendary_count
       FROM pieces`
    );
    
    const stats = result.rows[0];
    return {
      total_pieces: parseInt(stats.total_pieces),
      active_pieces: parseInt(stats.active_pieces),
      shape_families: parseInt(stats.shape_families),
      by_rarity: {
        common: parseInt(stats.common_count),
        uncommon: parseInt(stats.uncommon_count),
        rare: parseInt(stats.rare_count),
        epic: parseInt(stats.epic_count),
        legendary: parseInt(stats.legendary_count)
      }
    };
  }
}
