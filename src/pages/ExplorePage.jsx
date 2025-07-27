import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../api/firebase';
import CompetitionCard from '../components/competition/CompetitionCard.jsx';

const ExplorePage = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCompetitions = async () => {
            setLoading(true);
            setError(null);
            try {
                const q = query(collection(db, 'competitions'), where('isPublic', '==', true));
                const querySnapshot = await getDocs(q);

                const comps = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(comp => {
                        if (!comp.id || !comp.name) {
                            console.warn("Filtered out invalid competition data:", comp);
                            return false;
                        }
                        return true;
                    });
                
                setCompetitions(comps);

            } catch (err) {
                console.error("Error fetching public competitions: ", err);
                setError("Could not load competitions. Please try again later.");
            }
            setLoading(false);
        };

        fetchCompetitions();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Loading public competitions...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-destructive">{error}</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-6">Explore Public Competitions</h1>
            
            {Array.isArray(competitions) && competitions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {competitions.map(comp => (
                        <CompetitionCard key={comp.id} competition={comp} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 glass-card">
                    <p className="text-muted-foreground">No public competitions found.</p>
                </div>
            )}
        </div>
    );
};

export default ExplorePage;
