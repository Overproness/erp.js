import { useContext } from 'react';
import { MarketingContext } from './MarketingContext';

// Custom hook to use the marketing context
export const useMarketing = () => {
  const context = useContext(MarketingContext);

  if (!context) {
    throw new Error('useMarketing must be used within a MarketingProvider');
  }

  return context;
};
