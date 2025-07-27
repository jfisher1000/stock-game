// This file centralizes all environment variables for the application.
// It reads from Vite's `import.meta.env` object and provides a single,
// validated source of truth for configuration.

// --- Validation ---
// A list of all environment variables required by the application.
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_ALPHA_VANTAGE_API_KEY',
];

// This loop checks if all required variables are present in the environment.
// If a variable is missing, it throws an error to stop the application
// immediately, preventing runtime errors from misconfiguration.
for (const varName of requiredEnvVars) {
  if (import.meta.env[varName] === undefined) {
    throw new Error(`FATAL: Missing required environment variable "${varName}". Please check your .env file.`);
  }
}

// --- Exported Configuration ---
// The validated variables are exported in a structured object for clean,
// predictable access throughout the application.
export const env = {
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },
  alphaVantage: {
    apiKey: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY,
  },
  // We can also export Vite's mode flags for conditional logic in the app.
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};
