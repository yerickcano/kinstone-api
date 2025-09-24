import type { NextApiRequest, NextApiResponse } from 'next';
import { UserModel } from '@/lib/models/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        // Get all users with pagination
        const { limit = 50, offset = 0 } = req.query;
        const users = await UserModel.findAll({
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        });
        return res.status(200).json({ users });

      case 'POST':
        // Create new user
        const { handle, display_name, inventory_capacity } = req.body;
        
        if (handle && !(await UserModel.isHandleAvailable(handle))) {
          return res.status(400).json({ error: 'Handle already taken' });
        }

        const user = await UserModel.create({
          handle,
          display_name,
          inventory_capacity
        });
        
        return res.status(201).json({ user });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
