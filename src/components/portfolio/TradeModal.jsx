// src/components/portfolio/TradeModal.jsx

/**
 * @fileoverview A modal dialog for executing stock trades (buy/sell).
 *
 * This component provides the user interface for buying or selling a specific
 * number of shares of a given stock. It handles user input, form validation,
 * and calls the dedicated API layer to execute the trade. It also manages
 * its own loading and error states to provide clear feedback to the user.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// CORRECTED IMPORT PATH: Points to the actual location of the use-toast hook.
import { useToast } from '@/components/ui/use-toast'; 
import { executeTrade } from '@/api/firebaseApi';

const TradeModal = ({ isOpen, onOpenChange, stock, competitionId, userId }) => {
  const [tradeType, setTradeType] = useState('buy');
  const [quantity, setQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Reset state when the modal is closed or opened
  React.useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setError(null);
      setIsLoading(false);
      setTradeType('buy');
    }
  }, [isOpen]);

  const handleTrade = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('Please enter a valid quantity.');
      setIsLoading(false);
      return;
    }

    try {
      await executeTrade({
        userId,
        competitionId,
        symbol: stock.symbol,
        tradeType,
        quantity: numQuantity,
        price: stock.price,
      });

      toast({
        title: 'Success!',
        description: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${numQuantity} shares of ${stock.symbol}.`,
        variant: 'default',
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Trade execution failed:', err);
      setError(err.message || 'An unexpected error occurred during the trade.');
      toast({
        title: 'Trade Failed',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!stock) return null;

  const totalCost = (quantity && stock.price) ? (parseInt(quantity, 10) * stock.price).toFixed(2) : '0.00';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trade {stock.symbol}</DialogTitle>
        </DialogHeader>
        
        <div className="flex w-full">
          <button
            onClick={() => setTradeType('buy')}
            className={`flex-1 p-2 text-center font-semibold rounded-l-md transition-colors ${
              tradeType === 'buy' ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={`flex-1 p-2 text-center font-semibold rounded-r-md transition-colors ${
              tradeType === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Sell
          </button>
        </div>

        <form onSubmit={handleTrade}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="col-span-3"
                placeholder="0"
                min="1"
              />
            </div>
            <div className="text-sm text-center text-gray-500">
              Current Price: ${stock.price?.toFixed(2)}
            </div>
            <div className="text-lg font-bold text-center">
              Estimated Total: ${totalCost}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center mb-4">{error}</div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Processing...' : `Confirm ${tradeType === 'buy' ? 'Buy' : 'Sell'}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TradeModal;
