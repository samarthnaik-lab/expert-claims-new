# ExpertClaims CRM - Requirements & Dependencies

## System Requirements

### Minimum Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or yarn/pnpm equivalent)
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 500MB for dependencies + project files

### Recommended Requirements
- **Node.js**: v20.x LTS
- **npm**: v10.x
- **RAM**: 8GB or more
- **Disk Space**: 1GB+

## Runtime Dependencies

### Core Framework & Libraries
```
react: ^18.3.1                    # React UI framework
react-dom: ^18.3.1               # React DOM renderer
react-router-dom: ^6.26.2         # Client-side routing
typescript: ^5.5.3               # TypeScript compiler
```

### Build Tools
```
vite: ^5.4.1                     # Build tool and dev server
@vitejs/plugin-react-swc: ^3.5.0 # Vite React plugin
```

### UI Components & Styling
```
@radix-ui/*                      # Headless UI components (20+ packages)
tailwindcss: ^3.4.11            # Utility-first CSS framework
tailwindcss-animate: ^1.0.7     # Tailwind animations
lucide-react: ^0.462.0          # Icon library
class-variance-authority: ^0.7.1 # Component variants
clsx: ^2.1.1                     # Conditional class names
tailwind-merge: ^2.5.2           # Merge Tailwind classes
```

### State Management & Data Fetching
```
@tanstack/react-query: ^5.56.2   # Server state management
```

### Forms & Validation
```
react-hook-form: ^7.53.0         # Form state management
@hookform/resolvers: ^3.9.0      # Form validation resolvers
zod: ^3.23.8                     # Schema validation
```

### Backend Integration
```
@supabase/supabase-js: ^2.50.0   # Supabase client library
```

### Utilities & Helpers
```
date-fns: ^3.6.0                 # Date manipulation
crypto-js: ^4.2.0                # Cryptographic functions
```

### PDF & Document Processing
```
jspdf: ^3.0.3                    # PDF generation
html2canvas: ^1.4.1              # HTML to canvas conversion
mammoth: ^1.11.0                 # DOCX to HTML conversion
```

### Charts & Visualization
```
recharts: ^2.12.7                # Chart library
```

### Other Utilities
```
sonner: ^1.5.0                   # Toast notifications
next-themes: ^0.3.0              # Theme management
react-day-picker: ^8.10.1         # Date picker
cmdk: ^1.0.0                     # Command menu
input-otp: ^1.2.4                # OTP input component
embla-carousel-react: ^8.3.0      # Carousel component
react-resizable-panels: ^2.1.3    # Resizable panels
vaul: ^0.9.3                     # Drawer component
```

## Development Dependencies

### TypeScript & Type Definitions
```
typescript: ^5.5.3
@types/node: ^22.5.5
@types/react: ^18.3.3
@types/react-dom: ^18.3.0
@types/crypto-js: ^4.2.2
@types/puppeteer: ^7.0.4
```

### Linting & Code Quality
```
eslint: ^9.9.0
@eslint/js: ^9.9.0
typescript-eslint: ^8.0.1
eslint-plugin-react-hooks: ^5.1.0-rc.0
eslint-plugin-react-refresh: ^0.4.9
globals: ^15.9.0
```

### CSS Processing
```
postcss: ^8.4.47
autoprefixer: ^10.4.20
@tailwindcss/typography: ^0.5.15
```

### Build Tools
```
lovable-tagger: ^1.1.7           # Development tool
```

## Backend API Requirements

### Base URL
```
http://localhost:3000
```

### Required API Endpoints

#### User Management
- `GET /admin/getusers` - List users with pagination
- `GET /admin/getusers?id={id}&type=edit` - Get user by ID
- `POST /admin/createuser` - Create new user
- `PATCH /admin/updateuser` - Update user
- `DELETE /admin/deleteuser?user_id={id}` - Delete user
- `GET /support/getuserdetails?email={email}` - Get user details

#### Dashboard
- `GET /webhook/admindashboard` - Admin dashboard statistics

### Authentication Headers Required
```
jwt_token: <JWT token>
session_id: <Session ID>
apikey: <Supabase API key>
authorization: Bearer <JWT token>
accept-profile: <Profile name>
content-profile: <Profile name>
content-type: application/json
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# Optional: Development settings
VITE_APP_ENV=development
```

## Browser Support

### Supported Browsers
- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

### Minimum Browser Versions
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Installation Steps

1. **Install Node.js** (v18+)
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   ```

2. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd expert-claims-new
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Dependency Management

### Adding New Dependencies
```bash
# Production dependency
npm install <package-name>

# Development dependency
npm install -D <package-name>
```

### Updating Dependencies
```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update specific package
npm install <package-name>@latest
```

### Security Audits
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Known Compatibility Notes

1. **Puppeteer**: Requires Node.js v18+ and may need additional system dependencies on Linux
2. **Supabase**: Ensure your Supabase project is properly configured
3. **React Query**: Compatible with React 18+ concurrent features
4. **Vite**: Requires Node.js v18+ for optimal performance

## Performance Considerations

- **Bundle Size**: Use code splitting for large components
- **Images**: Optimize images before adding to `public/` directory
- **API Calls**: Implement proper caching with React Query
- **Build Time**: Development builds are fast; production builds may take 30-60 seconds

## Troubleshooting Dependencies

### Common Issues

1. **Peer dependency warnings**
   - Usually safe to ignore if application runs correctly
   - Can be resolved by installing peer dependencies explicitly

2. **Node version mismatch**
   - Use `nvm` to switch Node.js versions
   - Ensure `.nvmrc` file exists (if using nvm)

3. **Build errors**
   - Clear cache: `rm -rf node_modules package-lock.json && npm install`
   - Check Node.js version compatibility

4. **Type errors**
   - Run `npm run build` to check TypeScript errors
   - Ensure all type definitions are installed

---

**Last Updated**: [Current Date]
**Maintained By**: ExpertClaims Development Team

