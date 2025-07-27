import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, UsersIcon } from '@/common/Icons.jsx';

const CompetitionCard = ({ competition }) => {
    const navigate = useNavigate();

    if (!competition) {
        return null; 
    }

    const handleViewCompetition = () => {
        if (competition.id) {
            navigate(`/competition/${competition.id}`);
        }
    };

    const startDate = competition.startDate?.seconds 
        ? new Date(competition.startDate.seconds * 1000).toLocaleDateString() 
        : 'N/A';
    const endDate = competition.endDate?.seconds 
        ? new Date(competition.endDate.seconds * 1000).toLocaleDateString() 
        : 'N/A';

    const participantCount = Array.isArray(competition.participants) 
        ? competition.participants.length 
        : 0;

    return (
        <div onClick={handleViewCompetition} className="glass-card p-6 rounded-lg flex flex-col hover:bg-accent transition-all duration-200 cursor-pointer">
            <h3 className="text-2xl font-bold text-card-foreground mb-2">{competition.name || 'Untitled Competition'}</h3>
            <p className="text-muted-foreground mb-4 flex-grow">{competition.description || 'No description available.'}</p>
            <div className="flex items-center text-muted-foreground text-sm mb-4">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>{startDate} - {endDate}</span>
            </div>
            <div className="flex items-center text-muted-foreground text-sm">
                <UsersIcon className="w-4 h-4 mr-2" />
                <span>{participantCount} participants</span>
            </div>
        </div>
    );
};

export default CompetitionCard;
