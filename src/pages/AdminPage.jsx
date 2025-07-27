import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../api/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
// Corrected the import path for the icons
import { UsersIcon, DollarSignIcon, ActivityIcon } from '../components/common/Icons.jsx';

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

            <Tabs defaultValue="users">
                <TabsList>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="competitions">Competitions</TabsTrigger>
                </TabsList>
                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Joined On</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.createdAt?.toDate().toLocaleDateString() || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="competitions">
                     <Card>
                        <CardHeader>
                            <CardTitle>Competition Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Owner ID</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {competitions.map(comp => (
                                        <TableRow key={comp.id}>
                                            <TableCell>{comp.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{comp.ownerId}</TableCell>
                                            <TableCell>
                                                <Badge variant={comp.isPublic ? 'default' : 'secondary'}>
                                                    {comp.isPublic ? 'Public' : 'Private'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminPage;
