# Pieces API

## Overview
Manage the Kinstone piece catalog - the collectible items that can be fused together in the game.

## Endpoints

### List Pieces
```
GET /api/v1/pieces
```

### Create Piece
```
POST /api/v1/pieces
```

## Request/Response Examples

### List Pieces (GET)

**Query Parameters:**
```
GET /api/v1/pieces?rarity=rare&shape_family=forest&limit=50&offset=0
```

**Response (200 OK):**
```json
{
  "pieces": [
    {
      "id": "piece-123",
      "shape_family": "forest",
      "half": "left",
      "rarity": "rare",
      "name": "Ancient Forest Stone (Left)",
      "description": "A mystical stone fragment from the heart of the ancient forest.",
      "tags": ["nature", "ancient", "mystical"],
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "piece-124",
      "shape_family": "forest",
      "half": "right",
      "rarity": "rare",
      "name": "Ancient Forest Stone (Right)",
      "description": "The complementary half of the ancient forest stone.",
      "tags": ["nature", "ancient", "mystical"],
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Create Piece (POST)

**Request Body:**
```json
{
  "shape_family": "mountain",
  "half": "left",
  "rarity": "epic",
  "name": "Thunder Peak Stone (Left)",
  "description": "A powerful stone that crackles with electric energy.",
  "tags": ["electric", "mountain", "power"]
}
```

**Response (201 Created):**
```json
{
  "piece": {
    "id": "piece-789",
    "shape_family": "mountain",
    "half": "left",
    "rarity": "epic",
    "name": "Thunder Peak Stone (Left)",
    "description": "A powerful stone that crackles with electric energy.",
    "tags": ["electric", "mountain", "power"],
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

## Field Descriptions

### Piece Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shape_family` | string | Yes | Stone family (forest, mountain, ocean, etc.) |
| `half` | string | Yes | Stone half: "left" or "right" |
| `rarity` | string | Yes | Rarity: "common", "rare", "epic", "legendary" |
| `name` | string | Yes | Display name of the piece |
| `description` | string | No | Detailed description |
| `tags` | string[] | No | Array of descriptive tags |

### Query Parameters (GET /pieces)
| Parameter | Type | Description |
|-----------|------|-------------|
| `rarity` | string | Filter by rarity level |
| `shape_family` | string | Filter by stone family |
| `tags` | string | Filter by tags (comma-separated) |
| `limit` | number | Max results (default: 100, max: 500) |
| `offset` | number | Results to skip (default: 0) |

## Fusion Compatibility

### Shape Families
Pieces can only fuse with pieces from the **same shape family**:
- `forest` + `forest` ✅
- `mountain` + `ocean` ❌

### Halves
Pieces can only fuse with their **opposite half**:
- `left` + `right` ✅
- `left` + `left` ❌

### Rarity Scoring
| Rarity | Base Score |
|--------|------------|
| common | 10 points |
| rare | 50 points |
| epic | 100 points |
| legendary | 250 points |

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: shape_family, half, name"
}
```

### 409 Conflict
```json
{
  "error": "Piece with this name already exists"
}
```
