import React from 'react';
import PortfolioView from '@/components/portfolio/PortfolioView';
import StockSearchView from '@/components/portfolio/StockSearchView';
import DetailedPortfolioView from '@/components/portfolio/DetailedPortfolioView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const HomePage = () => {
  return (
    <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioView />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Detailed Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailedPortfolioView />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Search & Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <StockSearchView />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
