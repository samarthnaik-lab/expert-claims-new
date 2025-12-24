# Environment Variables Setup

This project uses environment variables to configure the API base URL. This allows you to easily switch between development and production environments.

## Setup Instructions

### 1. Create `.env` file

Create a `.env` file in the root directory (`Frontend/expert-claims-new/.env`) with the following content:

```env
# API Configuration
# Backend API Base URL
# For local development, use: http://localhost:3000
# For production, update this to your deployed backend URL
VITE_API_BASE_URL=http://localhost:3000
```

### 2. Update for Production

When deploying to production, update the `.env` file with your production backend URL:

```env
VITE_API_BASE_URL=https://your-production-backend-url.com
```

### 3. Environment Variable Naming

**Important:** In Vite, environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

- ✅ Correct: `VITE_API_BASE_URL`
- ❌ Wrong: `API_BASE_URL` (won't be accessible in the browser)

### 4. Usage in Code

The API base URL is centralized in `src/config/api.ts`. All API calls should use:

```typescript
import { buildApiUrl } from '@/config/api';

// Build full API URL
const url = buildApiUrl('api/endpoint');
// Result: http://localhost:3000/api/endpoint

// Or use directly
import { API_BASE_URL } from '@/config/api';
const url = `${API_BASE_URL}/api/endpoint`;
```

### 5. Files Already Updated

The following files have been updated to use the centralized API configuration:

**Service Files:**
- `src/services/taskService.ts`
- `src/services/referralService.ts`
- `src/services/partnerStatusService.ts`
- `src/services/authService.ts`
- `src/services/caseService.ts`
- `src/services/employeeService.ts`
- `src/services/customerService.ts`
- `src/services/documentService.ts`
- `src/services/caseTypeService.ts`
- `src/services/claimService.ts`

**Page Files:**
- `src/pages/PartnerDashboard.tsx`
- `src/pages/Login.tsx`

### 6. Files Updated

All page files have been updated to use the centralized API configuration:

- ✅ `src/pages/AdminDashboard.tsx`
- ✅ `src/pages/AdminBacklogView.tsx`
- ✅ `src/pages/AdminBacklogDetail.tsx`
- ✅ `src/pages/EmployeeDashboard.tsx`
- ✅ `src/pages/EmployeeBacklogView.tsx`
- ✅ `src/pages/EmployeeBacklogDetail.tsx`
- ✅ `src/pages/EmployeeBacklogEdit.tsx`
- ✅ `src/pages/PartnerBacklogDetail.tsx`
- ✅ `src/pages/PartnerBacklogEdit.tsx`
- ✅ `src/pages/PartnerNewTask.tsx`
- ✅ `src/pages/PartnerSignup.tsx`
- ✅ `src/pages/CustomerClaimDetail.tsx`
- ✅ `src/pages/CustomerDocumentUpload.tsx`
- ✅ `src/pages/CustomerPortal.tsx`
- ✅ `src/pages/EditTask.tsx`
- ✅ `src/pages/EditRegister.tsx`
- ✅ `src/pages/NewTask.tsx`
- ✅ `src/pages/Register.tsx`
- ✅ `src/pages/TaskDetail.tsx`
- ✅ `src/pages/LeaveManagement.tsx`
- ✅ `src/pages/PartnerDashboard.tsx`
- ✅ `src/pages/Login.tsx`

### 7. How to Update Remaining Files

For each file, follow these steps:

1. Add import at the top:
   ```typescript
   import { buildApiUrl } from '@/config/api';
   ```

2. Replace hardcoded URLs:
   ```typescript
   // Before
   const url = 'http://localhost:3000/api/endpoint';
   
   // After
   const url = buildApiUrl('api/endpoint');
   ```

3. For URLs with query parameters:
   ```typescript
   // Before
   const url = `http://localhost:3000/api/endpoint?id=${id}`;
   
   // After
   const url = `${buildApiUrl('api/endpoint')}?id=${id}`;
   ```

### 8. Testing

After updating the `.env` file:

1. Restart your development server (Vite needs to be restarted to pick up new environment variables)
2. Verify API calls are using the correct base URL by checking browser network requests

### 9. Git Ignore

The `.env` file is already in `.gitignore` to prevent committing sensitive configuration. Always use `.env.example` as a template for documentation.

