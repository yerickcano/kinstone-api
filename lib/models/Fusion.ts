import { query, transaction } from '../database/connection';
import { 
  Fusion,
  FusionWithPieces,
  FusionResult,
  FusionStats,
  GlobalStats,
  FusionHistoryOptions,
  PieceRarity 
} from '../types/database';

interface RewardData {
  type: string;
  value: number;
  description: string;
}

export class FusionModel {
  /**
   * Attempt to fuse two pieces atomically
   */
  static async attemptFusion(
    userId: string, 
    entryId1: string, 
    entryId2: string
  ): Promise<FusionResult> {
    if (entryId1 === entryId2) {
      throw new Error('Cannot fuse a piece with itself');
    }

    return await transaction(async (client) => {
      // Lock and validate both inventory entries with row-level locking
      const entriesResult = await client.query<any>(
        `SELECT ie.*, p.id as piece_id, p.name, p.shape_family, p.half, p.rarity
         FROM inventory_entries ie
         JOIN pieces p ON ie.piece_id = p.id
         JOIN inventories i ON ie.inventory_id = i.id
         WHERE ie.id IN ($1, $2) AND i.user_id = $3 AND ie.is_locked = false
         ORDER BY ie.id
         FOR UPDATE`, // Row-level lock to prevent double-consume
        [entryId1, entryId2, userId]
      );

      if (entriesResult.rows.length !== 2) {
        throw new Error('One or both pieces not found, not owned by user, or are locked');
      }

      const [entry1, entry2] = entriesResult.rows;

      // Verify pieces are different
      if (entry1.piece_id === entry2.piece_id) {
        throw new Error('Cannot fuse identical pieces');
      }

      // Check fusion compatibility
      const isCompatible = entry1.shape_family === entry2.shape_family && 
                          entry1.half !== entry2.half;

      const shapeFamily = entry1.shape_family;
      let scoreValue = 0;
      let rewardData: RewardData | null = null;

      if (isCompatible) {
        // Calculate score based on rarity
        const rarityScores: Record<PieceRarity, number> = {
          'common': 10,
          'uncommon': 25,
          'rare': 50,
          'epic': 100,
          'legendary': 250
        };
        
        scoreValue = (rarityScores[entry1.rarity as PieceRarity] || 0) + (rarityScores[entry2.rarity as PieceRarity] || 0);
        
        // Determine reward (simple logic for now)
        if (entry1.rarity === 'legendary' || entry2.rarity === 'legendary') {
          rewardData = {
            type: 'coins',
            value: 1000,
            description: 'Legendary fusion bonus'
          };
        } else if (entry1.rarity === 'epic' || entry2.rarity === 'epic') {
          rewardData = {
            type: 'coins',
            value: 500,
            description: 'Epic fusion bonus'
          };
        }
      }

      // Create fusion record
      const fusionResult = await client.query<Fusion>(
        `INSERT INTO fusions (
          user_id, input_piece_1_id, input_piece_2_id, 
          input_piece_1_catalog_id, input_piece_2_catalog_id,
          shape_family, is_success, score_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          userId, entry1.id, entry2.id,
          entry1.piece_id, entry2.piece_id,
          shapeFamily, isCompatible, scoreValue
        ]
      );

      const fusion = fusionResult.rows[0];

      if (isCompatible) {
        // Remove consumed pieces from inventory (triggers will update usage)
        await client.query(
          `DELETE FROM inventory_entries WHERE id IN ($1, $2)`,
          [entry1.id, entry2.id]
        );

        // Create reward if applicable
        if (rewardData) {
          await client.query(
            `INSERT INTO rewards (fusion_id, user_id, reward_type, reward_value)
             VALUES ($1, $2, $3, $4)`,
            [fusion.id, userId, rewardData.type, JSON.stringify(rewardData)]
          );
        }
      }

      // Return detailed fusion result
      return {
        fusion: {
          ...fusion,
          input_piece_1: {
            id: entry1.id,
            name: entry1.name,
            shape_family: entry1.shape_family,
            half: entry1.half,
            rarity: entry1.rarity
          },
          input_piece_2: {
            id: entry2.id,
            name: entry2.name,
            shape_family: entry2.shape_family,
            half: entry2.half,
            rarity: entry2.rarity
          }
        },
        reward: rewardData || undefined,
        consumed_pieces: isCompatible ? [entry1.id, entry2.id] : []
      };
    });
  }

  /**
   * Get fusion by ID
   */
  static async getById(fusionId: string, userId: string): Promise<FusionWithPieces | null> {
    const result = await query<FusionWithPieces>(
      `SELECT f.*,
              p1.name as input_piece_1_name, p1.shape_family as input_piece_1_shape, 
              p1.half as input_piece_1_half, p1.rarity as input_piece_1_rarity,
              p2.name as input_piece_2_name, p2.shape_family as input_piece_2_shape,
              p2.half as input_piece_2_half, p2.rarity as input_piece_2_rarity
       FROM fusions f
       JOIN pieces p1 ON f.input_piece_1_catalog_id = p1.id
       JOIN pieces p2 ON f.input_piece_2_catalog_id = p2.id
       WHERE f.id = $1 AND f.user_id = $2`,
      [fusionId, userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get user's fusion history with pagination
   */
  static async getHistory(
    userId: string, 
    options: FusionHistoryOptions = {}
  ): Promise<FusionWithPieces[]> {
    const {
      limit = 50,
      offset = 0,
      success_only = false,
      shape_family = null
    } = options;

    let whereClause = 'WHERE f.user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (success_only) {
      whereClause += ` AND f.is_success = true`;
    }

    if (shape_family) {
      whereClause += ` AND f.shape_family = $${paramIndex}`;
      params.push(shape_family);
      paramIndex++;
    }

    params.push(limit, offset);

    const result = await query<FusionWithPieces>(
      `SELECT f.*,
              p1.name as input_piece_1_name, p1.shape_family as input_piece_1_shape, 
              p1.half as input_piece_1_half, p1.rarity as input_piece_1_rarity,
              p2.name as input_piece_2_name, p2.shape_family as input_piece_2_shape,
              p2.half as input_piece_2_half, p2.rarity as input_piece_2_rarity
       FROM fusions f
       JOIN pieces p1 ON f.input_piece_1_catalog_id = p1.id
       JOIN pieces p2 ON f.input_piece_2_catalog_id = p2.id
       ${whereClause}
       ORDER BY f.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return result.rows;
  }

  /**
   * Get fusion statistics for a user
   */
  static async getStats(userId: string): Promise<FusionStats> {
    const result = await query<any>(
      `SELECT 
         COUNT(*) as total_attempts,
         COUNT(CASE WHEN is_success = true THEN 1 END) as successful_fusions,
         COUNT(CASE WHEN is_success = false THEN 1 END) as failed_fusions,
         COALESCE(SUM(score_value), 0) as total_score,
         COALESCE(AVG(score_value), 0) as average_score,
         COUNT(DISTINCT shape_family) as unique_shapes_fused,
         MAX(score_value) as highest_score,
         MIN(created_at) as first_fusion,
         MAX(created_at) as latest_fusion
       FROM fusions
       WHERE user_id = $1`,
      [userId]
    );

    const stats = result.rows[0];

    // Get success rate by shape family
    const shapeStatsResult = await query<any>(
      `SELECT 
         shape_family,
         COUNT(*) as attempts,
         COUNT(CASE WHEN is_success = true THEN 1 END) as successes,
         COALESCE(SUM(score_value), 0) as total_score
       FROM fusions
       WHERE user_id = $1
       GROUP BY shape_family
       ORDER BY total_score DESC`,
      [userId]
    );

    return {
      total_attempts: parseInt(stats.total_attempts),
      successful_fusions: parseInt(stats.successful_fusions),
      failed_fusions: parseInt(stats.failed_fusions),
      total_score: parseInt(stats.total_score),
      average_score: parseFloat(stats.average_score),
      unique_shapes_fused: parseInt(stats.unique_shapes_fused),
      highest_score: parseInt(stats.highest_score) || 0,
      first_fusion: stats.first_fusion,
      latest_fusion: stats.latest_fusion,
      success_rate: stats.total_attempts > 0 ? 
        (parseFloat(stats.successful_fusions) / parseFloat(stats.total_attempts)) : 0,
      shape_family_stats: shapeStatsResult.rows.map(row => ({
        shape_family: row.shape_family,
        attempts: parseInt(row.attempts),
        successes: parseInt(row.successes),
        total_score: parseInt(row.total_score)
      }))
    };
  }

  /**
   * Get global fusion statistics (leaderboard data)
   */
  static async getGlobalStats(limit = 10): Promise<GlobalStats> {
    // Top scorers
    const topScorersResult = await query<any>(
      `SELECT u.handle, u.display_name, SUM(f.score_value) as total_score,
              COUNT(f.id) as total_fusions,
              COUNT(CASE WHEN f.is_success = true THEN 1 END) as successful_fusions
       FROM fusions f
       JOIN users u ON f.user_id = u.id
       WHERE u.is_active = true
       GROUP BY u.id, u.handle, u.display_name
       ORDER BY total_score DESC
       LIMIT $1`,
      [limit]
    );

    // Most active fusers
    const mostActiveResult = await query<any>(
      `SELECT u.handle, u.display_name, COUNT(f.id) as total_attempts,
              COUNT(CASE WHEN f.is_success = true THEN 1 END) as successful_fusions,
              SUM(f.score_value) as total_score
       FROM fusions f
       JOIN users u ON f.user_id = u.id
       WHERE u.is_active = true
       GROUP BY u.id, u.handle, u.display_name
       ORDER BY total_attempts DESC
       LIMIT $1`,
      [limit]
    );

    // Overall statistics
    const overallResult = await query<any>(
      `SELECT 
         COUNT(*) as total_fusion_attempts,
         COUNT(CASE WHEN is_success = true THEN 1 END) as total_successful_fusions,
         COUNT(DISTINCT user_id) as active_users,
         COALESCE(SUM(score_value), 0) as total_score_awarded,
         COUNT(DISTINCT shape_family) as unique_shapes_fused
       FROM fusions f
       JOIN users u ON f.user_id = u.id
       WHERE u.is_active = true`
    );

    return {
      top_scorers: topScorersResult.rows.map(row => ({
        handle: row.handle,
        display_name: row.display_name,
        total_score: parseInt(row.total_score),
        total_fusions: parseInt(row.total_fusions),
        successful_fusions: parseInt(row.successful_fusions)
      })),
      most_active: mostActiveResult.rows.map(row => ({
        handle: row.handle,
        display_name: row.display_name,
        total_attempts: parseInt(row.total_attempts),
        successful_fusions: parseInt(row.successful_fusions),
        total_score: parseInt(row.total_score)
      })),
      overall: {
        total_fusion_attempts: parseInt(overallResult.rows[0].total_fusion_attempts),
        total_successful_fusions: parseInt(overallResult.rows[0].total_successful_fusions),
        active_users: parseInt(overallResult.rows[0].active_users),
        total_score_awarded: parseInt(overallResult.rows[0].total_score_awarded),
        unique_shapes_fused: parseInt(overallResult.rows[0].unique_shapes_fused)
      }
    };
  }

  /**
   * Get recent successful fusions (for activity feed)
   */
  static async getRecentSuccessfulFusions(limit = 20): Promise<Array<FusionWithPieces & { user_handle?: string }>> {
    const result = await query<any>(
      `SELECT f.*, u.handle as user_handle,
              p1.name as input_piece_1_name, p1.shape_family as input_piece_1_shape, 
              p1.half as input_piece_1_half, p1.rarity as input_piece_1_rarity,
              p2.name as input_piece_2_name, p2.shape_family as input_piece_2_shape,
              p2.half as input_piece_2_half, p2.rarity as input_piece_2_rarity
       FROM fusions f
       JOIN users u ON f.user_id = u.id
       JOIN pieces p1 ON f.input_piece_1_catalog_id = p1.id
       JOIN pieces p2 ON f.input_piece_2_catalog_id = p2.id
       WHERE f.is_success = true AND u.is_active = true
       ORDER BY f.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}
