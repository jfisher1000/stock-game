import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAllUsers, getAllCompetitions, getApiLogs } from '@/api/firebaseAPI';
import { format } from 'date-fns';

// --- Sub-components for each tab ---

const AnalyticsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const apiLogs = await getApiLogs();
        setLogs(apiLogs);
        setError(null);
      } catch (err) {
        setError('Failed to fetch API logs. You may not have admin privileges.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div>Loading Analytics...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Usage Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>API Function</TableHead>
              <TableHead>Symbol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.timestamp ? format(log.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}</TableCell>
                <TableCell className="font-mono text-xs">{log.userId}</TableCell>
                <TableCell>{log.functionName}</TableCell>
                <TableCell>{log.params?.symbol || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const UserManagementTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const allUsers = await getAllUsers();
        setUsers(allUsers);
        setError(null);
      } catch (err) {
        setError('Failed to fetch users. You may not have admin privileges.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div>Loading Users...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-xs">{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role || 'user'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const CompetitionManagementTab = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        const allCompetitions = await getAllCompetitions();
        setCompetitions(allCompetitions);
        setError(null);
      } catch (err) {
        setError('Failed to fetch competitions.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompetitions();
  }, []);

  if (loading) return <div>Loading Competitions...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competition Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Competition Name</TableHead>
              <TableHead>Owner ID</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitions.map((comp) => (
              <TableRow key={comp.id}>
                <TableCell>{comp.name}</TableCell>
                <TableCell className="font-mono text-xs">{comp.ownerId}</TableCell>
                <TableCell>{comp.startDate ? format(comp.startDate.toDate(), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                <TableCell>{comp.endDate ? format(comp.endDate.toDate(), 'yyyy-MM-dd') : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};


const AdminPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="userManagement">User Management</TabsTrigger>
          <TabsTrigger value="competitionManagement">Competition Management</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
        <TabsContent value="userManagement">
          <UserManagementTab />
        </TabsContent>
        <TabsContent value="competitionManagement">
          <CompetitionManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
