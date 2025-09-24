import type { NextApiRequest, NextApiResponse } from 'next';
import { UserModel } from '@/lib/models/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get user by ID
        const user = await UserModel.findById(id);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ user });

      case 'PUT':
        // Update user
        const { handle, display_name } = req.body;
        
        if (handle && !(await UserModel.isHandleAvailable(handle, id))) {
          return res.status(400).json({ error: 'Handle already taken' });
        }

        const updatedUser = await UserModel.update(id, {
          handle,
          display_name
        });
        
        if (!updatedUser) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        return res.status(200).json({ user: updatedUser });

      case 'DELETE':
        // Soft delete user
        const deleted = await UserModel.delete(id);
        if (!deleted) {
          return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ message: 'User deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
