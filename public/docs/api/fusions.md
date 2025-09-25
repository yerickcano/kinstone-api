# Fusions API

## Overview
Handle Kinstone fusion attempts - the core gameplay mechanic where players combine two compatible pieces.

## Endpoints

### Attempt Fusion
```
POST /api/v1/fusions
```

## Request/Response Examples

### Successful Fusion (POST)

**Request Body:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "entry_id_1": "entry-123",
  "entry_id_2": "entry-124"
}
```

**Response (201 Created):**
```json
{
  "fusion": {
    "id": "fusion-789",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "input_piece_1_id": "piece-123",
    "input_piece_2_id": "piece-124",
    "success": true,
    "score_value": 100,
    "created_at": "2024-01-15T10:30:00.000Z",
    "input_piece_1": {
      "id": "piece-123",
      "name": "Forest Stone (Left)",
      "shape_family": "forest",
      "half": "left",
      "rarity": "rare"
    },
    "input_piece_2": {
      "id": "piece-124",
      "name": "Forest Stone (Right)",
      "shape_family": "forest",
      "half": "right",
      "rarity": "rare"
    }
  },
  "reward": {
    "type": "coins",
    "value": 500,
    "description": "Bonus coins for rare fusion!"
  },
  "consumed_pieces": ["entry-123", "entry-124"]
}
```

### Failed Fusion (POST)

**Response (200 OK):**
```json
{
  "fusion": {
    "id": "fusion-790",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "input_piece_1_id": "piece-125",
    "input_piece_2_id": "piece-126",
    "success": false,
    "score_value": 0,
    "created_at": "2024-01-15T10:35:00.000Z",
    "input_piece_1": {
      "id": "piece-125",
      "name": "Forest Stone (Left)",
      "shape_family": "forest",
      "half": "left",
      "rarity": "common"
    },
    "input_piece_2": {
      "id": "piece-126",
      "name": "Mountain Stone (Right)",
      "shape_family": "mountain",
      "half": "right",
      "rarity": "common"
    }
  },
  "reward": undefined,
  "consumed_pieces": []
}
```

## Field Descriptions

### Fusion Request
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | string | Yes | UUID of the user attempting fusion |
| `entry_id_1` | string | Yes | First inventory entry ID |
| `entry_id_2` | string | Yes | Second inventory entry ID |

### Fusion Response
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the fusion was successful |
| `score_value` | number | Points earned from the fusion |
| `consumed_pieces` | string[] | Entry IDs that were consumed |
| `reward` | object | Optional reward granted |

### Reward Object
| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Type of reward: "coins", "piece", "boost" |
| `value` | number | Numeric value of the reward |
| `description` | string | Human-readable description |

## Fusion Rules

### Compatibility Requirements
1. **Same Shape Family**: Both pieces must be from the same family
   - ✅ `forest` + `forest`
   - ❌ `forest` + `mountain`

2. **Opposite Halves**: Pieces must be complementary halves
   - ✅ `left` + `right`
   - ❌ `left` + `left`

3. **Different Pieces**: Cannot fuse a piece with itself
   - ❌ Same `entry_id`

### Scoring System
Base scores by rarity:
| Rarity | Base Score |
|--------|------------|
| common | 10 points |
| rare | 50 points |
| epic | 100 points |
| legendary | 250 points |

**Total Score** = Base Score (Piece 1) + Base Score (Piece 2)

### Reward System
Rewards are granted based on fusion success and piece rarity:

| Condition | Reward Type | Value |
|-----------|-------------|-------|
| Any legendary piece | coins | 1000 |
| Both epic pieces | coins | 500 |
| Both rare pieces | coins | 200 |
| Mixed rare/epic | coins | 300 |

## Atomic Operations

### Transaction Safety
- All fusion attempts are atomic
- Pieces are locked during fusion
- Failed fusions don't consume pieces
- Database rollback on any error

### Inventory Updates
1. **Lock** both inventory entries
2. **Validate** compatibility rules
3. **Create** fusion record
4. **Remove** consumed pieces (if successful)
5. **Grant** rewards (if applicable)
6. **Commit** or rollback transaction

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: user_id, entry_id_1, entry_id_2"
}
```

### 404 Not Found
```json
{
  "error": "One or both inventory entries not found"
}
```

### 409 Conflict
```json
{
  "error": "Cannot fuse a piece with itself"
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Pieces are not compatible: different shape families (forest vs mountain)"
}
```

```json
{
  "error": "Pieces are not compatible: same half (both left)"
}
```

### 423 Locked
```json
{
  "error": "One or both pieces are currently locked by another operation"
}
```
