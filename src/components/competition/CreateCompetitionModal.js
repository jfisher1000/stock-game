import React, { useState } from 'react';
import { db } from '../../api/firebase';
import { addDoc, collection, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';

const CreateCompetitionModal = ({ user, onClose }) => {
    const [name, setName] = useState('');
    const [startingCash, setStartingCash] = useState(100000);
    const [isPublic, setIsPublic] = useState(true);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [durationNumber, setDurationNumber] = useState(2);
    const [durationType, setDurationType] = useState('Weeks');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Competition name is required.');
            return;
        }
        setLoading(true);

        const start = new Date(startDate);
        const end = new Date(start);
        if (durationType === 'Days') {
            end.setDate(start.getDate() + durationNumber);
        } else if (durationType === 'Weeks') {
            end.setDate(start.getDate() + durationNumber * 7);
        } else if (durationType === 'Months') {
            end.setMonth(start.getMonth() + durationNumber);
        } else if (durationType === 'Years') {
            end.setFullYear(start.getFullYear() + durationNumber);
        }
        
        const startDateTimestamp = Timestamp.fromDate(start);
        const endDateTimestamp = Timestamp.fromDate(end);


        try {
            const competitionRef = await addDoc(collection(db, 'competitions'), {
                name,
                startingCash,
                isPublic,
                ownerId: user.uid,
                ownerName: user.username,
                createdAt: serverTimestamp(),
                startDate: startDateTimestamp,
                endDate: endDateTimestamp,
                participantIds: [user.uid]
            });

            const participantRef = doc(db, 'competitions', competitionRef.id, 'participants', user.uid);
            await setDoc(participantRef, {
                username: user.username,
                portfolioValue: startingCash,
                cash: startingCash,
                joinedAt: serverTimestamp(),
                holdings: {}
            });

            onClose();
        } catch (err) {
            setError('Failed to create competition. Please try again.');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-8 rounded-lg w-full max-w-md text-white">
                <h2 className="text-2xl font-bold mb-6">Create New Competition</h2>
                <form onSubmit={handleCreate}>
                    <div className="mb-4">
                        <label className="block mb-2">Competition Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/20 p-3 rounded-md border border-white/20" required/>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Starting Cash</label>
                        <input type="number" value={startingCash} onChange={e => setStartingCash(Number(e.target.value))} className="w-full bg-black/20 p-3 rounded-md border border-white/20" />
                    </div>
                     <div className="mb-4">
                        <label className="block mb-2">Start Date</label>
                        <input type="date" value={startDate} min={new Date().toISOString().split('T')[0]} onChange={e => setStartDate(e.target.value)} className="w-full bg-black/20 p-3 rounded-md border border-white/20" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Duration</label>
                        <div className="flex gap-2">
                            <input type="number" value={durationNumber} min="1" onChange={e => setDurationNumber(Number(e.target.value))} className="w-1/3 bg-black/20 p-3 rounded-md border border-white/20" />
                            <select value={durationType} onChange={e => setDurationType(e.target.value)} className="w-2/3 bg-black/20 p-3 rounded-md border border-white/20">
                                <option>Days</option>
                                <option>Weeks</option>
                                <option>Months</option>
                                <option>Years</option>
                            </select>
                        </div>
                    </div>
                    <div className="mb-6 flex items-center">
                        <input type="checkbox" id="isPublic" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                        <label htmlFor="isPublic" className="ml-2">Publicly visible</label>
                    </div>
                    {error && <p className="text-danger mb-4">{error}</p>}
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-md hover:bg-white/10">Cancel</button>
                        <button type="submit" disabled={loading} className="py-2 px-4 rounded-md bg-primary hover:opacity-90 disabled:opacity-50">{loading ? 'Creating...' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCompetitionModal;
