// src/config/environment.js

/**
 * @fileoverview Centralized configuration for environment variables.
 *
 * This module imports all environment variables from Vite's `import.meta.env`,
 * validates that the required variables are present, and exports them in a
 * structured configuration object. This approach provides a single source of
 * truth for configuration and helps prevent runtime errors due to missing
 * .env file setups.
 */

// Extract raw environment variables from Vite's import.meta.env object.
const VITE_ENV = import.meta.env;

// --- Firebase Configuration ---
// Assemble the Firebase configuration object from environment variables.
const firebaseConfig = {
  apiKey: VITE_ENV.VITE_FIREBASE_API_KEY,
  authDomain: VITE_ENV.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_ENV.VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_ENV.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_ENV.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_ENV.VITE_FIREBASE_APP_ID,
};

// --- Alpha Vantage Configuration ---
// Assemble the Alpha Vantage configuration object.
const alphaVantageConfig = {
  apiKey: VITE_ENV.VITE_ALPHA_VANTAGE_API_KEY,
};

// --- Validation ---
// Create a map of all required variables and their values for validation.
const requiredVariables = {
  ...firebaseConfig,
  ...alphaVantageConfig,
};

// Iterate over the map of required variables.
for (const [key, value] of Object.entries(requiredVariables)) {
  // If a value is undefined, null, or an empty string, it's considered missing.
  if (!value) {
    // Throw a descriptive error to halt execution and inform the developer.
    // This prevents the app from running with an incomplete or invalid configuration.
    throw new Error(`FATAL ERROR: Missing required environment variable: VITE_${key.toUpperCase()}`);
  }
}

// --- Export ---
// Export a single, immutable configuration object.
const env = Object.freeze({
  firebase: firebaseConfig,
  alphaVantage: alphaVantageConfig,
  isDevelopment: VITE_ENV.DEV,
  isProduction: VITE_ENV.PROD,
});

export default env;
