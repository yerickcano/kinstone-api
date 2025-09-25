# Health Check API

## Overview
The health check endpoint provides system status information and database connectivity status.

## Endpoint
```
GET /api/v1/health
```

## Response Format

### Success Response (200 OK)
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "status": "connected",
    "responseTime": "12ms"
  },
  "version": "1.0.0"
}
```

### Error Response (500 Internal Server Error)
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "status": "disconnected",
    "error": "Connection timeout"
  },
  "version": "1.0.0"
}
```

## Usage Examples

### cURL
```bash
curl -X GET http://localhost:3000/api/v1/health
```

### JavaScript (fetch)
```javascript
const response = await fetch('/api/v1/health');
const health = await response.json();
console.log('System status:', health.status);
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Overall system status: "healthy" or "unhealthy" |
| `timestamp` | string | ISO timestamp of the health check |
| `database.status` | string | Database connection status |
| `database.responseTime` | string | Database response time (if connected) |
| `database.error` | string | Error message (if disconnected) |
| `version` | string | API version |

## Monitoring
This endpoint is ideal for:
- Load balancer health checks
- Monitoring systems (Datadog, New Relic, etc.)
- CI/CD pipeline verification
- Manual system status verification
