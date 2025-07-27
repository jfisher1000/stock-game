import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users } from 'lucide-react';

const CompetitionCard = ({ competition }) => {
  const { id, name, description, startDate, endDate, participantCount } = competition;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4" />
          <span>{participantCount} participants</span>
        </div>
        <Link to={`/competition/${id}`}>
          <Button className="w-full">View Competition</Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default CompetitionCard;
