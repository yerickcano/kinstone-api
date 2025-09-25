import type { NextApiRequest, NextApiResponse } from 'next';
import { PieceModel } from '@/lib/models/Piece';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // Get all pieces with optional filtering
      const { rarity, shape_family, tags, limit = 100, offset = 0 } = req.query;
      
      const filters: any = {};
      if (rarity) filters.rarity = rarity;
      if (shape_family) filters.shape_family = shape_family;
      if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];

      const pieces = await PieceModel.findAll(filters, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      
      return res.status(200).json({ pieces });
    }

    if (req.method === 'POST') {
      // Create new piece (admin only)
      const { shape_family: bodyShapeFamily, half, rarity, name, description, tags: bodyTags } = req.body;
      
      if (!bodyShapeFamily || !half || !name) {
        return res.status(400).json({ 
          error: 'Missing required fields: shape_family, half, name' 
        });
      }

      const piece = await PieceModel.create({
        shape_family: bodyShapeFamily,
        half,
        rarity,
        name,
        description,
        tags: bodyTags
      });
      
      return res.status(201).json({ piece });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
