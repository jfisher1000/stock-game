import { useState, useEffect } from 'react';
import { db } from '@/api/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

/**
 * A custom hook to fetch and listen for real-time updates to a competition's leaderboard.
 * @param {string} competitionId - The ID of the competition.
 * @returns {{leaderboard: Array<object>, loading: boolean, error: Error|null}}
 */
export const useLeaderboard = (competitionId) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId) {
      setLoading(false);
      return;
    }

    const participantsColRef = collection(db, 'competitions', competitionId, 'participants');
    const q = query(participantsColRef);

    // Set up a real-time listener on the participants collection.
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const participants = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort the participants by total portfolio value in descending order.
        participants.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));

        setLeaderboard(participants);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching leaderboard:", err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup function to unsubscribe from the listener.
    return () => unsubscribe();
  }, [competitionId]); // Rerun the effect if the competitionId changes.

  return { leaderboard, loading, error };
};
