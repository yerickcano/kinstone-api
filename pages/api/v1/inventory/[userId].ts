import type { NextApiRequest, NextApiResponse } from 'next';
import { InventoryModel } from '@/lib/models/Inventory';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = req.query;

  if (typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get user inventory
        const { limit = 100, offset = 0 } = req.query;
        
        const inventory = await InventoryModel.getByUserId(userId, {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        });
        
        if (!inventory) {
          return res.status(404).json({ error: 'Inventory not found' });
        }
        
        return res.status(200).json({ inventory });

      case 'POST':
        // Add piece to inventory
        const { piece_id, provenance = 'drop' } = req.body;
        
        if (!piece_id) {
          return res.status(400).json({ error: 'Missing piece_id' });
        }

        const entry = await InventoryModel.addPiece(userId, piece_id, provenance);
        return res.status(201).json({ entry });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    
    // Handle specific inventory errors
    if (error.message.includes('full') || error.message.includes('not found')) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
