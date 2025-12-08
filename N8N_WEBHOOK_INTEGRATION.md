# n8n Webhook Integration Guide

## Webhook Configuration

### Webhook URL
```
https://n8n.srv952553.hstgr.cloud/webhook/58e6269b-6e6d-4236-a441-ff41824771be
```

### HTTP Method
```
GET
```

---

## Input to n8n Webhook

### Headers Sent by Frontend
The frontend application will send the following headers to your n8n webhook:

```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: application/json
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
```

### Query Parameters
Currently, no query parameters are sent. The webhook is a simple GET request.

### Request Body
No request body is sent for GET requests.

---

## Expected Response from n8n Webhook

### Response Format 1: Standard Format (Recommended)
This is the preferred format that provides the most complete information.

```json
{
  "success": true,
  "data": [
    {
      "id": "role_001",
      "name": "employee",
      "display_name": "Employee",
      "description": "Regular employee with limited access",
      "permissions": ["view_tasks", "create_tasks", "edit_own_tasks"],
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "role_002",
      "name": "admin",
      "display_name": "Administrator",
      "description": "Full system administrator with all permissions",
      "permissions": ["*"],
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "role_003",
      "name": "partner",
      "display_name": "Partner",
      "description": "External partner with specific access",
      "permissions": ["view_tasks", "create_tasks"],
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "role_004",
      "name": "customer",
      "display_name": "Customer",
      "description": "Customer with limited portal access",
      "permissions": ["view_own_claims", "create_claims"],
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Roles retrieved successfully"
}
```

### Response Format 2: Simple Array Format
If you prefer a simpler format, you can return just an array of roles.

```json
[
  {
    "id": "role_001",
    "name": "employee",
    "display_name": "Employee",
    "description": "Regular employee with limited access",
    "permissions": ["view_tasks", "create_tasks", "edit_own_tasks"],
    "is_active": true
  },
  {
    "id": "role_002",
    "name": "admin",
    "display_name": "Administrator",
    "description": "Full system administrator with all permissions",
    "permissions": ["*"],
    "is_active": true
  },
  {
    "id": "role_003",
    "name": "partner",
    "display_name": "Partner",
    "description": "External partner with specific access",
    "permissions": ["view_tasks", "create_tasks"],
    "is_active": true
  },
  {
    "id": "role_004",
    "name": "customer",
    "display_name": "Customer",
    "description": "Customer with limited portal access",
    "permissions": ["view_own_claims", "create_claims"],
    "is_active": true
  }
]
```

### Response Format 3: With Roles Property
Alternative format with roles wrapped in a property.

```json
{
  "roles": [
    {
      "id": "role_001",
      "name": "employee",
      "display_name": "Employee",
      "description": "Regular employee with limited access",
      "permissions": ["view_tasks", "create_tasks", "edit_own_tasks"],
      "is_active": true
    },
    {
      "id": "role_002",
      "name": "admin",
      "display_name": "Administrator",
      "description": "Full system administrator with all permissions",
      "permissions": ["*"],
      "is_active": true
    },
    {
      "id": "role_003",
      "name": "partner",
      "display_name": "Partner",
      "description": "External partner with specific access",
      "permissions": ["view_tasks", "create_tasks"],
      "is_active": true
    },
    {
      "id": "role_004",
      "name": "customer",
      "display_name": "Customer",
      "description": "Customer with limited portal access",
      "permissions": ["view_own_claims", "create_claims"],
      "is_active": true
    }
  ]
}
```

---

## Role Object Structure

### Required Fields
- **id**: Unique identifier for the role (string)
- **name**: Internal role name used by the system (string)
- **display_name**: Human-readable name shown in the UI (string)

### Optional Fields
- **description**: Description of the role (string)
- **permissions**: Array of permission strings (array of strings)
- **is_active**: Whether the role is active (boolean, defaults to true)
- **created_at**: ISO timestamp when role was created (string)
- **updated_at**: ISO timestamp when role was last updated (string)

### Field Descriptions

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| id | string | Yes | Unique role identifier | "role_001" |
| name | string | Yes | Internal role name | "employee" |
| display_name | string | Yes | UI display name | "Employee" |
| description | string | No | Role description | "Regular employee with limited access" |
| permissions | array | No | Array of permission strings | ["view_tasks", "create_tasks"] |
| is_active | boolean | No | Role active status | true |
| created_at | string | No | ISO timestamp | "2024-01-15T10:30:00Z" |
| updated_at | string | No | ISO timestamp | "2024-01-15T10:30:00Z" |

---

## HTTP Response Headers

Your n8n webhook should return these headers:

```
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-ID
```

---

## HTTP Status Codes

### Success Responses
- **200 OK**: Successful response with role data

### Error Responses
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Access denied
- **500 Internal Server Error**: Server error

---

## Error Response Format

If your webhook encounters an error, return this format:

```json
{
  "success": false,
  "message": "Error description",
  "error_code": "ERROR_CODE"
}
```

Example error responses:

```json
{
  "success": false,
  "message": "Database connection failed",
  "error_code": "DB_001"
}
```

```json
{
  "success": false,
  "message": "Authentication required",
  "error_code": "AUTH_001"
}
```

---

## n8n Workflow Setup

### 1. Webhook Trigger Node
- **Node Type**: Webhook
- **HTTP Method**: GET
- **Path**: `/58e6269b-6e6d-4236-a441-ff41824771be`
- **Response Mode**: Respond to Webhook

### 2. Data Source Node
Connect your webhook to your data source (database, API, etc.)

### 3. Data Processing Node
Transform your data to match the expected response format

### 4. Response Node
Return the formatted JSON response

### Example n8n Workflow Structure
```
Webhook Trigger → Database Query → Data Transform → HTTP Response
```

---

## Testing the Webhook

### Test URL
You can test your webhook using:
```
https://n8n.srv952553.hstgr.cloud/webhook/58e6269b-6e6d-4236-a441-ff41824771be
```

### Test Tools
- **Browser**: Direct GET request
- **cURL**: Command line testing
- **Postman**: API testing tool
- **Frontend Test Page**: `/test-roles` in the application

### cURL Test Command
```bash
curl -X GET \
  https://n8n.srv952553.hstgr.cloud/webhook/58e6269b-6e6d-4236-a441-ff41824771be \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -H "X-Session-ID: test_session"
```

---

## Fallback Behavior

If the n8n webhook fails or returns an unexpected format, the frontend will automatically fall back to mock data:

```json
[
  {
    "id": "role_001",
    "name": "employee",
    "display_name": "Employee",
    "description": "Regular employee",
    "permissions": ["view_tasks", "create_tasks", "edit_own_tasks"],
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "role_002",
    "name": "admin",
    "display_name": "Administrator",
    "description": "Administrator",
    "permissions": ["*"],
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "role_003",
    "name": "partner",
    "display_name": "Partner",
    "description": "External partner",
    "permissions": ["view_tasks", "create_tasks"],
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "role_004",
    "name": "customer",
    "display_name": "Customer",
    "description": "Customer",
    "permissions": ["view_own_claims", "create_claims"],
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

---

## Security Considerations

### Authentication
- The frontend sends JWT token and session ID headers
- You can validate these in your n8n workflow
- Consider implementing authentication checks

### Rate Limiting
- Implement rate limiting to prevent abuse
- Consider IP-based or token-based rate limiting

### CORS
- Ensure proper CORS headers are set
- Allow requests from your frontend domain

---

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure proper CORS headers are set
   - Check if the frontend domain is allowed

2. **Authentication Errors**
   - Verify JWT token format
   - Check session ID validation

3. **Response Format Errors**
   - Ensure JSON is properly formatted
   - Check required fields are present

4. **Timeout Issues**
   - Keep response time under 10 seconds
   - Optimize database queries

### Debug Steps

1. Check n8n workflow execution logs
2. Test webhook directly with cURL
3. Verify response format matches expected structure
4. Check frontend console for error messages
5. Use the `/test-roles` page to debug responses

---

## Support

For webhook integration support:
- **n8n Documentation**: https://docs.n8n.io/
- **Frontend Test Page**: `/test-roles`
- **API Documentation**: `API_DOCUMENTATION.md`
