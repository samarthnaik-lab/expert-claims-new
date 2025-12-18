# Create New User n8n Webhook Integration Guide

## Webhook Configuration

### Webhook URL
```
https://n8n.srv952553.hstgr.cloud/webhook-test/4657ce99-4b27-4b37-a7b7-d8c8fc487294
```

### HTTP Method
```
POST
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

### Request Body Structure
The complete user data from the form will be sent in the request body:

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
  
  "employment_status": "full-time",
  "joining_date": "2024-01-15",
  "designation": "Senior Developer",
  "department": "Engineering",
  "manager_name": "Jane Smith",
  "work_phonenumber": "+1234567891",
  "pan_number": "ABCDE1234F",
  "aadhar_number": "123456789012",
  
  "customer_type": "individual",
  "company_name": "ABC Corp",
  "source": "website",
  "communication_preferences": "email",
  "language_preference": "english",
  "notes": "Premium customer"
}
```

### Field Descriptions

#### Basic User Information (Always Required)
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| email | string | Yes | User's email address | "john.doe@example.com" |
| password | string | Yes | User's password | "SecurePassword123!" |
| first_name | string | Yes | User's first name | "John" |
| last_name | string | Yes | User's last name | "Doe" |
| username | string | Yes | Unique username | "johndoe" |
| role | string | Yes | User role | "employee", "admin", "partner", "customer" |

#### Personal Information (Optional)
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| mobile | string | No | Mobile phone number | "+1234567890" |
| gender | string | No | Gender | "male", "female", "other" |
| age | number | No | Age in years | 30 |
| address | string | No | Full address | "123 Main Street, City, State 12345" |
| emergency_contact | string | No | Emergency contact number | "+1987654321" |

#### Employee-Specific Fields (Required if role = "employee")
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| employment_status | string | Yes* | Employment type | "full-time", "part-time", "contract", "intern" |
| joining_date | string | Yes* | Date of joining | "2024-01-15" |
| designation | string | Yes* | Job title | "Senior Developer" |
| department | string | Yes* | Department name | "Engineering" |
| manager_name | string | No | Manager's name | "Jane Smith" |
| work_phonenumber | string | No | Work phone number | "+1234567891" |
| pan_number | string | Yes* | PAN card number | "ABCDE1234F" |
| aadhar_number | string | Yes* | Aadhar card number | "123456789012" |

#### Customer-Specific Fields (Required if role = "customer")
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| customer_type | string | Yes* | Customer type | "individual", "corporate" |
| company_name | string | Yes* | Company name (if corporate) | "ABC Corp" |
| source | string | No | Lead source | "website", "referral", "advertisement" |
| communication_preferences | string | No | Preferred communication | "email", "sms", "phone" |
| language_preference | string | No | Preferred language | "english", "hindi", "spanish", "french" |
| notes | string | No | Additional notes | "Premium customer" |

*Required only if the user role is "employee" or "customer" respectively.

---

## Expected Response from n8n Webhook

### Success Response Format (Recommended)
When user creation is successful, return this format:

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

### Alternative Success Response Format
If you prefer a simpler success response:

```json
{
  "success": true,
  "data": {
    "user_id": "user_001",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "role": "employee",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "User created successfully"
}
```

### Error Response Format
When user creation fails, return this format:

```json
{
  "success": false,
  "message": "Email already exists",
  "error_code": "USER_001",
  "field_errors": {
    "email": "Email address is already registered",
    "username": "Username is already taken"
  }
}
```

### Alternative Error Response Format
For simpler error responses:

```json
{
  "success": false,
  "message": "Failed to create user",
  "error_code": "USER_001"
}
```

---

## Response Object Structure

### Success Response Fields

#### Required Fields
- **success**: boolean (true for success)
- **data**: object containing user information
- **message**: string (success message)

#### Data Object Fields
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| user_id | string | Yes | Unique user identifier | "user_001" |
| email | string | Yes | User's email | "john.doe@example.com" |
| first_name | string | Yes | User's first name | "John" |
| last_name | string | Yes | User's last name | "Doe" |
| username | string | Yes | Username | "johndoe" |
| role | string | Yes | User role | "employee" |
| status | string | Yes | User status | "active" |
| created_at | string | Yes | ISO timestamp | "2024-01-15T10:30:00Z" |

#### Optional Data Fields
- **profile**: object (personal information)
- **employee_info**: object (employee-specific data)
- **customer_info**: object (customer-specific data)
- **updated_at**: string (ISO timestamp)

### Error Response Fields

#### Required Fields
- **success**: boolean (false for errors)
- **message**: string (error description)
- **error_code**: string (unique error code)

#### Optional Fields
- **field_errors**: object (field-specific validation errors)

---

## HTTP Response Headers

Your n8n webhook should return these headers:

```
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-ID
```

---

## HTTP Status Codes

### Success Responses
- **200 OK**: User created successfully
- **201 Created**: User created successfully (alternative)

### Error Responses
- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Access denied
- **409 Conflict**: User already exists
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server error

---

## Error Codes Reference

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| USER_001 | Email already exists | 409 |
| USER_002 | Username already exists | 409 |
| USER_003 | Invalid role | 400 |
| USER_004 | Required fields missing | 400 |
| VALIDATION_001 | Required field missing | 422 |
| VALIDATION_002 | Invalid email format | 422 |
| VALIDATION_003 | Password too weak | 422 |
| VALIDATION_004 | Invalid phone number format | 422 |
| VALIDATION_005 | Invalid PAN number format | 422 |
| VALIDATION_006 | Invalid Aadhar number format | 422 |
| AUTH_001 | Unauthorized access | 401 |
| AUTH_002 | Invalid session | 401 |
| AUTH_003 | Token expired | 401 |
| SERVER_001 | Internal server error | 500 |

---

## Data Validation Rules

### Email Validation
- Required field
- Must be valid email format
- Must be unique in the system

### Password Validation
- Required field
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character

### Name Validation
- **first_name**: Required, 2-50 characters
- **last_name**: Required, 2-50 characters
- **username**: Required, 3-20 characters, alphanumeric and underscore only, unique

### Phone Number Validation
- **mobile**: Optional, valid phone number format
- **work_phonenumber**: Optional, valid phone number format
- **emergency_contact**: Optional, valid phone number format

### Employee-Specific Validation
- **employment_status**: Required if role = "employee", one of: "full-time", "part-time", "contract", "intern"
- **joining_date**: Required if role = "employee", valid date format (YYYY-MM-DD)
- **designation**: Required if role = "employee", 2-100 characters
- **department**: Required if role = "employee", 2-50 characters
- **pan_number**: Required if role = "employee", valid PAN format (ABCDE1234F)
- **aadhar_number**: Required if role = "employee", valid Aadhar format (12 digits)

### Customer-Specific Validation
- **customer_type**: Required if role = "customer", one of: "individual", "corporate"
- **company_name**: Required if customer_type = "corporate", 2-100 characters

---

## n8n Workflow Setup

### 1. Webhook Trigger Node
- **Node Type**: Webhook
- **HTTP Method**: POST
- **Path**: `/4657ce99-4b27-4b37-a7b7-d8c8fc487294`
- **Response Mode**: Respond to Webhook

### 2. Authentication Node
- Validate JWT token and session ID
- Extract user information from token

### 3. Data Validation Node
- Validate all required fields
- Check data formats and constraints
- Return field-specific errors if validation fails

### 4. Database Operation Node
- Check for existing users (email, username)
- Insert new user record
- Handle database errors

### 5. Response Node
- Return success or error response
- Include proper HTTP status codes

### Example n8n Workflow Structure
```
Webhook Trigger → Auth Validation → Data Validation → Database Check → User Creation → Response
```

---

## Testing the Webhook

### Test URL
You can test your webhook using:
```
https://n8n.srv952553.hstgr.cloud/webhook-test/4657ce99-4b27-4b37-a7b7-d8c8fc487294
```

### cURL Test Command
```bash
curl -X POST \
  https://n8n.srv952553.hstgr.cloud/webhook-test/4657ce99-4b27-4b37-a7b7-d8c8fc487294 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_jwt_token" \
  -H "X-Session-ID: test_session_id" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "first_name": "Test",
    "last_name": "User",
    "username": "testuser",
    "role": "employee",
    "employment_status": "full-time",
    "joining_date": "2024-01-15",
    "designation": "Developer",
    "department": "Engineering",
    "pan_number": "ABCDE1234F",
    "aadhar_number": "123456789012"
  }'
```

### Test Scenarios

#### 1. Successful User Creation
- Send valid user data
- Expect 200/201 status with success response

#### 2. Duplicate Email
- Send user data with existing email
- Expect 409 status with USER_001 error

#### 3. Duplicate Username
- Send user data with existing username
- Expect 409 status with USER_002 error

#### 4. Invalid Role
- Send user data with invalid role
- Expect 400 status with USER_003 error

#### 5. Missing Required Fields
- Send incomplete user data
- Expect 422 status with field-specific errors

#### 6. Authentication Error
- Send request without valid JWT token
- Expect 401 status with AUTH_001 error

---

## Frontend Integration

### Success Handling
When the webhook returns a success response:
1. Display "New user created successfully" message
2. Clear the form
3. Optionally redirect to user list or user details page
4. Update any relevant UI state

### Error Handling
When the webhook returns an error response:
1. Display the error message from the response
2. If field_errors are present, highlight specific form fields
3. Keep form data intact for user to correct
4. Show appropriate error styling

### Example Frontend Response Handling
```javascript
// Success case
if (response.success) {
  showSuccessMessage("New user created successfully");
  clearForm();
  redirectToUserList();
}

// Error case
if (!response.success) {
  showErrorMessage(response.message);
  if (response.field_errors) {
    highlightFieldErrors(response.field_errors);
  }
}
```

---

## Security Considerations

### Authentication
- Validate JWT token in the webhook
- Check session ID validity
- Verify user permissions for creating users

### Data Validation
- Validate all input fields server-side
- Sanitize user input to prevent injection attacks
- Implement rate limiting for user creation

### Password Security
- Hash passwords before storing
- Use strong password requirements
- Never return password in responses

### CORS
- Ensure proper CORS headers are set
- Allow requests only from your frontend domain

---

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure proper CORS headers are set
   - Check if the frontend domain is allowed

2. **Authentication Errors**
   - Verify JWT token format and validity
   - Check session ID validation

3. **Validation Errors**
   - Ensure all required fields are present
   - Check data format validation
   - Verify field-specific validation rules

4. **Database Errors**
   - Check database connection
   - Verify table structure and constraints
   - Handle duplicate key errors properly

### Debug Steps

1. Check n8n workflow execution logs
2. Test webhook directly with cURL
3. Verify request data format
4. Check response format matches expected structure
5. Monitor database operations
6. Check authentication validation

---

## Support

For webhook integration support:
- **n8n Documentation**: https://docs.n8n.io/
- **Frontend Integration**: Check form submission handling
- **API Documentation**: `API_DOCUMENTATION.md`
- **Error Codes**: Reference the error codes table above


