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
            setError(null); // Reset error on new fetch
            try {
                const q = query(collection(db, 'competitions'), where('isPublic', '==', true));
                const querySnapshot = await getDocs(q);

                // Process and validate the data from Firestore
                const comps = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(comp => {
                        // Ensure each competition has the essential data before trying to render it
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

    // Display a loading message while fetching data
    if (loading) {
        return <div className="p-8 text-white text-center">Loading public competitions...</div>;
    }

    // Display an error message if the fetch failed
    if (error) {
        return <div className="p-8 text-white text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-8 text-white">
            <h1 className="text-4xl font-bold mb-6">Explore Public Competitions</h1>
            
            {/* Ensure competitions is an array before mapping and handle empty state */}
            {Array.isArray(competitions) && competitions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {competitions.map(comp => (
                        <CompetitionCard key={comp.id} competition={comp} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-400">No public competitions found.</p>
                </div>
            )}
        </div>
    );
};

export default ExplorePage;
