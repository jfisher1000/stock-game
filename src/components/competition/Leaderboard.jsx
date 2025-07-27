import React from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { formatCurrency } from '@/utils/formatters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react';

const Leaderboard = ({ competitionId }) => {
  const { leaderboard, loading, error } = useLeaderboard(competitionId);

  if (loading) return <div>Loading leaderboard...</div>;
  if (error) return <div className="text-destructive">Error: {error.message}</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Player</TableHead>
          <TableHead>Portfolio Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaderboard.map((player, index) => (
          <TableRow key={player.id}>
            <TableCell className="font-medium">
              <div className="flex items-center">
                {index === 0 && <Trophy className="h-5 w-5 text-yellow-500 mr-2" />}
                {index + 1}
              </div>
            </TableCell>
            <TableCell>{player.name || player.email}</TableCell>
            <TableCell>{formatCurrency(player.portfolioValue)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default Leaderboard;
