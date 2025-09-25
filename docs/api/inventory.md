# Inventory API

## Overview
Manage user inventories - the collection of Kinstone pieces that each player owns.

## Endpoints

### Get User Inventory
```
GET /api/v1/inventory/{userId}
```

### Add Piece to Inventory
```
POST /api/v1/inventory/{userId}
```

## Request/Response Examples

### Get Inventory (GET)

**Request:**
```
GET /api/v1/inventory/550e8400-e29b-41d4-a716-446655440000?limit=20&offset=0
```

**Response (200 OK):**
```json
{
  "inventory": {
    "id": "inv-123",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "capacity": 100,
    "current_count": 25,
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "entries": [
    {
      "id": "entry-456",
      "inventory_id": "inv-123",
      "piece_id": "piece-789",
      "provenance": "reward",
      "acquired_at": "2024-01-15T09:15:00.000Z",
      "piece": {
        "id": "piece-789",
        "name": "Forest Stone (Left)",
        "shape_family": "forest",
        "half": "left",
        "rarity": "common",
        "description": "A common forest stone fragment.",
        "tags": ["nature", "common"]
      }
    },
    {
      "id": "entry-457",
      "inventory_id": "inv-123",
      "piece_id": "piece-790",
      "provenance": "fusion_reward",
      "acquired_at": "2024-01-15T09:30:00.000Z",
      "piece": {
        "id": "piece-790",
        "name": "Mountain Stone (Right)",
        "shape_family": "mountain",
        "half": "right",
        "rarity": "rare",
        "description": "A rare mountain stone with crystalline formations.",
        "tags": ["mountain", "crystal", "rare"]
      }
    }
  ],
  "stats": {
    "by_rarity": {
      "common": 15,
      "rare": 8,
      "epic": 2,
      "legendary": 0
    },
    "by_shape_family": {
      "forest": 12,
      "mountain": 8,
      "ocean": 5
    },
    "by_half": {
      "left": 13,
      "right": 12
    }
  }
}
```

### Add Piece to Inventory (POST)

**Request Body:**
```json
{
  "piece_id": "piece-999",
  "provenance": "purchase"
}
```

**Response (201 Created):**
```json
{
  "entry": {
    "id": "entry-999",
    "inventory_id": "inv-123",
    "piece_id": "piece-999",
    "provenance": "purchase",
    "acquired_at": "2024-01-15T10:45:00.000Z",
    "piece": {
      "id": "piece-999",
      "name": "Ocean Stone (Left)",
      "shape_family": "ocean",
      "half": "left",
      "rarity": "epic",
      "description": "A powerful ocean stone that glows with blue energy.",
      "tags": ["ocean", "energy", "epic"]
    }
  },
  "inventory": {
    "current_count": 26,
    "capacity": 100,
    "available_slots": 74
  }
}
```

## Field Descriptions

### Inventory Object
| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | UUID of the inventory owner |
| `capacity` | number | Maximum number of pieces |
| `current_count` | number | Current number of pieces |

### Inventory Entry Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `piece_id` | string | Yes | UUID of the piece to add |
| `provenance` | string | Yes | How the piece was acquired |

### Provenance Types
| Value | Description |
|-------|-------------|
| `reward` | Granted as a game reward |
| `fusion_reward` | Received from successful fusion |
| `purchase` | Bought from shop |
| `gift` | Received as a gift |
| `event` | Special event reward |

### Query Parameters (GET)
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max entries to return (default: 50, max: 200) |
| `offset` | number | Entries to skip (default: 0) |
| `rarity` | string | Filter by piece rarity |
| `shape_family` | string | Filter by shape family |
| `half` | string | Filter by piece half |
| `provenance` | string | Filter by acquisition method |

## Capacity Management

### Capacity Rules
- Each user has a maximum inventory capacity
- Default capacity: 50 pieces
- Premium users may have higher capacity
- Adding pieces when at capacity will fail

### Capacity Check Response
```json
{
  "inventory": {
    "current_count": 50,
    "capacity": 50,
    "available_slots": 0,
    "is_full": true
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required field: piece_id"
}
```

### 404 Not Found
```json
{
  "error": "User inventory not found"
}
```

### 409 Conflict
```json
{
  "error": "Inventory is at full capacity (50/50)"
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Invalid provenance type. Must be one of: reward, fusion_reward, purchase, gift, event"
}
```
