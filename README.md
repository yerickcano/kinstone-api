# Kinstone Fusion API

A TypeScript + PostgreSQL backend for a Kinstone fusion mini-game. Players collect two-part stone pieces and fuse complementary halves to create complete Kinstones, earning rewards and scores.

## 🎮 Game Concept

**Kinstones** are collectible, two-part stones where each "kinstone piece" is half of a whole. Players must find complementary halves to fuse into complete kinstones.

### Core Rules
- **Compatibility**: Valid fusion requires same shape family and opposite half (e.g., Star A + Star B)
- **Consumption**: Successful fusion consumes both input pieces atomically
- **Rewards**: Successful fusions grant scores and optional rewards based on rarity
- **Inventory**: Limited capacity storage with overflow protection

## 🏗️ Architecture

### Database Entities

- **User**: Player identity with optional display name/handle
- **Inventory**: One-to-one with User, manages capacity and current usage
- **Piece**: Immutable catalog of piece archetypes (shape, half, rarity)
- **InventoryEntry**: User-owned instances of pieces with provenance tracking
- **Fusion**: Transaction log of all fusion attempts (success/failure)
- **Reward**: Optional rewards from successful fusions
- **DropRuleset**: Configurable probability weights for piece drops

### Key Features

- **Atomic Transactions**: All mutations use PostgreSQL transactions with row-level locking
- **Idempotency**: Prevents double-consume with proper locking mechanisms
- **Performance**: Indexed foreign keys and created_at columns for efficient queries
- **Audit Trail**: Complete history of all fusion attempts and piece movements
- **Flexible Rewards**: JSON-based reward system supporting various types

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- TypeScript 5.1+

### Installation

```bash
# Clone and install dependencies
yarn install

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/kinstone_db

# Run migrations to create schema
yarn migrate

# Seed with test data
yarn seed

# Start development server (with TypeScript compilation)
yarn dev
```

### Database Setup

The system includes a complete migration and seeding system:

```bash
# Create database schema
yarn migrate

# Populate with test pieces and users
yarn seed

# Start fresh (migrate + seed)
yarn setup
```

## 📊 Database Schema

### Core Tables

```sql
-- Users and their inventories (1:1 relationship)
users (id, handle, display_name, created_at, updated_at, is_active)
inventories (id, user_id, capacity, current_usage, created_at, updated_at)

-- Piece catalog and user instances
pieces (id, shape_family, half, rarity, name, description, tags, is_active)
inventory_entries (id, inventory_id, piece_id, provenance, is_locked, serial_number, created_at)

-- Fusion system
fusions (id, user_id, input_piece_1_id, input_piece_2_id, input_piece_1_catalog_id, input_piece_2_catalog_id, shape_family, is_success, score_value, created_at)
rewards (id, fusion_id, user_id, reward_type, reward_value, status, created_at, claimed_at)
```

### Enums and Types

```sql
piece_half: 'A' | 'B'
piece_rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
inventory_entry_provenance: 'drop' | 'reward' | 'grant' | 'admin'
reward_type: 'points' | 'coins' | 'cosmetic' | 'lootbox' | 'event_trigger'
reward_status: 'pending' | 'claimed' | 'consumed'
```

## 🔧 API Models

All models are fully typed with TypeScript interfaces and provide comprehensive type safety.

### User Model
```typescript
// Create user with inventory
const user = await UserModel.create({
  handle: 'player1',
  display_name: 'Player One',
  inventory_capacity: 50
});

// Get user with inventory details
const user = await UserModel.findById(userId);
const user = await UserModel.findByHandle('player1');

// Get fusion history
const history = await UserModel.getFusionHistory(userId, limit, offset);
```

### Inventory Model
```typescript
// Get inventory with entries
const inventory = await InventoryModel.getByUserId(userId);

// Add piece to inventory
const entry = await InventoryModel.addPiece(userId, pieceId, 'drop');

// Remove piece (with ownership check)
const removed = await InventoryModel.removePiece(userId, entryId);

// Get inventory statistics
const stats = await InventoryModel.getStats(userId);
```

### Fusion Model
```typescript
// Attempt atomic fusion
const result = await FusionModel.attemptFusion(userId, entryId1, entryId2);
// Returns: { fusion, reward, consumed_pieces }

// Get fusion history with filtering
const history = await FusionModel.getHistory(userId, {
  limit: 50,
  success_only: true,
  shape_family: 'star'
});

// Get user statistics
const stats = await FusionModel.getStats(userId);
```

### Piece Model
```typescript
// Find complementary piece for fusion
const complement = await PieceModel.findComplementaryPiece(pieceId);

// Check fusion compatibility
const compatibility = await PieceModel.checkFusionCompatibility(piece1Id, piece2Id);

// Get all pieces with filtering
const pieces = await PieceModel.findAll({
  rarity: 'rare',
  shape_family: 'star',
  tags: ['celestial']
});
```

## 🎯 Game Mechanics

### Fusion Logic

1. **Validation**: Check piece ownership, lock status, and compatibility
2. **Locking**: Use `FOR UPDATE` to prevent concurrent access
3. **Compatibility**: Same shape family + opposite halves (A + B)
4. **Scoring**: Rarity-based scoring system
5. **Consumption**: Atomic removal of input pieces
6. **Rewards**: Optional reward generation based on rarity

### Scoring System

```typescript
const rarityScores: Record<PieceRarity, number> = {
  'common': 10,
  'uncommon': 25, 
  'rare': 50,
  'epic': 100,
  'legendary': 250
};
// Total score = piece1_score + piece2_score
```

### Inventory Management

- **Capacity Enforcement**: Additions fail if inventory full
- **Usage Tracking**: Automatic via database triggers
- **Locking System**: Prevent piece usage during cooldowns
- **Provenance Tracking**: Track how pieces were obtained

## 🔒 Transaction Safety

### Atomic Operations
- All mutations wrapped in PostgreSQL transactions
- Row-level locking prevents race conditions
- Rollback on any failure maintains consistency

### Idempotency
- Fusion attempts use `FOR UPDATE` locking
- Inventory operations check ownership and capacity
- Reward claiming prevents double-processing

### Performance
- Indexed foreign key relationships
- Efficient pagination with LIMIT/OFFSET
- Optimized queries for common operations

## 🧪 Test Data

The seed system creates:
- **9 Shape Families**: star, heart, moon, diamond, flame, leaf, wave, lightning
- **Multiple Rarities**: Each family has pieces across different rarity levels
- **Test Users**: 3 users with pre-populated inventories
- **Drop Rulesets**: Probability-weighted drop configurations

### Example Pieces
```typescript
// Star family (common + rare variants)
{ shape_family: 'star', half: 'A' as PieceHalf, rarity: 'common' as PieceRarity, name: 'Star Fragment A' }
{ shape_family: 'star', half: 'B' as PieceHalf, rarity: 'common' as PieceRarity, name: 'Star Fragment B' }
{ shape_family: 'star', half: 'A' as PieceHalf, rarity: 'rare' as PieceRarity, name: 'Golden Star Fragment A' }

// Heart family (uncommon + epic variants)  
{ shape_family: 'heart', half: 'A' as PieceHalf, rarity: 'uncommon' as PieceRarity, name: 'Heart Shard A' }
{ shape_family: 'heart', half: 'A' as PieceHalf, rarity: 'epic' as PieceRarity, name: 'Crystal Heart Shard A' }
```

## 📈 Future Enhancements

- **API Endpoints**: REST API with Express.js
- **Authentication**: JWT-based user sessions
- **Real-time Events**: WebSocket notifications for drops/fusions
- **Leaderboards**: Global and seasonal rankings
- **Events**: Time-limited drop rate modifications
- **Trading**: Player-to-player piece exchange

## 🛠️ Development

### Scripts
```bash
yarn build        # Compile TypeScript to JavaScript (Next.js build)
yarn dev          # Development server with Next.js
yarn start        # Production server (requires build first)
yarn test         # Run test suite
yarn test:system  # Run system integration test
yarn migrate      # Run database migrations
yarn seed         # Populate test data
yarn setup        # Run migrate + seed
yarn type-check   # Type check without compilation
yarn lint         # Run Next.js ESLint
```

### Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kinstone_db
DB_USER=username
DB_PASSWORD=password
PORT=3000
NODE_ENV=development
DEFAULT_INVENTORY_CAPACITY=50
```

## 📝 License

ISC License - see LICENSE file for details.
