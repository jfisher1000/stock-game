import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../api/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Temporarily removed Tabs and Table imports to isolate the issue
import { UsersIcon, DollarSignIcon, ActivityIcon } from '../common/Icons.jsx';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const competitionsSnapshot = await getDocs(collection(db, 'competitions'));
                setCompetitions(competitionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching admin data:", err);
                setError("Failed to load admin dashboard data.");
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Loading admin dashboard...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-destructive">{error}</div>;
    }

    const totalUsers = users.length;
    const totalCompetitions = competitions.length;
    const publicCompetitions = competitions.filter(c => c.isPublic).length;

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Competitions</CardTitle>
                        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCompetitions}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Public Competitions</CardTitle>
                        <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{publicCompetitions}</div>
                    </CardContent>
                </Card>
            </div>

            {/* The Tabs and Table components have been temporarily removed for debugging. */}
            <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>User and Competition data will be displayed here.</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">More details coming soon.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminPage;
