import { useState, useEffect } from 'react';
import { db, auth } from '@/api/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

/**
 * A custom hook to fetch and listen for real-time updates to a user's portfolio
 * within a specific competition.
 * @param {string} competitionId - The ID of the competition.
 * @returns {{portfolio: object|null, loading: boolean, error: Error|null}}
 */
export const usePortfolio = (competitionId) => {
  const [user] = useAuthState(auth);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ensure we have the necessary IDs before proceeding.
    if (!user || !competitionId) {
      setLoading(false);
      return;
    }

    const userId = user.uid;
    const portfolioDocRef = doc(db, 'competitions', competitionId, 'participants', userId);

    // Set up a real-time listener on the user's portfolio document.
    const unsubscribe = onSnapshot(
      portfolioDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          // If the document exists, update the portfolio state.
          setPortfolio(snapshot.data());
        } else {
          // If the document doesn't exist, it means the user is not in the competition.
          setError(new Error("Portfolio not found for this user in this competition."));
        }
        setLoading(false);
      },
      (err) => {
        // Handle any errors during the fetch.
        console.error("Error fetching portfolio:", err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup function to unsubscribe from the listener when the component unmounts.
    return () => unsubscribe();
  }, [competitionId, user]); // Rerun the effect if the competitionId or user changes.

  return { portfolio, loading, error };
};
