import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import {
    doc,
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    setDoc
} from 'firebase/firestore';

// --- Dependency-Free Bar Chart Component (with label fix) ---
const SimpleBarChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <p className="text-center text-gray-400">No API usage data to display.</p>;
    }

    const maxValue = Math.max(...data.map(d => d.calls), 0);
    const chartHeight = 300;
    const barWidth = 30;
    const barMargin = 15;
    const chartWidth = data.length * (barWidth + barMargin);
    
    // Determine the interval to show labels to avoid overlap.
    // Show a label roughly every 120px.
    const labelInterval = Math.max(1, Math.floor(120 / (barWidth + barMargin)));


    return (
        <div className="overflow-x-auto p-4">
            <svg width={chartWidth} height={chartHeight + 40} className="font-sans">
                {/* Y-Axis Labels */}
                <g className="text-xs text-gray-400 fill-current">
                    <text x="0" y={chartHeight - chartHeight + 15} dy=".32em">{maxValue}</text>
                    <text x="0" y={chartHeight / 2} dy=".32em">{Math.round(maxValue / 2)}</text>
                    <text x="0" y={chartHeight} dy=".32em">0</text>
                </g>
                
                {/* Bars and X-Axis Labels */}
                {data.map((d, i) => {
                    const barHeight = maxValue > 0 ? (d.calls / maxValue) * chartHeight : 0;
                    const x = i * (barWidth + barMargin) + 40; // Offset for Y-axis labels
                    const y = chartHeight - barHeight;
                    
                    // FIX: Only render a label if it's at the calculated interval to prevent overlap
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
                 {/* Y-Axis Line */}
                <line x1="35" y1="0" x2="35" y2={chartHeight} stroke="rgba(255, 255, 255, 0.2)" />
                {/* X-Axis Line */}
                <line x1="35" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="rgba(255, 255, 255, 0.2)" />
            </svg>
        </div>
    );
};


const AdminPage = () => {
    const [apiStats, setApiStats] = useState({ total: 0, avgPerMinute: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(10);
    const [inputInterval, setInputInterval] = useState(10);
    const [saveStatus, setSaveStatus] = useState('');
    const [chartData, setChartData] = useState([]);

    const settingsRef = doc(db, 'app_settings', 'market_data');

    // Fetch initial settings
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
                // If the settings doc doesn't exist, create it with a default value
                setDoc(settingsRef, { refreshIntervalMinutes: 10, lastRunTimestamp: null });
            }
        });

        return () => {
            unsubscribeLogs();
            unsubscribeSettings();
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

    return (
        <div className="p-8 text-white">
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
            </div>
        </div>
    );
};

export default AdminPage;
