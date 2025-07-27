import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, UsersIcon } from '../common/Icons.jsx';

const CompetitionCard = ({ competition }) => {
    const navigate = useNavigate();

    // Don't render the card if the competition data is missing
    if (!competition) {
        return null; 
    }

    const handleViewCompetition = () => {
        // Ensure competition has an ID before navigating
        if (competition.id) {
            navigate(`/competition/${competition.id}`);
        }
    };

    // Safely access and format date properties, providing a fallback
    const startDate = competition.startDate?.seconds 
        ? new Date(competition.startDate.seconds * 1000).toLocaleDateString() 
        : 'N/A';
    const endDate = competition.endDate?.seconds 
        ? new Date(competition.endDate.seconds * 1000).toLocaleDateString() 
        : 'N/A';

    // Safely access the number of participants
    const participantCount = Array.isArray(competition.participants) 
        ? competition.participants.length 
        : 0;

    return (
        <div onClick={handleViewCompetition} className="glass-card p-6 rounded-lg flex flex-col hover:bg-gray-700/50 transition-all duration-200 cursor-pointer">
            <h3 className="text-2xl font-bold text-white mb-2">{competition.name || 'Untitled Competition'}</h3>
            <p className="text-gray-400 mb-4 flex-grow">{competition.description || 'No description available.'}</p>
            <div className="flex items-center text-gray-400 text-sm mb-4">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>{startDate} - {endDate}</span>
            </div>
            <div className="flex items-center text-gray-400 text-sm">
                <UsersIcon className="w-4 h-4 mr-2" />
                <span>{participantCount} participants</span>
            </div>
        </div>
    );
};

export default CompetitionCard;
