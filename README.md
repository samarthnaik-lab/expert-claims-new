# ExpertClaims CRM - Frontend Application

A comprehensive Customer Relationship Management (CRM) system for ExpertClaims, an insurance claim recovery service. This application manages claims, tasks, users, invoices, and provides role-based dashboards for admins, employees, partners, and customers.

## 🚀 Features

### User Roles & Dashboards
- **Admin Dashboard**: Complete system management, user management, task assignment, analytics, and reporting
- **Employee Dashboard**: Task management, backlog tracking, personal information, leave management
- **Partner Dashboard**: Claim management, task tracking, partner-specific workflows
- **Customer Portal**: Claim tracking, document upload, FAQ, claim details

### Core Functionality
- ✅ User Authentication & Authorization (JWT-based)
- ✅ Role-based Access Control (Admin, Employee, Partner, Customer)
- ✅ Task & Case Management
- ✅ Claim Processing & Tracking
- ✅ Document Management & Upload
- ✅ Invoice Generation & Preview
- ✅ Leave Management System
- ✅ User Management (Create, Read, Update, Delete)
- ✅ Advanced Search & Filtering
- ✅ Pagination & Data Tables
- ✅ Real-time Notifications & Toasts

## 🛠️ Tech Stack

- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.1
- **Routing**: React Router DOM 6.26.2
- **UI Components**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS 3.4.11
- **State Management**: React Query (TanStack Query) 5.56.2
- **Forms**: React Hook Form 7.53.0 + Zod 3.23.8
- **Backend Integration**: Supabase 2.50.0
- **Charts**: Recharts 2.12.7
- **PDF Generation**: jsPDF 3.0.3
- **Date Handling**: date-fns 3.6.0

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) or **yarn** or **pnpm**
- **Git** - [Download](https://git-scm.com/)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expert-claims-new
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

   The application will be available at `http://localhost:8080` (or the port shown in terminal)

## 📁 Project Structure

```
expert-claims-new/
├── public/                 # Static assets
│   ├── favicon.ico
│   └── leaders/           # Image assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleTest.tsx
│   ├── contexts/         # React contexts (Auth)
│   ├── hooks/            # Custom React hooks
│   ├── integrations/    # External service integrations
│   │   └── supabase/    # Supabase client & types
│   ├── lib/             # Utility functions
│   ├── pages/           # Page components
│   │   ├── AdminDashboard.tsx
│   │   ├── EmployeeDashboard.tsx
│   │   ├── PartnerDashboard.tsx
│   │   ├── CustomerPortal.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ...
│   ├── services/        # API service layers
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── caseService.ts
│   │   └── ...
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

## 🚦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔌 API Integration

The application integrates with a Node.js backend API running on `http://localhost:3000`. Key API endpoints:

### User Management
- `GET /admin/getusers` - Get users list (with pagination)
- `POST /admin/createuser` - Create new user
- `PATCH /admin/updateuser` - Update user
- `DELETE /admin/deleteuser` - Delete user
- `GET /support/getuserdetails` - Get user details

### Dashboard
- `GET /webhook/admindashboard` - Admin dashboard data

### Authentication
- Uses JWT tokens and Session IDs stored in localStorage
- Headers: `jwt_token`, `session_id`, `apikey`, `authorization`

## 🔐 Authentication & Authorization

The application uses:
- **JWT Tokens** for API authentication
- **Session IDs** for session management
- **Role-based Access Control** (RBAC) with protected routes
- **LocalStorage** for token persistence

### User Roles
- `admin` - Full system access
- `employee` / `hr` - Employee dashboard access
- `partner` - Partner dashboard access
- `customer` - Customer portal access

## 🎨 UI Components

Built with [shadcn/ui](https://ui.shadcn.com/) components:
- Buttons, Cards, Tables
- Forms, Inputs, Selects
- Dialogs, Modals, Toasts
- Charts, Calendars
- Navigation components

## 📝 Development Guidelines

1. **Code Style**: Follow TypeScript and React best practices
2. **Component Structure**: Use functional components with hooks
3. **State Management**: Use React Query for server state, useState for local state
4. **Styling**: Use Tailwind CSS utility classes
5. **Type Safety**: Maintain TypeScript types for all data structures
6. **Error Handling**: Implement proper error boundaries and toast notifications

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in `vite.config.ts` or kill the process using the port

2. **Module not found errors**
   - Delete `node_modules` and `package-lock.json`, then run `npm install`

3. **API connection errors**
   - Ensure backend server is running on `http://localhost:3000`
   - Check CORS settings on backend
   - Verify environment variables

4. **Authentication issues**
   - Clear localStorage and login again
   - Check JWT token expiration

## 📦 Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## 🚀 Deployment

The application can be deployed to:
- **Vercel** (recommended)
- **Netlify**
- **AWS S3 + CloudFront**
- Any static hosting service

Ensure environment variables are set in your deployment platform.

## 📄 License

[Add your license information here]

## 👥 Contributors

[Add contributor information here]

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

---

**Note**: This is the frontend application. Ensure the backend API server is running separately for full functionality.
