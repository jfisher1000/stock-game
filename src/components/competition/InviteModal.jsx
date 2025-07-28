// src/components/competition/InviteModal.jsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
// CORRECTED: Import 'sendInvitation' from the centralized firebaseAPI module.
import { sendInvitation } from '@/api/firebaseAPI';

const InviteModal = ({ isOpen, onOpenChange, competitionId }) => {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!userId.trim()) {
      toast({ title: 'Error', description: 'Please enter a User ID.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await sendInvitation(competitionId, userId.trim());
      toast({ title: 'Success!', description: `Invitation sent to user ${userId}.` });
      onOpenChange(false);
      setUserId('');
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast({ title: 'Error', description: 'Failed to send invitation. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a Friend</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleInvite}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="userId" className="text-right">
                User ID
              </Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="col-span-3"
                placeholder="Enter your friend's User ID"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
