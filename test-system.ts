#!/usr/bin/env ts-node

/**
 * Test script to demonstrate the Kinstone fusion system
 * Run with: yarn test:system
 */

import * as dotenv from 'dotenv';
import { UserModel } from './lib/models/User';
import { InventoryModel } from './lib/models/Inventory';
import { PieceModel } from './lib/models/Piece';
import { FusionModel } from './lib/models/Fusion';
import { RewardModel } from './lib/models/Reward';
import { close } from './lib/database/connection';
import { UserWithInventory, InventoryEntryWithPiece } from './lib/types/database';

dotenv.config();

interface CompatiblePair {
  piece1: InventoryEntryWithPiece;
  piece2: InventoryEntryWithPiece;
  compatibility: any;
}

async function testSystem(): Promise<void> {
  try {
    console.log('🎮 Testing Kinstone Fusion System\n');

    // Test 1: Find a test user
    console.log('1️⃣ Finding test user...');
    const user: UserWithInventory | null = await UserModel.findByHandle('player1');
    if (!user) {
      console.log('❌ No test user found. Run "npm run seed" first.');
      return;
    }
    console.log(`✅ Found user: ${user.display_name} (${user.handle})`);
    console.log(`   Inventory: ${user.inventory.current_usage}/${user.inventory.capacity} pieces\n`);

    // Test 2: Get inventory
    console.log('2️⃣ Getting inventory...');
    const inventory = await InventoryModel.getByUserId(user.id);
    if (!inventory) {
      console.log('❌ No inventory found for user.');
      return;
    }
    console.log(`✅ Inventory loaded with ${inventory.entries.length} pieces:`);
    inventory.entries.forEach((entry, i) => {
      console.log(`   ${i + 1}. ${entry.name} (${entry.shape_family} ${entry.half}, ${entry.rarity})`);
    });
    console.log();

    // Test 3: Find compatible pieces for fusion
    console.log('3️⃣ Looking for compatible pieces...');
    let compatiblePair: CompatiblePair | null = null;
    
    for (let i = 0; i < inventory.entries.length; i++) {
      for (let j = i + 1; j < inventory.entries.length; j++) {
        const piece1 = inventory.entries[i];
        const piece2 = inventory.entries[j];
        
        const compatibility = await PieceModel.checkFusionCompatibility(piece1.piece_id, piece2.piece_id);
        if (compatibility.is_compatible) {
          compatiblePair = { piece1, piece2, compatibility };
          break;
        }
      }
      if (compatiblePair) break;
    }

    if (!compatiblePair) {
      console.log('❌ No compatible pieces found in inventory');
      
      // Add some compatible pieces for testing
      console.log('   Adding compatible test pieces...');
      const starPieces = await PieceModel.findByShapeFamily('star');
      if (starPieces.length >= 2) {
        const starA = starPieces.find(p => p.half === 'A');
        const starB = starPieces.find(p => p.half === 'B');
        
        if (starA && starB) {
          await InventoryModel.addPiece(user.id, starA.id, 'admin');
          await InventoryModel.addPiece(user.id, starB.id, 'admin');
          console.log('   ✅ Added Star A and Star B pieces');
          
          // Refresh inventory
          const newInventory = await InventoryModel.getByUserId(user.id);
          if (newInventory) {
            const newStarA = newInventory.entries.find(e => e.piece_id === starA.id);
            const newStarB = newInventory.entries.find(e => e.piece_id === starB.id);
            
            if (newStarA && newStarB) {
              compatiblePair = {
                piece1: newStarA,
                piece2: newStarB,
                compatibility: await PieceModel.checkFusionCompatibility(starA.id, starB.id)
              };
            }
          }
        }
      }
    }

    if (compatiblePair) {
      console.log(`✅ Found compatible pieces:`);
      console.log(`   ${compatiblePair.piece1.name} + ${compatiblePair.piece2.name}`);
      console.log(`   Shape: ${compatiblePair.compatibility.piece1_shape} (${compatiblePair.compatibility.piece1_half} + ${compatiblePair.compatibility.piece2_half})\n`);

      // Test 4: Attempt fusion
      console.log('4️⃣ Attempting fusion...');
      const fusionResult = await FusionModel.attemptFusion(
        user.id,
        compatiblePair.piece1.id,
        compatiblePair.piece2.id
      );

      console.log(`✅ Fusion ${fusionResult.fusion.is_success ? 'SUCCESS' : 'FAILED'}!`);
      console.log(`   Score: ${fusionResult.fusion.score_value} points`);
      console.log(`   Pieces consumed: ${fusionResult.consumed_pieces.length}`);
      
      if (fusionResult.reward) {
        console.log(`   Reward: ${fusionResult.reward.description} (${fusionResult.reward.value} ${fusionResult.reward.type})`);
      }
      console.log();

      // Test 5: Check updated inventory
      console.log('5️⃣ Checking updated inventory...');
      const updatedInventory = await InventoryModel.getByUserId(user.id);
      if (updatedInventory) {
        console.log(`✅ Inventory now has ${updatedInventory.entries.length} pieces (${updatedInventory.current_usage}/${updatedInventory.capacity})\n`);
      }

      // Test 6: Get fusion history
      console.log('6️⃣ Getting fusion history...');
      const history = await FusionModel.getHistory(user.id, { limit: 5 });
      console.log(`✅ Found ${history.length} recent fusions:`);
      history.forEach((fusion, i) => {
        console.log(`   ${i + 1}. ${fusion.input_piece_1_name} + ${fusion.input_piece_2_name} = ${fusion.is_success ? 'SUCCESS' : 'FAIL'} (${fusion.score_value} pts)`);
      });
      console.log();

      // Test 7: Get user statistics
      console.log('7️⃣ Getting user statistics...');
      const stats = await FusionModel.getStats(user.id);
      console.log(`✅ User Statistics:`);
      console.log(`   Total attempts: ${stats.total_attempts}`);
      console.log(`   Successful fusions: ${stats.successful_fusions}`);
      console.log(`   Success rate: ${(stats.success_rate * 100).toFixed(1)}%`);
      console.log(`   Total score: ${stats.total_score}`);
      console.log(`   Average score: ${stats.average_score.toFixed(1)}`);
      console.log();

      // Test 8: Check rewards
      console.log('8️⃣ Checking rewards...');
      const rewards = await RewardModel.getByUserId(user.id);
      console.log(`✅ Found ${rewards.length} rewards:`);
      rewards.forEach((reward, i) => {
        console.log(`   ${i + 1}. ${reward.reward_type}: ${JSON.stringify(reward.reward_value)} (${reward.status})`);
      });
    }

    console.log('\n🎉 System test completed successfully!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await close();
  }
}

// Run the test
if (require.main === module) {
  testSystem().catch(console.error);
}

export { testSystem };
