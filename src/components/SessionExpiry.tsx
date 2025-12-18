import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component to display session expiration time in the navbar
 */
export const SessionExpiry: React.FC = () => {
  const { session } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    if (!session?.expiresAt) {
      setTimeRemaining('');
      return;
    }

    const updateTimeRemaining = () => {
      const now = Date.now();
      const expiresAt = session.expiresAt;
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        setIsExpiringSoon(true);
        return;
      }

      // Check if expiring within 1 hour
      setIsExpiringSoon(remaining < 60 * 60 * 1000);

      // Calculate time components
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      // Format display
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        setTimeRemaining(`${days}d ${remainingHours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    // Update immediately
    updateTimeRemaining();

    // Update every second
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [session?.expiresAt]);

  if (!session?.expiresAt || !timeRemaining) {
    return null;
  }

  return (
    <div
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all ${
        isExpiringSoon
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-white/10 border-white/20 text-white'
      }`}
    >
      {isExpiringSoon ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">
        {isExpiringSoon ? 'Expires in: ' : 'Session: '}
        <span className="font-semibold">{timeRemaining}</span>
      </span>
    </div>
  );
};
