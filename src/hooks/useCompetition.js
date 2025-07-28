import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/api/firebase';

/**
 * A custom hook to fetch and subscribe to a single competition document from Firestore.
 *
 * @param {string} competitionId - The ID of the competition to fetch.
 * @returns {object} An object containing the competition data, loading state, and any errors.
 */
export const useCompetition = (competitionId) => {
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If there's no competitionId, don't attempt to fetch.
    if (!competitionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Create a reference to the specific competition document.
    const docRef = doc(db, 'competitions', competitionId);

    // Set up a real-time listener on the document.
    // This will automatically update the component whenever the data changes in Firestore.
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          // If the document exists, spread its data and add the ID to our state.
          setCompetition({ id: docSnap.id, ...docSnap.data() });
          setError(null);
        } else {
          // If the document doesn't exist, set an error.
          setError('Competition not found.');
          setCompetition(null);
        }
        setLoading(false);
      },
      (err) => {
        // Handle any errors that occur during the fetch.
        console.error('Error fetching competition:', err);
        setError('Failed to load competition data.');
        setLoading(false);
      }
    );

    // Cleanup function: Unsubscribe from the listener when the component unmounts
    // or when the competitionId changes, to prevent memory leaks.
    return () => unsubscribe();
  }, [competitionId]); // Rerun the effect if the competitionId changes.

  return { competition, loading, error };
};
