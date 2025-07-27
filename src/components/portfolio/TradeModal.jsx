import React, { useState, useEffect } from 'react';
import { getQuote } from '@/api/alphaVantage';
import { executeTrade } from '@/api/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/formatters';
import toast from 'react-hot-toast';

const TradeModal = ({ symbol, competitionId, onTrade, user, portfolio }) => {
  // ... (component logic remains the same)
};

export default TradeModal;
