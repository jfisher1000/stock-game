import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../api/firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const CreateCompetitionModal = ({ onClose }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startingBalance, setStartingBalance] = useState(100000);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const user = auth.currentUser;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !startDate || !endDate) {
            setError('Please fill out all required fields.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await addDoc(collection(db, 'competitions'), {
                name,
                description,
                startingBalance,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isPublic,
                ownerId: user.uid,
                participantIds: [user.uid],
                participants: [{
                    userId: user.uid,
                    username: user.displayName || 'Anonymous',
                    portfolio: { cash: startingBalance, holdings: [] }
                }],
                createdAt: serverTimestamp()
            });
            onClose();
        } catch (err) {
            console.error("Error creating competition: ", err);
            setError('Failed to create competition. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg shadow-xl p-8 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-2">Create a New Competition</h2>
                <p className="text-muted-foreground mb-6">Fill in the details below to start a new competition.</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Competition Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Q3 Trading Challenge" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the rules and goals of your competition." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-date">Start Date</Label>
                                <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date">End Date</Label>
                                <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="starting-balance">Starting Balance</Label>
                            <Input id="starting-balance" type="number" value={startingBalance} onChange={(e) => setStartingBalance(Number(e.target.value))} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="isPublic" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                            <Label htmlFor="isPublic">Make this competition public</Label>
                        </div>
                    </div>
                    
                    {error && <p className="text-destructive mt-4">{error}</p>}

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Competition'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCompetitionModal;
