import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/api/firebase';

// **FIXED**: Added the 'export' keyword.
export const useLeaderboard = (competitionId) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId) {
        setLoading(false);
        return;
    };

    const participantsRef = collection(db, 'competitions', competitionId, 'participants');
    const q = query(participantsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const participants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // In a real app, you would sort by portfolio value
      setLeaderboard(participants);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching leaderboard: ", err);
      setError("Failed to load leaderboard.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [competitionId]);

  return { leaderboard, loading, error };
};
