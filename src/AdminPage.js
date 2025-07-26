import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import {
    doc,
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    setDoc,
    deleteDoc
} from 'firebase/firestore';

// --- Helper Components & Functions ---

const formatDate = (ts) => ts ? new Date(ts.seconds * 1000).toLocaleDateString() : 'N/A';

const TrashIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;

const SimpleBarChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <p className="text-center text-gray-400">No API usage data to display.</p>;
    }

    const maxValue = Math.max(...data.map(d => d.calls), 0);
    const chartHeight = 300;
    const barWidth = 30;
    const barMargin = 15;
    const chartWidth = data.length * (barWidth + barMargin);
    
    const labelInterval = Math.max(1, Math.floor(120 / (barWidth + barMargin)));

    return (
        <div className="overflow-x-auto p-4">
            <svg width={chartWidth} height={chartHeight + 40} className="font-sans">
                <g className="text-xs text-gray-400 fill-current">
                    <text x="0" y={chartHeight - chartHeight + 15} dy=".32em">{maxValue}</text>
                    <text x="0" y={chartHeight / 2} dy=".32em">{Math.round(maxValue / 2)}</text>
                    <text x="0" y={chartHeight} dy=".32em">0</text>
                </g>
                
                {data.map((d, i) => {
                    const barHeight = maxValue > 0 ? (d.calls / maxValue) * chartHeight : 0;
                    const x = i * (barWidth + barMargin) + 40;
                    const y = chartHeight - barHeight;
                    const showLabel = i % labelInterval === 0;

                    return (
                        <g key={d.timeLabel}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                className="fill-current text-indigo-500 hover:text-indigo-400 transition-colors"
                            />
                            {showLabel && (
                                <text
                                    x={x + barWidth / 2}
                                    y={chartHeight + 20}
                                    textAnchor="middle"
                                    className="text-xs text-gray-300 fill-current"
                                >
                                    {d.timeLabel}
                                </text>
                            )}
                        </g>
                    );
                })}
                <line x1="35" y1="0" x2="35" y2={chartHeight} stroke="rgba(255, 255, 255, 0.2)" />
                <line x1="35" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="rgba(255, 255, 255, 0.2)" />
            </svg>
        </div>
    );
};

const ConfirmDeleteModal = ({ competitionName, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="glass-card p-8 rounded-lg w-full max-w-md text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to permanently delete the competition "{competitionName}"? This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="py-2 px-6 rounded-md hover:bg-white/10">Cancel</button>
                <button onClick={onConfirm} className="py-2 px-6 rounded-md bg-danger hover:opacity-90">Delete</button>
            </div>
        </div>
    </div>
);

const CompetitionManagement = ({ competitions, onDelete }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="bg-white/10">
                <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Owner</th>
                    <th className="p-4">End Date</th>
                    <th className="p-4">Players</th>
                    <th className="p-4">Actions</th>
                </tr>
            </thead>
            <tbody>
                {competitions.map((comp) => (
                    <tr key={comp.id} className="border-b border-white/10 last:border-b-0">
                        <td className="p-4 font-bold">{comp.name}</td>
                        <td className="p-4 text-gray-300">{comp.ownerName}</td>
                        <td className="p-4 text-gray-300">{formatDate(comp.endDate)}</td>
                        <td className="p-4 text-gray-300">{comp.participantIds.length}</td>
                        <td className="p-4">
                            <button onClick={() => onDelete(comp)} className="text-danger hover:text-red-400">
                                <TrashIcon />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {competitions.length === 0 && <p className="text-center text-gray-400 p-8">No competitions found.</p>}
    </div>
);


const AdminPage = () => {
    const [apiStats, setApiStats] = useState({ total: 0, avgPerMinute: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(10);
    const [inputInterval, setInputInterval] = useState(10);
    const [saveStatus, setSaveStatus] = useState('');
    const [chartData, setChartData] = useState([]);
    const [allCompetitions, setAllCompetitions] = useState([]);
    const [competitionToDelete, setCompetitionToDelete] = useState(null);

    const settingsRef = doc(db, 'app_settings', 'market_data');

    useEffect(() => {
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const unsubscribeLogs = onSnapshot(query(collection(db, 'api_logs'), where('timestamp', '>=', twoDaysAgo)), (snapshot) => {
            const calls = snapshot.docs.map(doc => doc.data().timestamp.toDate());
            
            const callsByHour = calls.reduce((acc, callTime) => {
                const hourKey = new Date(callTime.getFullYear(), callTime.getMonth(), callTime.getDate(), callTime.getHours()).toISOString();
                acc[hourKey] = (acc[hourKey] || 0) + 1;
                return acc;
            }, {});

            const formattedData = Object.entries(callsByHour)
                .sort(([hourA], [hourB]) => new Date(hourA) - new Date(hourB))
                .map(([hourISO, count]) => {
                    const date = new Date(hourISO);
                    return {
                        timeLabel: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`,
                        calls: count,
                    };
                });

            setChartData(formattedData);

            const recentCalls = calls.filter(call => call.getTime() > (Date.now() - 2 * 60 * 60 * 1000));
            const totalCalls = recentCalls.length;
            const avg = totalCalls > 0 ? totalCalls / 120 : 0;
            setApiStats({ total: totalCalls, avgPerMinute: avg.toFixed(2) });
            setLoading(false);
        }, (error) => {
            console.error("Error fetching API logs:", error);
            setLoading(false);
        });

        const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
            if (doc.exists()) {
                const interval = doc.data().refreshIntervalMinutes;
                setRefreshInterval(interval);
                setInputInterval(interval);
            } else {
                setDoc(settingsRef, { refreshIntervalMinutes: 10, lastRunTimestamp: null });
            }
        });

        // New listener for all competitions
        const compsQuery = query(collection(db, 'competitions'));
        const unsubscribeCompetitions = onSnapshot(compsQuery, (snapshot) => {
            const fetchedComps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllCompetitions(fetchedComps);
        }, (error) => {
            console.error("Error fetching competitions:", error);
        });

        return () => {
            unsubscribeLogs();
            unsubscribeSettings();
            unsubscribeCompetitions();
        };
    }, []);

    const handleSaveInterval = async () => {
        setSaveStatus('Saving...');
        const newInterval = parseInt(inputInterval, 10);
        if (isNaN(newInterval) || newInterval < 1) {
            setSaveStatus('Error: Please enter a number greater than 0.');
            return;
        }
        try {
            await updateDoc(settingsRef, { refreshIntervalMinutes: newInterval });
            setSaveStatus('Saved successfully!');
        } catch (error) {
            console.error("Error updating interval:", error);
            setSaveStatus('Error: Could not save settings.');
        }
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const handleDeleteClick = (competition) => {
        setCompetitionToDelete(competition);
    };

    const handleConfirmDelete = async () => {
        if (!competitionToDelete) return;
        try {
            // Note: This deletes the competition document, but not its subcollections 
            // (participants, invitations) due to Firestore limitations on client-side deletes.
            // A Cloud Function would be needed for a full recursive delete.
            await deleteDoc(doc(db, 'competitions', competitionToDelete.id));
        } catch (error) {
            console.error("Error deleting competition:", error);
        } finally {
            setCompetitionToDelete(null);
        }
    };

    return (
        <div className="p-8 text-white">
            {competitionToDelete && (
                <ConfirmDeleteModal 
                    competitionName={competitionToDelete.name}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setCompetitionToDelete(null)}
                />
            )}

            <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-6 rounded-lg lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-4">API Usage (Last 48 Hours)</h2>
                    {loading ? <p>Loading chart...</p> : <SimpleBarChart data={chartData} />}
                </div>

                <div className="glass-card p-6 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">API Stats (Last 2 Hours)</h2>
                    {loading ? <p>Loading stats...</p> : (
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-400">Total Calls</p>
                                <p className="text-3xl font-bold">{apiStats.total}</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Average Calls / Minute</p>
                                <p className="text-3xl font-bold">{apiStats.avgPerMinute}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="glass-card p-6 rounded-lg">
                     <h2 className="text-2xl font-bold mb-4">App Settings</h2>
                     <div className="space-y-2">
                        <label className="block text-gray-300">Market Data Refresh Interval (minutes)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                value={inputInterval}
                                onChange={(e) => setInputInterval(e.target.value)}
                                className="w-full bg-black/20 p-3 rounded-md border border-white/20" 
                            />
                            <button onClick={handleSaveInterval} className="py-3 px-5 rounded-md bg-primary hover:opacity-90">Save</button>
                        </div>
                        {saveStatus && <p className="text-sm mt-2">{saveStatus}</p>}
                        <p className="text-xs text-gray-400">This controls how often the server fetches new stock prices. Minimum is 1 minute.</p>
                     </div>
                </div>

                <div className="glass-card p-6 rounded-lg lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-4">Competition Management</h2>
                    <CompetitionManagement competitions={allCompetitions} onDelete={handleDeleteClick} />
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
