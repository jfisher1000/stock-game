import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/api/firebase';
import { useCompetition } from '@/hooks/useCompetition';
import PortfolioView from '@/components/portfolio/PortfolioView';
import Leaderboard from '@/components/competition/Leaderboard';
import TradeModal from '@/components/portfolio/TradeModal';
import InviteModal from '@/components/competition/InviteModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Icons } from '@/components/common/Icons';

/**
 * A header component to display the main details of the competition.
 * @param {object} props - The component props.
 * @param {object} props.competition - The competition data object.
 */
const CompetitionHeader = ({ competition }) => (
  <Card className="mb-6 bg-surface shadow-md">
    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 pb-4">
      <div className="flex items-center space-x-4">
        <CardTitle className="text-2xl lg:text-3xl font-bold text-text-primary">{competition.name}</CardTitle>
        {competition.isPublic ? (
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
            Public
          </span>
        ) : (
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">
            Private
          </span>
        )}
      </div>
      <InviteModal competitionId={competition.id} competitionName={competition.name} />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-text-secondary">
        <div>
          <p className="font-semibold text-text-primary">Starting Balance</p>
          <p>{formatCurrency(competition.startingBalance)}</p>
        </div>
        <div>
          <p className="font-semibold text-text-primary">End Date</p>
          <p>{formatDate(competition.endDate)}</p>
        </div>
        <div>
          <p className="font-semibold text-text-primary">Owner</p>
          <p className="truncate" title={competition.ownerId}>{competition.ownerId}</p>
        </div>
        <div>
          <p className="font-semibold text-text-primary">Created</p>
          <p>{formatDate(competition.createdAt)}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * The main page component for viewing the details of a single competition.
 */
const CompetitionDetailPage = () => {
  const { competitionId } = useParams();
  const { user } = useAuth();
  const { competition, loading, error } = useCompetition(competitionId);
  const [isTradeModalOpen, setTradeModalOpen] = useState(false);

  // Display a loading spinner while data is being fetched.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Icons.spinner className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Display an error message if the competition fails to load.
  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="max-w-md mx-auto mt-10">
            <CardHeader>
                <CardTitle className="text-error">Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-text-secondary">{error}</p>
                <Button asChild className="mt-6">
                    <Link to="/">Return to Homepage</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  // If there's no competition, render nothing.
  if (!competition) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <CompetitionHeader competition={competition} />

      <Tabs defaultValue="portfolio" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
                <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>
            <Button onClick={() => setTradeModalOpen(true)} className="w-full sm:w-auto">
                <Icons.add className="mr-2 h-4 w-4" />
                New Trade
            </Button>
        </div>
        <TabsContent value="portfolio">
          <PortfolioView competitionId={competitionId} userId={user?.uid} />
        </TabsContent>
        <TabsContent value="leaderboard">
          <Leaderboard competitionId={competitionId} />
        </TabsContent>
      </Tabs>

      {user && (
        <TradeModal
            isOpen={isTradeModalOpen}
            onClose={() => setTradeModalOpen(false)}
            competitionId={competitionId}
            userId={user.uid}
        />
      )}
    </div>
  );
};

export default CompetitionDetailPage;
