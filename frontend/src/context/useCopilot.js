import { useContext } from 'react';
import CopilotContext from './CopilotContext';

/**
 * Hook to use Copilot context
 */
export const useCopilot = () => {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error('useCopilot must be used within CopilotProvider');
  }
  return context;
};

export default useCopilot;
