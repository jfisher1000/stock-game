import React from 'react';

export const ConfirmDeleteModal = ({ title, body, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="glass-card p-8 rounded-lg w-full max-w-md text-white text-center">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <p className="mb-6">{body}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="py-2 px-6 rounded-md hover:bg-white/10">Cancel</button>
                <button onClick={onConfirm} className="py-2 px-6 rounded-md bg-danger hover:opacity-90">Delete</button>
            </div>
        </div>
    </div>
);

export const InactivityWarningModal = ({ onStay, onLogout, countdown }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="glass-card p-8 rounded-lg w-full max-w-md text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Are you still there?</h2>
            <p className="mb-6">You've been inactive for a while. For your security, we'll log you out in {countdown} seconds.</p>
            <div className="flex justify-center gap-4">
                <button onClick={onLogout} className="py-2 px-6 rounded-md hover:bg-white/10">Logout</button>
                <button onClick={onStay} className="py-2 px-6 rounded-md bg-primary hover:opacity-90">Stay Logged In</button>
            </div>
        </div>
    </div>
);
