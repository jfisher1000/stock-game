import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { db } from '@/api/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendInvitation } from '@/api/firebase';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react'; // Use lucide-react for icons

const InviteModal = ({ competitionId, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invited, setInvited] = useState([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', searchQuery.trim()));
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSearchResults(users);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search for users.");
    }
    setLoading(false);
  };

  const handleInvite = async (userId) => {
    try {
      await sendInvitation(competitionId, userId);
      toast.success('Invitation sent!');
      setInvited([...invited, userId]);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error(error.message || "Failed to send invitation.");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Players</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Enter user's email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {searchResults.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-2 border rounded-md">
              <span>{user.email}</span>
              <Button
                size="sm"
                onClick={() => handleInvite(user.id)}
                disabled={invited.includes(user.id)}
              >
                {invited.includes(user.id) ? 'Invited' : 'Invite'}
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
