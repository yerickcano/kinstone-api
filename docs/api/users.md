# Users API

## Overview
Manage user accounts, profiles, and user-related operations in the Kinstone fusion game.

## Endpoints

### List Users
```
GET /api/v1/users
```

### Create User
```
POST /api/v1/users
```

### Get User by ID
```
GET /api/v1/users/{id}
```

### Update User
```
PUT /api/v1/users/{id}
```

### Delete User
```
DELETE /api/v1/users/{id}
```

## Request/Response Examples

### Create User (POST)

**Request Body:**
```json
{
  "handle": "player123",
  "display_name": "Master Collector",
  "inventory_capacity": 100
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "handle": "player123",
    "display_name": "Master Collector",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "inventory": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "capacity": 100,
    "current_count": 0
  }
}
```

### Get User (GET)

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "handle": "player123",
    "display_name": "Master Collector",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "inventory": {
      "capacity": 100,
      "current_count": 25,
      "entries": [
        {
          "id": "entry-1",
          "piece_id": "piece-123",
          "piece": {
            "name": "Forest Stone (Left)",
            "shape_family": "forest",
            "half": "left",
            "rarity": "common"
          },
          "provenance": "reward",
          "acquired_at": "2024-01-15T09:00:00.000Z"
        }
      ]
    },
    "fusion_history": [
      {
        "id": "fusion-456",
        "success": true,
        "score_value": 150,
        "created_at": "2024-01-15T08:30:00.000Z"
      }
    ]
  }
}
```

## Field Descriptions

### User Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `handle` | string | Yes | Unique username (3-50 chars) |
| `display_name` | string | Yes | Display name (1-100 chars) |
| `inventory_capacity` | number | No | Max inventory slots (default: 50) |

### Query Parameters (GET /users)
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results to return (default: 20, max: 100) |
| `offset` | number | Number of results to skip (default: 0) |
| `search` | string | Search by handle or display name |

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: handle, display_name"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "error": "Handle already exists"
}
```
