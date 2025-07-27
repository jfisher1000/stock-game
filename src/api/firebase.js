// src/api/firebase.js

/**
 * @fileoverview Firebase Service Initialization and Core Utilities.
 *
 * This module initializes the Firebase app with the configuration from the
 * centralized environment module. It exports the initialized app instance,
 * along with key Firebase service instances like Firestore and Auth.
 * This ensures that all other parts of the application use a single,
 * consistent Firebase setup.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Import the centralized environment configuration.
import env from '../config/environment';

// Initialize the Firebase app using the configuration from the 'env' object.
// This is the single point of initialization for the entire application.
const app = initializeApp(env.firebase);

// Get instances of the core Firebase services.
const db = getFirestore(app);
const auth = getAuth(app);

// Export the initialized services for use throughout the application.
export { app, db, auth };
