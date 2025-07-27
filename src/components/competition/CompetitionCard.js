import React from 'react';
import { formatDate, formatCurrency, getCompetitionStatus } from '../../utils/formatters';
import { CalendarIcon, UsersIcon, TrophyIcon, TrashIcon } from '../common/Icons';

const CompetitionCard = ({ user, competition, onClick, onDelete, onJoin, rank, totalParticipants }) => {
    const status = getCompetitionStatus(competition.startDate, competition.endDate);
    const isOwner = user.uid === competition.ownerId;
    const isAdmin = user.role === 'admin';
    
    const handleDelete = (e) => {
        e.stopPropagation(); 
        onDelete();
    };

    return (
        <div className="glass-card p-6 rounded-lg flex flex-col hover:border-primary/50 border border-transparent transition-all">
            <div onClick={onClick} className="cursor-pointer flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold mb-2">{competition.name}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${status.color}`}>{status.text}</span>
                </div>
                <p className="text-gray-400">Owner: {competition.ownerName}</p>
                <p className="text-gray-400">Starts with {formatCurrency(competition.startingCash)}</p>
                <div className="mt-4 space-y-2">
                    <div className="flex items-center text-gray-300 text-sm">
                        <CalendarIcon />
                        <span className="ml-2">
                            {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
                        </span>
                    </div>
                    <div className="flex items-center text-gray-300 text-sm">
                        <UsersIcon />
                        <span className="ml-2">{totalParticipants || (competition.participantIds || []).length} players</span>
                    </div>
                    {rank && (
                        <div className="flex items-center text-yellow-400 text-sm font-bold">
                            <TrophyIcon />
                            <span className="ml-2">Your Rank: {rank} / {totalParticipants}</span>
                        </div>
                    )}
                </div>
            </div>
            {(isAdmin || isOwner) && onDelete && (
                <div className="border-t border-white/10 mt-4 pt-4 flex justify-end">
                    <button onClick={handleDelete} className="text-danger hover:text-red-400 flex items-center gap-1 text-sm">
                        <TrashIcon className="w-4 h-4" /> Delete
                    </button>
                </div>
            )}
            {onJoin && (
                 <button 
                    onClick={onJoin}
                    className="mt-4 w-full bg-primary hover:opacity-90 text-white font-bold py-2 rounded-md transition duration-300">
                    Join Competition
                </button>
            )}
        </div>
    );
};

export default CompetitionCard;
