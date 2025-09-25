import { transaction, close } from '../database/connection';
import { pieces } from './pieces';
import { User } from '../types/database';

interface TestUser {
  handle: string;
  display_name: string;
}

async function seedDatabase(): Promise<void> {
  try {
    console.log('Starting database seeding...');
    
    await transaction(async (client) => {
      // Clear existing data (in reverse dependency order)
      console.log('Clearing existing data...');
      await client.query('DELETE FROM rewards');
      await client.query('DELETE FROM fusions');
      await client.query('DELETE FROM inventory_entries');
      await client.query('DELETE FROM inventories');
      await client.query('DELETE FROM users');
      await client.query('DELETE FROM pieces');
      await client.query('DELETE FROM drop_rulesets');
      
      // Reset sequences
      await client.query('ALTER SEQUENCE inventory_entries_serial_number_seq RESTART WITH 1');
      
      console.log('✓ Cleared existing data');
      
      // Seed pieces
      console.log('Seeding pieces...');
      for (const piece of pieces) {
        await client.query(
          `INSERT INTO pieces (shape_family, half, rarity, name, description, tags)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [piece.shape_family, piece.half, piece.rarity, piece.name, piece.description, piece.tags]
        );
      }
      console.log(`✓ Seeded ${pieces.length} pieces`);
      
      // Create test users
      console.log('Creating test users...');
      const testUsers: TestUser[] = [
        {
          handle: 'player1',
          display_name: 'Test Player One'
        },
        {
          handle: 'player2',
          display_name: 'Test Player Two'
        },
        {
          handle: 'admin',
          display_name: 'Admin User'
        }
      ];
      
      const createdUsers: User[] = [];
      for (const userData of testUsers) {
        const userResult = await client.query<User>(
          `INSERT INTO users (handle, display_name) VALUES ($1, $2) RETURNING *`,
          [userData.handle, userData.display_name]
        );
        
        const user = userResult.rows[0];
        createdUsers.push(user);
        
        // Create inventory for each user
        await client.query(
          `INSERT INTO inventories (user_id, capacity) VALUES ($1, $2)`,
          [user.id, 50]
        );
      }
      console.log(`✓ Created ${createdUsers.length} test users with inventories`);
      
      // Add some pieces to test users' inventories
      console.log('Adding test pieces to inventories...');
      const piecesResult = await client.query<any>('SELECT * FROM pieces ORDER BY shape_family, half');
      const allPieces = piecesResult.rows;
      
      for (const user of createdUsers) {
        const inventoryResult = await client.query<{ id: string }>(
          'SELECT id FROM inventories WHERE user_id = $1',
          [user.id]
        );
        const inventoryId = inventoryResult.rows[0].id;
        
        // Add a variety of pieces to each user (5-10 pieces)
        const numPieces = Math.floor(Math.random() * 6) + 5;
        const selectedPieces: any[] = [];
        
        for (let i = 0; i < numPieces; i++) {
          const randomPiece = allPieces[Math.floor(Math.random() * allPieces.length)];
          selectedPieces.push(randomPiece);
          
          await client.query(
            `INSERT INTO inventory_entries (inventory_id, piece_id, provenance)
             VALUES ($1, $2, $3)`,
            [inventoryId, randomPiece.id, 'grant']
          );
        }
        
        console.log(`✓ Added ${numPieces} pieces to ${user.handle}'s inventory`);
      }
      
      // Create a basic drop ruleset
      console.log('Creating default drop ruleset...');
      const commonPieces = allPieces.filter(p => p.rarity === 'common');
      const uncommonPieces = allPieces.filter(p => p.rarity === 'uncommon');
      const rarePieces = allPieces.filter(p => p.rarity === 'rare');
      
      const probabilityWeights: Record<string, number> = {};
      
      // Common pieces: 60% total probability
      commonPieces.forEach(piece => {
        probabilityWeights[piece.id] = 60 / commonPieces.length;
      });
      
      // Uncommon pieces: 25% total probability
      uncommonPieces.forEach(piece => {
        probabilityWeights[piece.id] = 25 / uncommonPieces.length;
      });
      
      // Rare pieces: 15% total probability
      rarePieces.forEach(piece => {
        probabilityWeights[piece.id] = 15 / rarePieces.length;
      });
      
      await client.query(
        `INSERT INTO drop_rulesets (name, description, probability_weights, is_active)
         VALUES ($1, $2, $3, $4)`,
        [
          'Default Drop Rates',
          'Standard probability distribution for piece drops',
          JSON.stringify(probabilityWeights),
          true
        ]
      );
      
      console.log('✓ Created default drop ruleset');
    });
    
    console.log('✅ Database seeding completed successfully');
    
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await close();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}

export { seedDatabase };
