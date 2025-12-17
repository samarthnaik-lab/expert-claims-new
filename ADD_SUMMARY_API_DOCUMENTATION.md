# Add Summary API Documentation

## Endpoint
**POST** `http://localhost:3000/admin/addsummary`

## Purpose
Adds an expert summary/description to a backlog case assignment in the Gap Analysis tab.

## Request Headers

```http
accept: application/json
content-type: application/json
session_id: <session_id_from_localStorage>
jwt_token: <jwt_token_from_localStorage>
```

### Header Details:
- **session_id**: Retrieved from `localStorage.getItem('expertclaims_session')` → `session.sessionId`
- **jwt_token**: Retrieved from `localStorage.getItem('expertclaims_session')` → `session.jwtToken`

### User ID Retrieval:
The `user_id`, `created_by`, and `updated_by` are retrieved from `localStorage.getItem('expertclaims_user_details')`.

**Retrieval Process:**
1. Get data from `expertclaims_user_details` key in localStorage
2. Parse the JSON data (handles both array and object formats)
3. Extract `userid` from the data object
4. Fallback order: `userDetails.userid` → `userDetails.user_id` → `userDetails.employee_id` → `userDetails.id`

**Example:** If `expertclaims_user_details` contains `{ userid: "12345", email: "admin@company.com" }`, then `user_id`, `created_by`, and `updated_by` will all be `"12345"`

## Request Payload

### Body (JSON)

```json
{
  "backlog_id": "string | number",
  "expert_description": "string",
  "created_by": "string | number",
  "updated_by": "string | number",
  "user_id": "string | number"
}
```

### Payload Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `backlog_id` | string \| number | Yes | The ID of the backlog case to add summary to |
| `expert_description` | string | Yes | The expert summary/analysis text content |
| `created_by` | string \| number | Yes | User ID from `expertclaims_user_details.userid` in localStorage |
| `updated_by` | string \| number | Yes | User ID from `expertclaims_user_details.userid` in localStorage |
| `user_id` | string \| number | Yes | User ID from `expertclaims_user_details.userid` in localStorage |

### Example Request Payload:

```json
{
  "backlog_id": "ECSI-GA-25-112",
  "expert_description": "After thorough analysis of the policy documents, I have identified several gaps in coverage. The policy lacks comprehensive coverage for natural disasters and requires additional riders for complete protection. Recommendations include adding flood insurance and increasing liability limits.",
  "created_by": "12345",
  "updated_by": "12345",
  "user_id": "12345"
}
```

## Response Format

### Success Response (200 OK)

#### Array Response Format:
```json
[
  {
    "status": "success",
    "message": "Summary added successfully",
    "data": {
      "backlog_id": "12345",
      "expert_description": "After thorough analysis...",
      "updated_by": "John Doe",
      "user_id": 101,
      "updated_time": "2024-12-17T10:30:00Z"
    }
  }
]
```

#### Direct Object Response Format:
```json
{
  "status": "success",
  "message": "Summary added successfully",
  "data": {
    "backlog_id": "12345",
    "expert_description": "After thorough analysis...",
    "updated_by": "John Doe",
    "user_id": 101,
    "updated_time": "2024-12-17T10:30:00Z"
  }
}
```

### Error Response (400/500)

#### Array Error Response Format:
```json
[
  {
    "status": "error",
    "message": "Failed to add summary: Invalid backlog_id",
    "error": "Invalid backlog_id"
  }
]
```

#### Direct Object Error Response Format:
```json
{
  "status": "error",
  "message": "Failed to add summary: Invalid backlog_id",
  "error": "Invalid backlog_id"
}
```

#### HTTP Error Response (Non-200 Status):
```json
{
  "message": "Failed to add summary (Status: 400)",
  "error": "Bad Request"
}
```

## Response Fields

### Success Response Fields:

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Response status: `"success"` or `"error"` |
| `message` | string | Human-readable success message |
| `data` | object | Contains the updated backlog information |
| `data.backlog_id` | string \| number | The backlog ID that was updated |
| `data.expert_description` | string | The expert summary that was added |
| `data.updated_by` | string | Name of the user who updated |
| `data.user_id` | string | ID of the user who updated (format: `user_{email_with_underscores}_{timestamp}`) |
| `data.updated_time` | string (ISO 8601) | Timestamp of the update |

### Error Response Fields:

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Response status: `"error"` or `"failure"` |
| `message` | string | Human-readable error message |
| `error` | string | Detailed error information |

## Frontend Implementation

### Function: `handleAddSummary()`

**Location**: `src/pages/AdminBacklogDetail.tsx`

**Flow**:
1. Validates that `expertSummary` is not empty
2. Retrieves session data from `localStorage.getItem('expertclaims_session')`
3. Retrieves `userid` from `localStorage.getItem('expertclaims_user_details')`:
   - Parses JSON data (handles both array `[{...}]` and object `{...}` formats)
   - Extracts `userid` from: `userDetails.userid` → `userDetails.user_id` → `userDetails.employee_id` → `userDetails.id`
   - Falls back to empty string if not found
4. Uses the same `userid` value for `created_by`, `updated_by`, and `user_id` fields
5. Makes POST request to `/admin/addsummary` with all required headers
6. Handles both array and object response formats
7. Shows success/error toast notifications
8. Refreshes backlog detail on success

### Example cURL Request

```bash
curl -X POST 'http://localhost:3000/admin/addsummary' \
  -H 'Accept-Language: en-US,en;q=0.9' \
  -H 'Connection: keep-alive' \
  -H 'Origin: http://localhost:8080' \
  -H 'Referer: http://localhost:8080/' \
  -H 'accept: application/json' \
  -H 'content-type: application/json' \
  -H 'jwt_token: token_1765970479448_u51u1wkuu' \
  -H 'session_id: sess_1765970479448_72h1ceejv' \
  --data-raw '{
    "backlog_id": "ECSI-GA-25-112",
    "expert_description": "After thorough analysis of the policy documents, I have identified several gaps in coverage.",
    "created_by": "12345",
    "updated_by": "12345",
    "user_id": "12345"
  }'
```

## Validation Rules

### Frontend Validation:
- `expert_description` must not be empty (trimmed)
- `backlog_id` must exist (from `backlogDetail?.backlog_id`)

### Expected Backend Validation:
- `backlog_id` must be a valid backlog ID
- `expert_description` should not be empty
- `user_id`, `created_by`, and `updated_by` should be valid user IDs from `expertclaims_user_details.userid`
- Session must be valid (via `session_id` and `jwt_token`)

## Error Scenarios

1. **Missing Expert Summary**:
   - Frontend validation prevents submission
   - Error: "Expert Summary Required"

2. **Invalid Backlog ID**:
   - Backend returns error
   - Response: `{ "status": "error", "message": "Invalid backlog_id" }`

3. **Invalid Session**:
   - Backend returns 401/403
   - Response: `{ "message": "Unauthorized" }`

4. **Server Error**:
   - Backend returns 500
   - Response: `{ "message": "Internal server error" }`

## Success Flow

1. User enters expert summary in the textarea
2. User clicks "Add Summary" button
3. Frontend validates input
4. API call is made with payload
5. Backend processes and saves summary
6. Success response is received
7. Toast notification shows success message
8. Backlog detail is refreshed to show updated data

## Notes

- The API endpoint expects a POST request
- The response can be either an array `[{...}]` or an object `{...}`
- The frontend handles both response formats
- On success, the backlog detail is automatically refreshed
- The summary is stored as `expert_description` in the backend