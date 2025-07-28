import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/api/firebase';

// **FIXED**: Added the 'export' keyword.
export const usePortfolio = (competitionId, userId) => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId || !userId) {
      setLoading(false);
      return;
    }

    const portfolioRef = collection(db, 'competitions', competitionId, 'participants', userId, 'portfolio');
    const q = query(portfolioRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stocks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // In a real app, you'd fetch current prices here and calculate total value
      setPortfolio({ stocks, totalValue: 0 /* placeholder */ });
      setLoading(false);
    }, (err) => {
      console.error("Error fetching portfolio: ", err);
      setError("Failed to load portfolio.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [competitionId, userId]);

  return { portfolio, loading, error };
};
