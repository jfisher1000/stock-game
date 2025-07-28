// src/api/firebaseAPI.js

/**
 * @fileoverview Dedicated API layer for all Firebase Firestore interactions.
 *
 * This module centralizes all the application's communication with the
 * Firestore database. By abstracting database logic away from components,
 * it makes the codebase cleaner, easier to test, and more maintainable.
 * Each function is designed to handle a specific database operation, such as
 * creating a competition, fetching user data, or executing a trade.
 */

import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase'; // Assumes db and auth are initialized and exported from firebase.js

// --- User and Profile Management ---

/**
 * Fetches a user's profile from the 'users' collection.
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<object|null>} A promise that resolves to the user's data, or null if not found.
 */
export const getUserProfile = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      console.warn(`No user profile found for userId: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

// --- Competition Management ---

/**
 * Creates a new competition document in Firestore.
 * @param {object} competitionData - The data for the new competition.
 * @returns {Promise<string>} A promise that resolves to the new competition's ID.
 */
export const createCompetition = async (competitionData) => {
  try {
    const newCompetitionRef = await addDoc(collection(db, 'competitions'), {
      ...competitionData,
      ownerId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });
    return newCompetitionRef.id;
  } catch (error) {
    console.error('Error creating competition:', error);
    throw error;
  }
};

/**
 * Sends an invitation to a user to join a competition.
 * @param {string} competitionId - The ID of the competition.
 * @param {string} invitedUserId - The ID of the user being invited.
 * @returns {Promise<void>}
 */
export const sendInvitation = async (competitionId, invitedUserId) => {
    try {
        const invitationRef = doc(db, 'competitions', competitionId, 'invitations', invitedUserId);
        await setDoc(invitationRef, {
            invitedAt: serverTimestamp(),
            status: 'pending',
            inviterId: auth.currentUser.uid,
        });
        console.log(`Invitation sent to ${invitedUserId} for competition ${competitionId}`);
    } catch (error) {
        console.error('Error sending invitation:', error);
        throw error;
    }
};


// --- Trading and Portfolio Management ---

/**
 * Executes a stock trade (buy or sell) and updates the user's portfolio and cash balance
 * within a Firestore transaction to ensure atomicity.
 *
 * @param {object} tradeDetails - The details of the trade.
 * @param {string} tradeDetails.userId - The ID of the user making the trade.
 * @param {string} tradeDetails.competitionId - The ID of the competition.
 * @param {string} tradeDetails.symbol - The stock symbol.
 * @param {string} tradeDetails.tradeType - 'buy' or 'sell'.
 * @param {number} tradeDetails.quantity - The number of shares to trade.
 * @param {number} tradeDetails.price - The price per share.
 * @returns {Promise<void>} A promise that resolves when the trade is complete.
 * @throws {Error} If the transaction fails (e.g., insufficient funds or shares).
 */
export const executeTrade = async ({ userId, competitionId, symbol, tradeType, quantity, price }) => {
  if (!userId || !competitionId || !symbol || !tradeType || !quantity || !price) {
    throw new Error('Missing required parameters for executeTrade');
  }

  const participantDocRef = doc(db, 'competitions', competitionId, 'participants', userId);
  const totalCost = price * quantity;

  try {
    await runTransaction(db, async (transaction) => {
      const participantDoc = await transaction.get(participantDocRef);

      if (!participantDoc.exists()) {
        throw new Error('Participant not found in this competition.');
      }

      const participantData = participantDoc.data();
      const currentCash = participantData.cash;
      const currentPortfolio = participantData.portfolio || {};
      const currentShares = currentPortfolio[symbol]?.quantity || 0;

      if (tradeType === 'buy') {
        // --- Buy Logic ---
        if (currentCash < totalCost) {
          throw new Error('Insufficient funds to complete the purchase.');
        }

        const newCash = currentCash - totalCost;
        const newShares = currentShares + quantity;
        const newPortfolio = {
          ...currentPortfolio,
          [symbol]: {
            quantity: newShares,
            // We could store average cost here in the future
          },
        };

        transaction.update(participantDocRef, { portfolio: newPortfolio, cash: newCash });
      } else if (tradeType === 'sell') {
        // --- Sell Logic ---
        if (currentShares < quantity) {
          throw new Error('Insufficient shares to sell.');
        }

        const newCash = currentCash + totalCost;
        const newShares = currentShares - quantity;
        const newPortfolio = { ...currentPortfolio };

        if (newShares === 0) {
          delete newPortfolio[symbol]; // Remove stock from portfolio if all shares are sold
        } else {
          newPortfolio[symbol].quantity = newShares;
        }

        transaction.update(participantDocRef, { portfolio: newPortfolio, cash: newCash });
      } else {
        throw new Error(`Invalid trade type: ${tradeType}`);
      }

      // Record the transaction for historical purposes
      const transactionLogRef = collection(participantDocRef, 'transactions');
      transaction.set(doc(transactionLogRef), {
        symbol,
        tradeType,
        quantity,
        price,
        totalValue: totalCost,
        timestamp: serverTimestamp(),
      });
    });
    console.log('Trade executed successfully!');
  } catch (error) {
    console.error('Firestore transaction failed:', error);
    // Re-throw the error so the UI can display a message to the user.
    throw error;
  }
};
