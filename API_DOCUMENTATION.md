# ExpertClaims CRM API Documentation

## Base URL
```
https://api.expertclaims.com/v1
```

## Authentication
All API requests require authentication using JWT tokens and Session IDs.

### Headers Required
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

---

## User Management APIs

### 1. Get User Roles
**Endpoint:** `GET https://n8n.srv952553.hstgr.cloud/webhook/58e6269b-6e6d-4236-a441-ff41824771be`

**Description:** Fetch all available user roles for the system via n8n webhook.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Expected Response Structure:**
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

**Alternative Response Formats (Supported):**
```json
// Direct array format
[
  {
    "id": "role_001",
    "name": "employee",
    "display_name": "Employee"
  }
]

// With roles property
{
  "roles": [
    {
      "id": "role_001",
      "name": "employee",
      "display_name": "Employee"
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "error_code": "AUTH_001"
}
```

**Fallback Behavior:**
- If the n8n webhook fails or returns an unexpected format, the system will automatically fall back to mock data
- This ensures the application continues to function even if the webhook is temporarily unavailable

---

### 2. Create New User
**Endpoint:** `POST /api/users`

**Description:** Create a new user account with role-based information.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "mobile": "+1234567890",
  "gender": "male",
  "age": 30,
  "role": "employee",
  "address": "123 Main Street, City, State 12345",
  "emergency_contact": "+1987654321",
  
  // Employee-specific fields (only if role is "employee")
  "employment_status": "full-time",
  "joining_date": "2024-01-15",
  "designation": "Senior Developer",
  "department": "Engineering",
  "manager_name": "Jane Smith",
  "work_phonenumber": "+1234567891",
  "pan_number": "ABCDE1234F",
  "aadhar_number": "123456789012",
  
  // Customer-specific fields (only if role is "customer")
  "customer_type": "individual",
  "company_name": "ABC Corp", // Only if customer_type is "corporate"
  "source": "website",
  "communication_preferences": "email",
  "language_preference": "english",
  "notes": "Premium customer"
}
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_001",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "role": "employee",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "profile": {
      "mobile": "+1234567890",
      "gender": "male",
      "age": 30,
      "address": "123 Main Street, City, State 12345",
      "emergency_contact": "+1987654321"
    },
    "employee_info": {
      "employment_status": "full-time",
      "joining_date": "2024-01-15",
      "designation": "Senior Developer",
      "department": "Engineering",
      "manager_name": "Jane Smith",
      "work_phonenumber": "+1234567891",
      "pan_number": "ABCDE1234F",
      "aadhar_number": "123456789012"
    }
  },
  "message": "User created successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Email already exists",
  "error_code": "USER_001",
  "field_errors": {
    "email": "Email address is already registered"
  }
}
```

---

### 3. Get User Profile
**Endpoint:** `GET /api/users/{user_id}`

**Description:** Fetch user profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_001",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "role": "employee",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "profile": {
      "mobile": "+1234567890",
      "gender": "male",
      "age": 30,
      "address": "123 Main Street, City, State 12345",
      "emergency_contact": "+1987654321"
    },
    "employee_info": {
      "employment_status": "full-time",
      "joining_date": "2024-01-15",
      "designation": "Senior Developer",
      "department": "Engineering",
      "manager_name": "Jane Smith",
      "work_phonenumber": "+1234567891",
      "pan_number": "ABCDE1234F",
      "aadhar_number": "123456789012"
    }
  },
  "message": "User profile retrieved successfully"
}
```

---

### 4. Update User Profile
**Endpoint:** `PUT /api/users/{user_id}`

**Description:** Update user profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Request Body:** (Same structure as Create User, but all fields are optional)

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_001",
    "updated_at": "2024-01-15T11:30:00Z"
  },
  "message": "User profile updated successfully"
}
```

---

### 5. Delete User
**Endpoint:** `DELETE /api/users/{user_id}`

**Description:** Delete a user account.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Response Structure:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Task Management APIs

### 1. Get All Tasks
**Endpoint:** `GET /api/tasks`

**Description:** Fetch all tasks with optional filtering.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Query Parameters:**
- `status`: Filter by task status (open, in_progress, completed, cancelled)
- `priority`: Filter by priority (low, medium, high, urgent)
- `assigned_to`: Filter by assigned user ID
- `category_id`: Filter by category ID

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_001",
      "title": "Insurance Claim Review",
      "task_summary": "Review and process insurance claim documents",
      "description": "Detailed description of the task requirements",
      "priority": "high",
      "status": "in_progress",
      "assigned_to": "user_001",
      "category_id": "cat_001",
      "customer_id": "customer_001",
      "reviewer_id": "user_002",
      "approver_id": "user_003",
      "estimated_duration": 8,
      "total_hours_spent": 6,
      "progress_percentage": 75,
      "due_date": "2024-01-20T00:00:00Z",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "case_type": "health_insurance",
      "selected_documents": ["medical_bills", "prescription"],
      "customer_satisfaction_rating": 4,
      "resolution_summary": "Claim processed successfully"
    }
  ],
  "message": "Tasks retrieved successfully"
}
```

---

### 2. Get Single Task
**Endpoint:** `GET /api/tasks/{task_id}`

**Description:** Fetch detailed information about a specific task.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "id": "task_001",
    "title": "Insurance Claim Review",
    "task_summary": "Review and process insurance claim documents",
    "description": "Detailed description of the task requirements",
    "priority": "high",
    "status": "in_progress",
    "assigned_to": "user_001",
    "category_id": "cat_001",
    "customer_id": "customer_001",
    "reviewer_id": "user_002",
    "approver_id": "user_003",
    "estimated_duration": 8,
    "total_hours_spent": 6,
    "progress_percentage": 75,
    "due_date": "2024-01-20T00:00:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "case_type": "health_insurance",
    "selected_documents": ["medical_bills", "prescription"],
    "customer_satisfaction_rating": 4,
    "resolution_summary": "Claim processed successfully",
    "comments": [
      {
        "id": "comment_001",
        "text": "Initial review completed",
        "hours_spent": 2,
        "created_by": "user_001",
        "created_at": "2024-01-15T11:00:00Z"
      }
    ],
    "stakeholders": [
      {
        "id": "stakeholder_001",
        "name": "John Doe",
        "role": "Claimant",
        "contact_email": "john.doe@example.com",
        "notes": "Primary contact for this claim"
      }
    ]
  },
  "message": "Task retrieved successfully"
}
```

---

### 3. Create New Task
**Endpoint:** `POST /api/tasks`

**Description:** Create a new task with all required information.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Insurance Claim Review",
  "task_summary": "Review and process insurance claim documents",
  "description": "Detailed description of the task requirements",
  "priority": "high",
  "status": "open",
  "assigned_to": "user_001",
  "category_id": "cat_001",
  "customer_id": "customer_001",
  "reviewer_id": "user_002",
  "approver_id": "user_003",
  "estimated_duration": 8,
  "due_date": "2024-01-20T00:00:00Z",
  "case_type": "health_insurance",
  "selected_documents": ["medical_bills", "prescription"],
  "customer_satisfaction_rating": null,
  "stakeholders": [
    {
      "name": "John Doe",
      "role": "Claimant",
      "contact_email": "john.doe@example.com",
      "notes": "Primary contact for this claim"
    }
  ]
}
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "id": "task_001",
    "title": "Insurance Claim Review",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Task created successfully"
}
```

---

### 4. Update Task
**Endpoint:** `PUT /api/tasks/{task_id}`

**Description:** Update an existing task.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Request Body:** (Same structure as Create Task, but all fields are optional)

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "id": "task_001",
    "updated_at": "2024-01-15T11:30:00Z"
  },
  "message": "Task updated successfully"
}
```

---

### 5. Delete Task
**Endpoint:** `DELETE /api/tasks/{task_id}`

**Description:** Delete a task.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Response Structure:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## Task Comments APIs

### 1. Get Task Comments
**Endpoint:** `GET /api/tasks/{task_id}/comments`

**Description:** Fetch all comments for a specific task.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comment_001",
      "task_id": "task_001",
      "text": "Initial review completed",
      "hours_spent": 2,
      "created_by": "user_001",
      "created_at": "2024-01-15T11:00:00Z"
    }
  ],
  "message": "Comments retrieved successfully"
}
```

---

### 2. Add Task Comment
**Endpoint:** `POST /api/tasks/{task_id}/comments`

**Description:** Add a new comment to a task.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Document review completed",
  "hours_spent": 3
}
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "id": "comment_002",
    "task_id": "task_001",
    "text": "Document review completed",
    "hours_spent": 3,
    "created_by": "user_001",
    "created_at": "2024-01-15T12:00:00Z"
  },
  "message": "Comment added successfully"
}
```

---

## Task Stakeholders APIs

### 1. Get Task Stakeholders
**Endpoint:** `GET /api/tasks/{task_id}/stakeholders`

**Description:** Fetch all stakeholders for a specific task.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "id": "stakeholder_001",
      "task_id": "task_001",
      "name": "John Doe",
      "role": "Claimant",
      "contact_email": "john.doe@example.com",
      "notes": "Primary contact for this claim"
    }
  ],
  "message": "Stakeholders retrieved successfully"
}
```

---

### 2. Add Task Stakeholder
**Endpoint:** `POST /api/tasks/{task_id}/stakeholders`

**Description:** Add a new stakeholder to a task.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "role": "Insurance Agent",
  "contact_email": "jane.smith@insurance.com",
  "notes": "Handling the claim process"
}
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "id": "stakeholder_002",
    "task_id": "task_001",
    "name": "Jane Smith",
    "role": "Insurance Agent",
    "contact_email": "jane.smith@insurance.com",
    "notes": "Handling the claim process"
  },
  "message": "Stakeholder added successfully"
}
```

---

### 3. Delete Task Stakeholder
**Endpoint:** `DELETE /api/tasks/{task_id}/stakeholders/{stakeholder_id}`

**Description:** Remove a stakeholder from a task.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Response Structure:**
```json
{
  "success": true,
  "message": "Stakeholder removed successfully"
}
```

---

## Category Management APIs

### 1. Get Categories
**Endpoint:** `GET /api/categories`

**Description:** Fetch all available categories.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_001",
      "name": "Health Insurance",
      "description": "Health insurance related claims",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Categories retrieved successfully"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Unauthorized access |
| AUTH_002 | Invalid session |
| AUTH_003 | Token expired |
| USER_001 | Email already exists |
| USER_002 | Username already exists |
| USER_003 | Invalid role |
| USER_004 | User not found |
| TASK_001 | Task not found |
| TASK_002 | Invalid task status |
| TASK_003 | Invalid task priority |
| VALIDATION_001 | Required field missing |
| VALIDATION_002 | Invalid email format |
| VALIDATION_003 | Password too weak |
| SERVER_001 | Internal server error |

---

## Data Validation Rules

### User Registration
- **email**: Required, valid email format, unique
- **password**: Required, minimum 8 characters, must contain uppercase, lowercase, number, and special character
- **first_name**: Required, 2-50 characters
- **last_name**: Required, 2-50 characters
- **username**: Required, 3-20 characters, alphanumeric and underscore only, unique
- **role**: Required, must be a valid role from the roles API
- **mobile**: Optional, valid phone number format
- **age**: Optional, 18-100 years
- **gender**: Optional, one of: "male", "female", "other"

### Employee Fields (when role = "employee")
- **employment_status**: Required, one of: "full-time", "part-time", "contract", "intern"
- **joining_date**: Required, valid date format (YYYY-MM-DD)
- **designation**: Required, 2-100 characters
- **department**: Required, 2-50 characters
- **manager_name**: Optional, 2-100 characters
- **work_phonenumber**: Optional, valid phone number format
- **pan_number**: Required, valid PAN format (ABCDE1234F)
- **aadhar_number**: Required, valid Aadhar format (12 digits)

### Customer Fields (when role = "customer")
- **customer_type**: Required, one of: "individual", "corporate"
- **company_name**: Required if customer_type = "corporate", 2-100 characters
- **source**: Optional, 2-50 characters
- **communication_preferences**: Optional, one of: "email", "sms", "phone"
- **language_preference**: Optional, one of: "english", "hindi", "spanish", "french"
- **notes**: Optional, maximum 500 characters

### Task Fields
- **title**: Required, 3-200 characters
- **task_summary**: Required, 10-500 characters
- **description**: Optional, maximum 2000 characters
- **priority**: Required, one of: "low", "medium", "high", "urgent"
- **status**: Required, one of: "open", "in_progress", "completed", "cancelled"
- **assigned_to**: Required, valid user ID
- **category_id**: Required, valid category ID
- **customer_id**: Required, valid customer ID
- **estimated_duration**: Optional, positive integer (hours)
- **total_hours_spent**: Optional, positive integer (hours)
- **progress_percentage**: Optional, 0-100 integer
- **due_date**: Required, valid date format
- **case_type**: Optional, string
- **selected_documents**: Optional, array of strings
- **customer_satisfaction_rating**: Optional, 1-5 integer (only when status is completed/cancelled)
- **resolution_summary**: Optional, string (only when status is completed/cancelled)

---

## n8n Webhook Integration

### Role Fetching via n8n
The application uses an n8n webhook to fetch user roles dynamically. This provides several benefits:

1. **Centralized Role Management**: Roles can be managed through n8n workflows
2. **Dynamic Updates**: Role changes can be reflected immediately without code deployment
3. **Integration Flexibility**: n8n can connect to various data sources (databases, APIs, etc.)
4. **Fallback Support**: The application gracefully falls back to mock data if the webhook is unavailable

### Webhook Configuration
- **URL**: `https://n8n.srv952553.hstgr.cloud/webhook/58e6269b-6e6d-4236-a441-ff41824771be`
- **Method**: GET
- **Authentication**: JWT token and session ID headers are forwarded
- **Response Format**: Flexible - supports multiple response structures

### Expected n8n Workflow Response
The n8n workflow should return role data in one of these formats:

1. **Standard Format** (Recommended):
```json
{
  "success": true,
  "data": [
    {
      "id": "role_001",
      "name": "employee",
      "display_name": "Employee",
      "description": "Regular employee",
      "permissions": ["view_tasks", "create_tasks"],
      "is_active": true
    }
  ]
}
```

2. **Simple Array Format**:
```json
[
  {
    "id": "role_001",
    "name": "employee",
    "display_name": "Employee"
  }
]
```

3. **With Roles Property**:
```json
{
  "roles": [
    {
      "id": "role_001",
      "name": "employee",
      "display_name": "Employee"
    }
  ]
}
```

---

## Authentication Flow

### 1. Login
**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and receive session tokens.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "sess_001",
      "jwtToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "userId": "user_001",
      "userRole": "employee",
      "expiresAt": 1705312200000
    }
  },
  "message": "Login successful"
}
```

### 2. Refresh Session
**Endpoint:** `POST /api/auth/refresh`

**Description:** Refresh the current session token.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "sess_002",
      "jwtToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "userId": "user_001",
      "userRole": "employee",
      "expiresAt": 1705315800000
    }
  },
  "message": "Session refreshed successfully"
}
```

### 3. Logout
**Endpoint:** `POST /api/auth/logout`

**Description:** Invalidate the current session.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json
```

**Response Structure:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## File Upload APIs

### Upload Task Documents
**Endpoint:** `POST /api/tasks/{task_id}/documents`

**Description:** Upload documents for a specific task.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: multipart/form-data
```

**Request Body:**
```
Form data with files and metadata:
- files: Array of files
- document_type: String (e.g., "medical_bills", "prescription")
- description: Optional string
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "uploaded_files": [
      {
        "id": "doc_001",
        "filename": "medical_bill.pdf",
        "document_type": "medical_bills",
        "file_size": 1024000,
        "uploaded_at": "2024-01-15T10:30:00Z",
        "url": "https://storage.example.com/documents/medical_bill.pdf"
      }
    ]
  },
  "message": "Documents uploaded successfully"
}
```

---

## Testing and Development

### Test Webhook Integration
**URL:** `/test-roles`

**Description:** Test the n8n webhook integration for fetching roles.

**Features:**
- Test webhook connectivity
- View response data and status
- Debug response formats
- Verify fallback behavior

### Mock API Service
For development and testing purposes, the application includes a mock API service that:
- Simulates network delays
- Provides realistic response structures
- Includes error simulation for testing
- Serves as fallback when real APIs are unavailable

---

## Rate Limiting

All API endpoints are subject to rate limiting:
- **Standard Users**: 100 requests per minute
- **Admin Users**: 500 requests per minute
- **API Keys**: 1000 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312200
```

---

## Versioning

API versioning is handled through the URL path:
- Current version: `/api/v1/`
- Future versions: `/api/v2/`, `/api/v3/`, etc.

Version deprecation will be communicated through:
- HTTP headers: `X-API-Version-Deprecated: true`
- Response warnings in the message field
- Documentation updates

---

## Support and Documentation

For additional support:
- **API Status**: https://status.expertclaims.com
- **Documentation**: https://docs.expertclaims.com
- **Support Email**: api-support@expertclaims.com
- **Developer Portal**: https://developers.expertclaims.com
