import React from 'react';
import PendingInvitations from '../components/competition/PendingInvitations';

const AlertsPage = ({ user }) => {
    return (
        <div className="p-8 text-white">
            <h1 className="text-4xl font-bold mb-6">Alerts</h1>
            <PendingInvitations user={user} />
            {/* You can add other types of alerts here in the future */}
        </div>
    );
};

export default AlertsPage;
