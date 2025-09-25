import type { NextApiRequest, NextApiResponse } from 'next';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
  routes: string[];
  database: 'connected' | 'disconnected' | 'error';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Test database connection
    let databaseStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    
    try {
      // Import here to avoid issues if DATABASE_URL is not set
      const { sql } = await import('../../../lib/database/connection');
      await sql`SELECT 1 as test`;
      databaseStatus = 'connected';
    } catch (error) {
      databaseStatus = 'error';
    }

    const healthResponse: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      routes: [
        'GET /api/v1/health',
        'GET /api/v1/users',
        'POST /api/v1/users',
        'GET /api/v1/users/[id]',
        'PUT /api/v1/users/[id]',
        'DELETE /api/v1/users/[id]',
        'GET /api/v1/pieces',
        'POST /api/v1/pieces',
        'GET /api/v1/inventory/[userId]',
        'POST /api/v1/inventory/[userId]',
        'POST /api/v1/fusions'
      ],
      database: databaseStatus
    };

    return res.status(200).json(healthResponse);
  } catch (error: any) {
    console.error('Health check error:', error);
    return res.status(500).json({ error: 'Health check failed' });
  }
}
