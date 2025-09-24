import type { NextApiRequest, NextApiResponse } from 'next';
import { FusionModel } from '@/lib/models/Fusion';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'POST':
        // Attempt fusion
        const { user_id, entry_id_1, entry_id_2 } = req.body;
        
        if (!user_id || !entry_id_1 || !entry_id_2) {
          return res.status(400).json({ 
            error: 'Missing required fields: user_id, entry_id_1, entry_id_2' 
          });
        }

        const fusionResult = await FusionModel.attemptFusion(
          user_id,
          entry_id_1,
          entry_id_2
        );
        
        return res.status(200).json({ fusion: fusionResult });

      default:
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    
    // Handle specific fusion errors
    if (error.message.includes('Cannot fuse')) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
