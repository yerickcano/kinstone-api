import { PoolClient } from 'pg';
import { query, transaction } from '../database/connection';
import { 
  Reward,
  RewardWithFusion,
  RewardType,
  RewardStatus,
  RewardStats,
  RewardQueryOptions 
} from '../types/database';

export class RewardModel {
  /**
   * Create a new reward
   */
  static async create(
    fusionId: string, 
    userId: string, 
    rewardType: RewardType, 
    rewardValue: Record<string, any>
  ): Promise<Reward> {
    const result = await query<Reward>(
      `INSERT INTO rewards (fusion_id, user_id, reward_type, reward_value)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [fusionId, userId, rewardType, JSON.stringify(rewardValue)]
    );
    
    return result.rows[0];
  }

  /**
   * Get reward by ID
   */
  static async getById(rewardId: string, userId: string): Promise<RewardWithFusion | null> {
    const result = await query<any>(
      `SELECT r.*, f.shape_family, f.score_value, f.created_at as fusion_created_at
       FROM rewards r
       JOIN fusions f ON r.fusion_id = f.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [rewardId, userId]
    );
    
    if (result.rows.length === 0) return null;
    
    const reward = result.rows[0];
    return {
      ...reward,
      reward_value: typeof reward.reward_value === 'string' ? 
        JSON.parse(reward.reward_value) : reward.reward_value
    };
  }

  /**
   * Get user's rewards with pagination and filtering
   */
  static async getByUserId(
    userId: string, 
    options: RewardQueryOptions = {}
  ): Promise<RewardWithFusion[]> {
    const {
      limit = 50,
      offset = 0,
      status = null,
      reward_type = null
    } = options;

    let whereClause = 'WHERE r.user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (reward_type) {
      whereClause += ` AND r.reward_type = $${paramIndex}`;
      params.push(reward_type);
      paramIndex++;
    }

    params.push(limit, offset);

    const result = await query<any>(
      `SELECT r.*, f.shape_family, f.score_value, f.created_at as fusion_created_at
       FROM rewards r
       JOIN fusions f ON r.fusion_id = f.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return result.rows.map(reward => ({
      ...reward,
      reward_value: typeof reward.reward_value === 'string' ? 
        JSON.parse(reward.reward_value) : reward.reward_value
    }));
  }

  /**
   * Claim a pending reward
   */
  static async claim(rewardId: string, userId: string): Promise<RewardWithFusion> {
    return await transaction(async (client: PoolClient) => {
      // Lock and verify reward
      const rewardResult = await client.query<Reward>(
        `SELECT * FROM rewards 
         WHERE id = $1 AND user_id = $2 AND status = 'pending'
         FOR UPDATE`,
        [rewardId, userId]
      );

      if (rewardResult.rows.length === 0) {
        throw new Error('Reward not found, not owned by user, or already claimed');
      }

      const reward = rewardResult.rows[0];

      // Update status to claimed
      const updatedResult = await client.query<any>(
        `UPDATE rewards 
         SET status = 'claimed', claimed_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [rewardId]
      );

      // Get fusion details
      const fusionResult = await client.query<any>(
        `SELECT shape_family, score_value, created_at as fusion_created_at
         FROM fusions WHERE id = $1`,
        [reward.fusion_id]
      );

      const updatedReward = updatedResult.rows[0];
      const fusion = fusionResult.rows[0];

      return {
        ...updatedReward,
        ...fusion,
        reward_value: typeof updatedReward.reward_value === 'string' ? 
          JSON.parse(updatedReward.reward_value) : updatedReward.reward_value
      };
    });
  }

  /**
   * Mark reward as consumed (after processing)
   */
  static async markConsumed(rewardId: string): Promise<boolean> {
    const result = await query(
      `UPDATE rewards 
       SET status = 'consumed'
       WHERE id = $1 AND status = 'claimed'`,
      [rewardId]
    );
    
    return result.rowCount > 0;
  }

  /**
   * Get reward statistics for a user
   */
  static async getStats(userId: string): Promise<RewardStats> {
    const result = await query<any>(
      `SELECT 
         COUNT(*) as total_rewards,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_rewards,
         COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed_rewards,
         COUNT(CASE WHEN status = 'consumed' THEN 1 END) as consumed_rewards,
         COUNT(CASE WHEN reward_type = 'points' THEN 1 END) as points_rewards,
         COUNT(CASE WHEN reward_type = 'coins' THEN 1 END) as coins_rewards,
         COUNT(CASE WHEN reward_type = 'cosmetic' THEN 1 END) as cosmetic_rewards,
         COUNT(CASE WHEN reward_type = 'lootbox' THEN 1 END) as lootbox_rewards,
         COUNT(CASE WHEN reward_type = 'event_trigger' THEN 1 END) as event_rewards
       FROM rewards
       WHERE user_id = $1`,
      [userId]
    );

    const stats = result.rows[0];

    // Calculate total value for points and coins
    const valueResult = await query<any>(
      `SELECT 
         reward_type,
         SUM(CAST(reward_value->>'value' AS INTEGER)) as total_value
       FROM rewards
       WHERE user_id = $1 AND reward_type IN ('points', 'coins') 
         AND reward_value->>'value' IS NOT NULL
       GROUP BY reward_type`,
      [userId]
    );

    const valueStats: Record<string, number> = {};
    valueResult.rows.forEach(row => {
      valueStats[`total_${row.reward_type}`] = parseInt(row.total_value) || 0;
    });

    return {
      total_rewards: parseInt(stats.total_rewards),
      pending_rewards: parseInt(stats.pending_rewards),
      claimed_rewards: parseInt(stats.claimed_rewards),
      consumed_rewards: parseInt(stats.consumed_rewards),
      points_rewards: parseInt(stats.points_rewards),
      coins_rewards: parseInt(stats.coins_rewards),
      cosmetic_rewards: parseInt(stats.cosmetic_rewards),
      lootbox_rewards: parseInt(stats.lootbox_rewards),
      event_rewards: parseInt(stats.event_rewards),
      total_points: valueStats.total_points,
      total_coins: valueStats.total_coins
    };
  }

  /**
   * Get pending rewards count for a user
   */
  static async getPendingCount(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM rewards WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );
    
    return parseInt(result.rows[0].count) || 0;
  }

  /**
   * Bulk claim all pending rewards for a user
   */
  static async claimAllPending(userId: string): Promise<RewardWithFusion[]> {
    return await transaction(async (client: PoolClient) => {
      // Get all pending rewards
      const pendingResult = await client.query<Reward>(
        `SELECT * FROM rewards 
         WHERE user_id = $1 AND status = 'pending'
         FOR UPDATE`,
        [userId]
      );

      if (pendingResult.rows.length === 0) {
        return [];
      }

      // Update all to claimed
      const claimedResult = await client.query<any>(
        `UPDATE rewards 
         SET status = 'claimed', claimed_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND status = 'pending'
         RETURNING *`,
        [userId]
      );

      // Get fusion details for all rewards
      const fusionIds = claimedResult.rows.map(r => r.fusion_id);
      const fusionResult = await client.query<any>(
        `SELECT id, shape_family, score_value, created_at as fusion_created_at
         FROM fusions WHERE id = ANY($1)`,
        [fusionIds]
      );

      const fusionMap = new Map();
      fusionResult.rows.forEach(f => fusionMap.set(f.id, f));

      return claimedResult.rows.map(reward => {
        const fusion = fusionMap.get(reward.fusion_id);
        return {
          ...reward,
          ...fusion,
          reward_value: typeof reward.reward_value === 'string' ? 
            JSON.parse(reward.reward_value) : reward.reward_value
        };
      });
    });
  }

  /**
   * Get rewards by type
   */
  static async getByType(
    userId: string, 
    rewardType: RewardType, 
    status?: RewardStatus
  ): Promise<RewardWithFusion[]> {
    let whereClause = 'WHERE r.user_id = $1 AND r.reward_type = $2';
    const params: any[] = [userId, rewardType];

    if (status) {
      whereClause += ' AND r.status = $3';
      params.push(status);
    }

    const result = await query<any>(
      `SELECT r.*, f.shape_family, f.score_value, f.created_at as fusion_created_at
       FROM rewards r
       JOIN fusions f ON r.fusion_id = f.id
       ${whereClause}
       ORDER BY r.created_at DESC`,
      params
    );

    return result.rows.map(reward => ({
      ...reward,
      reward_value: typeof reward.reward_value === 'string' ? 
        JSON.parse(reward.reward_value) : reward.reward_value
    }));
  }

  /**
   * Get total reward value by type for a user
   */
  static async getTotalValueByType(
    userId: string, 
    rewardType: RewardType
  ): Promise<number> {
    const result = await query<{ total: string }>(
      `SELECT COALESCE(SUM(CAST(reward_value->>'value' AS INTEGER)), 0) as total
       FROM rewards
       WHERE user_id = $1 AND reward_type = $2 AND reward_value->>'value' IS NOT NULL`,
      [userId, rewardType]
    );
    
    return parseInt(result.rows[0].total) || 0;
  }
}
