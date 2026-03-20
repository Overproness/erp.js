import { useEffect, useRef } from 'react';
import { useCopilot } from '../context/useCopilot';

/**
 * Hook to easily set up copilot for a specific module/page
 * Usage:
 *   useCopilotModule('customer', { entityId: customerId, data: customerData });
 */
export const useCopilotModule = (module, context = {}) => {
  const { setModuleContext } = useCopilot();
  const previousRef = useRef({ module: '', entityId: '' });

  useEffect(() => {
    // Only update if module or entityId changed
    const currentKey = `${module}-${context.entityId || ''}`;
    const prevKey = `${previousRef.current.module}-${previousRef.current.entityId || ''}`;

    if (currentKey !== prevKey) {
      setModuleContext(module, context);
      previousRef.current = { module, entityId: context.entityId };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, context.entityId]);
};

export default useCopilotModule;
