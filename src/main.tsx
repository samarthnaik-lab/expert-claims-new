import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { checkVersionAndClearCache } from './utils/versionManager'

// Check version and clear cache if needed before rendering app
// This ensures users get the latest version after deployment
const shouldReload = checkVersionAndClearCache();

// Only render if we're not about to reload
if (!shouldReload) {
  createRoot(document.getElementById("root")!).render(<App />);
}
