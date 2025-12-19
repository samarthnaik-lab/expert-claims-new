# Cache Management & Version Control

This document explains how the application handles cache clearing and version management to ensure users always see the latest version after deployments.

## Overview

The application implements automatic cache clearing when a new version is deployed. This ensures that:
- Users see the latest UI changes immediately
- localStorage is cleared when the app version changes
- Browser cache is bypassed for new deployments
- Old cached data doesn't interfere with new features

## How It Works

### 1. Version Tracking

- **App Version**: Stored in `package.json` (currently `0.0.0`)
- **Build Timestamp**: Generated at build time (unique for each deployment)
- **Storage**: Both values are stored in localStorage as:
  - `expertclaims_app_version`
  - `expertclaims_build_timestamp`

### 2. Version Check on App Load

When the app loads (`src/main.tsx`):
1. Checks if stored version matches current app version
2. Checks if stored build timestamp matches current build timestamp
3. If either differs, clears all app-related localStorage
4. Reloads the page to load fresh assets

### 3. Cache Clearing Strategy

The following localStorage keys are cleared on version change:
- All keys starting with `expertclaims_` (app data)
- All keys starting with `supabase.` (Supabase client cache)
- All keys starting with `sb-` (Supabase session data)

### 4. Build Configuration

**Vite Configuration** (`vite.config.ts`):
- Injects `VITE_APP_VERSION` and `VITE_BUILD_TIMESTAMP` as environment variables
- Configures hash-based filenames for all assets (automatic cache busting)
- Files are named like: `assets/main-abc123.js` (hash changes on content change)

**HTML Meta Tags** (`index.html`):
- Added cache control meta tags to prevent browser caching
- `Cache-Control: no-cache, no-store, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`

## Usage

### For Developers

#### Updating Version

When deploying a new version, update the version in `package.json`:

```bash
# Patch version (0.0.0 -> 0.0.1)
npm run version:patch

# Minor version (0.0.0 -> 0.1.0)
npm run version:minor

# Major version (0.0.0 -> 1.0.0)
npm run version:major

# Or manually edit package.json
```

#### Building

The build process automatically:
1. Reads version from `package.json`
2. Generates a unique build timestamp
3. Injects both as environment variables
4. Creates hash-based filenames for all assets

```bash
npm run build
```

### For Users

Users don't need to do anything. The app automatically:
- Detects new versions
- Clears old cache
- Loads fresh assets
- Shows the latest version

## Manual Cache Clearing

If needed, users can manually clear cache by:

1. **Browser DevTools**:
   - Open DevTools (F12)
   - Application tab → Clear Storage → Clear site data

2. **Programmatic** (for developers):
   ```typescript
   import { forceClearCache } from '@/utils/versionManager';
   forceClearCache(); // Clears all app cache and reloads
   ```

## Files Involved

- `src/utils/versionManager.ts` - Version checking and cache clearing logic
- `src/main.tsx` - Version check on app initialization
- `vite.config.ts` - Build configuration with version injection
- `index.html` - Cache control meta tags
- `package.json` - App version storage

## Testing

### Test Version Change

1. Build the app: `npm run build`
2. Deploy and note the version
3. Update version in `package.json`
4. Rebuild and redeploy
5. Users should see cache cleared and page reload

### Test in Development

In development mode, each build gets a unique timestamp, so cache clearing works even without version changes.

## Troubleshooting

### Issue: Users not seeing new version

**Solution**: 
- Check that version in `package.json` was updated
- Verify build timestamp is being generated
- Check browser console for version check logs
- Ensure localStorage is not being blocked

### Issue: Cache not clearing

**Solution**:
- Check browser DevTools → Application → Local Storage
- Verify `expertclaims_app_version` and `expertclaims_build_timestamp` exist
- Manually clear cache if needed
- Check for browser extensions blocking localStorage

### Issue: Too frequent cache clears

**Solution**:
- In development, this is expected (each build has new timestamp)
- In production, only update version when deploying significant changes
- Consider using semantic versioning properly

## Best Practices

1. **Version Management**:
   - Use semantic versioning (MAJOR.MINOR.PATCH)
   - Update version only when deploying
   - Document version changes in changelog

2. **Deployment**:
   - Always update version before building
   - Build timestamp is automatic (no action needed)
   - Test cache clearing in staging before production

3. **User Communication**:
   - Inform users about major updates
   - Cache clearing is automatic (no user action needed)
   - Page reload happens automatically

## Future Enhancements

Potential improvements:
- [ ] Show update notification before reload
- [ ] Allow users to defer update
- [ ] Service worker for offline support
- [ ] Version history tracking
- [ ] Rollback mechanism

---

**Last Updated**: 2025-12-17
**Maintained By**: ExpertClaims Development Team
