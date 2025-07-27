import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, runTransaction, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { env } from '@/config/environment'; // Import the centralized config

// Initialize Firebase using the validated config from our environment module.
const app = initializeApp(env.firebase);

export const db = getFirestore(app);
export const auth = getAuth(app);

// --- User Management ---
export const createUserProfileDocument = async (userAuth, additionalData) => {
  // ... (rest of the function remains the same)
};

// --- Competition Management ---
export const createCompetition = async (competitionData) => {
  // ... (rest of the function remains the same)
};

// --- Trading ---
export const executeTrade = async (tradeDetails) => {
  // ... (rest of the function remains the same)
};

// --- Invitations ---
export const sendInvitation = async (competitionId, invitedUserId) => {
  // ... (rest of the function remains the same)
};

export const respondToInvitation = async (invitationId, accept) => {
  // ... (rest of the function remains the same)
};
