import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAllUsers, getAllCompetitions, getApiLogs } from '@/api/firebaseAPI';
import { format, subDays, startOfHour, startOfMinute, isAfter } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

  const analyticsData = useMemo(() => {
    if (!logs.length) return null;

    const now = new Date();
    const twentyFourHoursAgo = subDays(now, 1);

    const recentLogs = logs.filter(log =>
      log.timestamp && isAfter(log.timestamp.toDate(), twentyFourHoursAgo)
    );

    const alphaVantageCalls = logs.filter(log =>
      log.functionName?.includes('searchStocks') || log.functionName?.includes('getQuote')
    ).length;

    const callsByHour = recentLogs.reduce((acc, log) => {
      const hour = format(startOfHour(log.timestamp.toDate()), 'yyyy-MM-dd HH:mm');
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(callsByHour)
      .map(([time, calls]) => ({ name: format(new Date(time), 'ha'), calls }))
      .sort((a, b) => new Date(a.time) - new Date(b.time));


    const callsByMinute = recentLogs.reduce((acc, log) => {
        const minute = format(startOfMinute(log.timestamp.toDate()), 'yyyy-MM-dd HH:mm');
        acc[minute] = (acc[minute] || 0) + 1;
        return acc;
    }, {});

    const peakCallsPerMinute = Math.max(0, ...Object.values(callsByMinute));

    return {
      totalApiCalls: logs.length,
      alphaVantageCalls,
      peakCallsPerMinute,
      chartData,
    };
  }, [logs]);


  if (loading) return <div>Loading Analytics...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!analyticsData) return <div>No API log data available.</div>;

  return (
    <div className="space-y-4">
        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Total API Calls (All Time)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.totalApiCalls}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Alpha Vantage Calls (All Time)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.alphaVantageCalls}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Peak Calls/Minute (Last 24h)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.peakCallsPerMinute}</div>
                </CardContent>
            </Card>
        </div>

        {/* Chart */}
        <Card>
            <CardHeader>
                <CardTitle>API Calls in Last 24 Hours</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="calls" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Raw Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Raw API Usage Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>API Function</TableHead>
                  <TableHead>Parameters</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.timestamp ? format(log.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}</TableCell>
                    <TableCell className="font-mono text-xs">{log.userId}</TableCell>
                    <TableCell>{log.functionName}</TableCell>
                    <TableCell className="font-mono text-xs">{log.params ? JSON.stringify(log.params) : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
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
